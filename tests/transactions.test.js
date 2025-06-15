const request = require('supertest');
const app = require('../server');
const { createTestUserAndToken, generateInvalidToken } = require('./helpers/testHelpers');

describe('Transactions API', () => {
  let authToken;
  let user;

  beforeEach(async () => {
    // Create test user and get auth token
    const result = await createTestUserAndToken();
    user = result.user;
    authToken = result.token;
  });

  describe('GET /api/v1/transactions', () => {
    test('should return response when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      
      // Handle both array and object responses safely
      if (response.body.data) {
        expect(Array.isArray(response.body.data) || typeof response.body.data === 'object').toBe(true);
      }
      
      // If it's an array, it should handle empty responses
      if (Array.isArray(response.body.data)) {
        expect(response.body.data.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('should return 401 when no authentication token provided', async () => {
      const response = await request(app)
        .get('/api/v1/transactions')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/Access denied/i);
    });

    test('should return 401 when invalid token provided', async () => {
      const invalidToken = generateInvalidToken();

      const response = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/Access denied/i);
    });

    test('should return 401 when malformed token provided', async () => {
      const response = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', 'Bearer invalid-token-format')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/Access denied/i);
    });

    test('should return 401 when user does not exist', async () => {
      const jwt = require('jsonwebtoken');
      const fakeToken = jwt.sign(
        { id: '507f1f77bcf86cd799439011' }, // Non-existent user ID
        process.env.JWT_SECRET || 'test-jwt-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/User not found/i);
    });

    test('should accept token from Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    test('should handle missing Bearer prefix in Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', authToken) // Missing "Bearer " prefix
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied. No token provided.');
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
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/expired/i);
    });
  });
});