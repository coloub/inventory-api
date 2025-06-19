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
