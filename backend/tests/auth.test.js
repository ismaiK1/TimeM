/**
 * Test login — nécessite BDD + seed
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('Auth', () => {
  it('POST /auth/login sans body retourne 400', async () => {
    const res = await request(app).post('/auth/login').send({});
    assert.strictEqual(res.status, 400);
  });

  it('POST /auth/login avec email invalide retourne 400', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'invalid', password: 'x' });
    assert.strictEqual(res.status, 400);
  });

  it('POST /auth/login avec mauvais identifiants retourne 401', { skip: !process.env.DATABASE_URL }, async () => {
    const res = await request(app).post('/auth/login').send({ email: 'nonexistent@test.local', password: 'wrong' });
    assert.strictEqual(res.status, 401);
  });
});
