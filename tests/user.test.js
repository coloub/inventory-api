const request = require('supertest');
const app = require('../server');
const { createTestUserAndToken, generateInvalidToken } = require('./helpers/testHelpers');

describe('User API', () => {
  let authToken;
  let user;

  beforeEach(async () => {
    // Create test user and get auth token
    const result = await createTestUserAndToken();
    user = result.user;
    authToken = result.token;
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

    test('should return user with correct role', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user.role).toBe('user');
    });

    test('should return admin user profile for admin users', async () => {
      // Create admin user
      const adminResult = await createTestUserAndToken('admin');
      const adminToken = adminResult.token;

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user.role).toBe('admin');
    });

    test('should return 401 when no authentication token provided', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied. No token provided.');
    });

    test('should return 401 when invalid token provided', async () => {
      const invalidToken = generateInvalidToken();

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied. Invalid token.');
    });

    test('should return 401 when malformed token provided', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-format')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied. Invalid token.');
    });

    test('should return 401 when user does not exist', async () => {
      const jwt = require('jsonwebtoken');
      const fakeToken = jwt.sign(
        { id: '507f1f77bcf86cd799439011' }, // Non-existent user ID
        process.env.JWT_SECRET || 'test-jwt-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied. User not found.');
    });

    test('should return 401 when user account is deactivated', async () => {
      // Deactivate the user
      user.isActive = false;
      await user.save();

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied. User account is deactivated.');
    });

    test('should handle expired token', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { 
          id: user._id,
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET || 'test-jwt-secret-key',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied. Token has expired.');
    });

    test('should handle missing Bearer prefix in Authorization header', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', authToken) // Missing "Bearer " prefix
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied. No token provided.');
    });
  });
});