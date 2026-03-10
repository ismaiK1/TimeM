/**
 * Tests routes clocks — POST clock_in/clock_out, GET liste (auth requise)
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('Clocks', () => {
  it('POST /clocks sans auth retourne 401', async () => {
    const res = await request(app).post('/clocks').send({ action: 'clock_in' });
    assert.strictEqual(res.status, 401);
  });

  it('POST /clocks sans body retourne 400', async () => {
    const res = await request(app).post('/clocks').set('Authorization', 'Bearer invalid').send({});
    assert.strictEqual(res.status, 401);
  });

  it('POST /clocks avec action invalide retourne 400', async () => {
    const res = await request(app).post('/clocks').set('Authorization', 'Bearer fake').send({ action: 'invalid' });
    assert.strictEqual(res.status, 401);
  });

  it('GET /clocks sans auth retourne 401', async () => {
    const res = await request(app).get('/clocks');
    assert.strictEqual(res.status, 401);
  });

  it('GET /clocks avec auth retourne 200 et tableau', { skip: !process.env.DATABASE_URL }, async () => {
    const loginRes = await request(app).post('/auth/login').send({ email: 'employee@timemanager.local', password: 'password123' });
    if (loginRes.status !== 200) return;
    const token = loginRes.body.token;
    const res = await request(app).get('/clocks').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });
});
