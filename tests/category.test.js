const request = require('supertest');
const app = require('../app');

describe('GET /api/categories', () => {
  it('should return a list of categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
