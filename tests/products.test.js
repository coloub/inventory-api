const request = require('supertest');
const app = require('../server');
const { createTestUserAndToken, createTestProducts, generateInvalidToken } = require('./helpers/testHelpers');

describe('Products API', () => {
  let authToken;
  let user;

  beforeEach(async () => {
    // Create test user and get auth token
    const result = await createTestUserAndToken();
    user = result.user;
    authToken = result.token;
  });

  describe('GET /api/v1/products', () => {
    test('should return empty array when no products exist', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    test('should return products when they exist', async () => {
      // Create test products
      await createTestProducts(3);

      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(3);

      // Check product structure
      const product = response.body.data[0];
      expect(product).toHaveProperty('_id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('quantity');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('vendor');
      expect(product).toHaveProperty('createdAt');
      expect(product).toHaveProperty('updatedAt');
    });

    test('should return 401 when no authentication token provided', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied. No token provided.');
    });

    test('should return 401 when invalid token provided', async () => {
      const invalidToken = generateInvalidToken();

      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied. Invalid token.');
    });

    test('should return 401 when malformed token provided', async () => {
      const response = await request(app)
        .get('/api/v1/products')
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
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied. User not found.');
    });
  });
});