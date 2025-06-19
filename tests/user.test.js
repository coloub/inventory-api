const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const { createTestUserAndToken, generateInvalidToken } = require('./helpers/testHelpers');

describe('User API', () => {
  let authToken;
  let user;

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
    // Create test user and get auth token
    const result = await createTestUserAndToken();
    user = result.user;
    authToken = result.token;
  });

  describe('POST /auth/signup', () => {
    test('should create a new regular user successfully', async () => {
      const newUser = {
        displayName: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
        role: 'user'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user).toHaveProperty('email', newUser.email.toLowerCase());
      expect(response.body.user).toHaveProperty('role', 'user');
    });

    test('should create a new admin user with valid adminSecret', async () => {
      const newAdmin = {
        displayName: 'Admin User',
        email: 'adminuser@example.com',
        password: 'Password123!',
        role: 'admin',
        adminSecret: process.env.JWT_SECRET
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(newAdmin)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user).toHaveProperty('email', newAdmin.email.toLowerCase());
      expect(response.body.user).toHaveProperty('role', 'admin');
    });

    test('should fail signup if required fields are missing', async () => {
      const incompleteUser = {
        email: 'incomplete@example.com',
        password: 'Password123!',
        role: 'user'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(incompleteUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/Display name, email, and password are required/);
    });

    test('should fail signup if role is invalid', async () => {
      const invalidRoleUser = {
        displayName: 'Invalid Role',
        email: 'invalidrole@example.com',
        password: 'Password123!',
        role: 'superuser'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(invalidRoleUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/Role must be either "user" or "admin"/);
    });

    test('should fail admin signup if adminSecret is missing', async () => {
      const adminNoSecret = {
        displayName: 'Admin No Secret',
        email: 'adminnosecret@example.com',
        password: 'Password123!',
        role: 'admin'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(adminNoSecret)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/adminSecret is required for admin role/);
    });

    test('should fail admin signup if adminSecret is invalid', async () => {
      const adminInvalidSecret = {
        displayName: 'Admin Invalid Secret',
        email: 'admininvalidsecret@example.com',
        password: 'Password123!',
        role: 'admin',
        adminSecret: 'invalidsecret'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(adminInvalidSecret)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/Invalid adminSecret/);
    });

    test('should fail signup if email already exists', async () => {
      const existingUser = {
        displayName: 'Existing User',
        email: 'existinguser@example.com',
        password: 'Password123!',
        role: 'user'
      };

      // Create user first
      await request(app)
        .post('/auth/signup')
        .send(existingUser)
        .expect(201);

      // Try to create again with same email
      const response = await request(app)
        .post('/auth/signup')
        .send(existingUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/Email already in use/);
    });
  });

  describe('GET /auth/me', () => {
    test('should return current user profile when authenticated', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      
      const returnedUser = response.body.user;
      expect(returnedUser).toHaveProperty('id');
      expect(returnedUser).toHaveProperty('displayName', 'Test User');
      expect(returnedUser).toHaveProperty('email');
      expect(returnedUser).toHaveProperty('role');
      expect(returnedUser).toHaveProperty('avatar');
      expect(returnedUser).toHaveProperty('createdAt');
      
      // Should not return sensitive data
      expect(returnedUser).not.toHaveProperty('googleId');
      expect(returnedUser).not.toHaveProperty('isActive');
      expect(returnedUser).not.toHaveProperty('lastLogin');
    });

    // ... other existing tests unchanged ...
  });
});
