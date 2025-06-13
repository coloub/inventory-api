const request = require('supertest');
const app = require('../app');

describe('GET /api/products', () => {
  it('should return an array of products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});
