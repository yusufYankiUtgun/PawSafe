/**
 * Integration tests for /api/admin endpoints.
 *
 * Verification: admin-only guard (401/403), correct response shapes.
 * Validation:   admin can list/delete markers, list users, and view stats.
 */

import request from 'supertest';
import { app } from '../../src/server';

const ADMIN_TOKEN = 'mock-token-admin';
const USER_TOKEN  = 'mock-token-u1';    // regular user — must be denied

// ─── GET /api/admin/markers ───────────────────────────────────────────────────

describe('GET /api/admin/markers', () => {
  it('returns all markers for the admin', async () => {
    const res = await request(app)
      .get('/api/admin/markers')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/admin/markers');
    expect(res.status).toBe(401);
  });

  it('returns 403 when a regular user tries to access', async () => {
    const res = await request(app)
      .get('/api/admin/markers')
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/admin/markers/:id ───────────────────────────────────────────

describe('DELETE /api/admin/markers/:id', () => {
  it('deletes a marker and returns { success: true }', async () => {
    const res = await request(app)
      .delete('/api/admin/markers/m7')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when the marker does not exist', async () => {
    const res = await request(app)
      .delete('/api/admin/markers/olmayan-marker')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 403 for a regular user', async () => {
    const res = await request(app)
      .delete('/api/admin/markers/m1')
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).delete('/api/admin/markers/m1');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  it('returns a user list without passwords', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    res.body.forEach((u: any) => {
      expect(u).toHaveProperty('id');
      expect(u).toHaveProperty('username');
      expect(u).toHaveProperty('role');
      expect((u as any).password).toBeUndefined();
    });
  });

  it('returns 403 for a regular user', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

describe('GET /api/admin/stats', () => {
  it('returns stats with all required fields', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.totalMarkers).toBe('number');
    expect(typeof res.body.totalUsers).toBe('number');
    expect(typeof res.body.totalValidations).toBe('number');
    expect(typeof res.body.totalDisputes).toBe('number');
  });

  it('totalUsers excludes admins', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    // 6 regular users seeded in mockData
    expect(res.body.totalUsers).toBe(6);
  });

  it('totalMarkers is a positive integer', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.body.totalMarkers).toBeGreaterThan(0);
    expect(Number.isInteger(res.body.totalMarkers)).toBe(true);
  });

  it('totalValidations and totalDisputes are non-negative integers', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.body.totalValidations).toBeGreaterThanOrEqual(0);
    expect(res.body.totalDisputes).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(res.body.totalValidations)).toBe(true);
    expect(Number.isInteger(res.body.totalDisputes)).toBe(true);
  });

  it('returns 403 for a regular user', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    expect(res.status).toBe(403);
  });
});
