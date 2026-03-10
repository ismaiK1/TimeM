/**
 * Tests routes stats — GET late-rate, avg-hours (auth requise)
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('Stats', () => {
  it('GET /stats/late-rate sans auth retourne 401', async () => {
    const res = await request(app).get('/stats/late-rate');
    assert.strictEqual(res.status, 401);
  });

  it('GET /stats/avg-hours sans auth retourne 401', async () => {
    const res = await request(app).get('/stats/avg-hours');
    assert.strictEqual(res.status, 401);
  });

  it('GET /stats/late-rate avec token invalide retourne 401', async () => {
    const res = await request(app).get('/stats/late-rate').set('Authorization', 'Bearer invalid');
    assert.strictEqual(res.status, 401);
  });

  it('GET /stats/avg-hours avec token invalide retourne 401', async () => {
    const res = await request(app).get('/stats/avg-hours').set('Authorization', 'Bearer invalid');
    assert.strictEqual(res.status, 401);
  });

  it('GET /stats/late-rate avec auth retourne 200 et structure', { skip: !process.env.DATABASE_URL }, async () => {
    const loginRes = await request(app).post('/auth/login').send({ email: 'employee@timemanager.local', password: 'password123' });
    if (loginRes.status !== 200) return;
    const token = loginRes.body.token;
    const res = await request(app).get('/stats/late-rate').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body.rate === 'number');
    assert.ok(Number.isInteger(res.body.lateCount));
    assert.ok(Number.isInteger(res.body.totalCount));
  });

  it('GET /stats/avg-hours avec auth retourne 200 et structure', { skip: !process.env.DATABASE_URL }, async () => {
    const loginRes = await request(app).post('/auth/login').send({ email: 'employee@timemanager.local', password: 'password123' });
    if (loginRes.status !== 200) return;
    const token = loginRes.body.token;
    const res = await request(app).get('/stats/avg-hours').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.byDay));
    assert.ok(typeof res.body.avgHoursPerDay === 'number');
  });
});
