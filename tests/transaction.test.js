const request = require('supertest');
const app = require('../app');

describe('GET /api/transactions', () => {
  it('should return a list of transactions', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
