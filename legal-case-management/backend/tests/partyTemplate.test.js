const request = require('supertest');
const jwt = require('jsonwebtoken');

// ensure test env
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// create a valid token used by authenticate middleware
const token = jwt.sign({ userId: 1, username: 'testuser', role: 'admin' }, process.env.JWT_SECRET);

let app;

beforeAll(() => {
  // require app after setting env and token
  app = require('../src/app');
});

describe('GET /api/parties/import/template', () => {
  it('should return an xlsx file with 200', async () => {
    const res = await request(app)
      .get('/api/parties/import/template')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.headers['content-type']).toMatch(/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
    // response body should be a buffer
    expect(res.body).toBeDefined();
    expect(res.body.length).toBeGreaterThan(0);
  });
});
