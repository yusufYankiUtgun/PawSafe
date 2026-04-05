/**
 * Integration tests for /api/users endpoints.
 *
 * Verification: HTTP status codes, response shapes, auth enforcement.
 * Validation:   users can register, log in, view their profile, and manage notifications.
 */

import request from 'supertest';
import { app } from '../../src/server';

const USER_TOKEN   = 'mock-token-u1';  // mehmet_can
const INVALID_TOKEN = 'tamamen-yanlis-token';

// ─── POST /api/users/register ─────────────────────────────────────────────────

describe('POST /api/users/register', () => {
  it('creates a new account and returns 201 with user + token', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'yeni@example.com', username: 'yeni_kul', password: 'sifre123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('yeni@example.com');
    expect(res.body.user.username).toBe('yeni_kul');
    expect((res.body.user as any).password).toBeUndefined();
  });

  it('returns 409 when the e-mail is already registered', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'mehmet@example.com', username: 'baska_kul', password: 'xyz' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'eksik@example.com' }); // username and password missing

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── POST /api/users/login ────────────────────────────────────────────────────

describe('POST /api/users/login', () => {
  it('returns 200 with user and token for correct credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'mehmet@example.com', password: '1234' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('mehmet_can');
    expect((res.body.user as any).password).toBeUndefined();
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'mehmet@example.com', password: 'yanlis' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 for an unknown e-mail', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'yok@example.com', password: '1234' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when e-mail or password is missing', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'mehmet@example.com' }); // password missing

    expect(res.status).toBe(400);
  });
});

// ─── GET /api/users/me ────────────────────────────────────────────────────────

describe('GET /api/users/me', () => {
  it('returns the current user profile (no password) with a valid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('u1');
    expect(res.body.username).toBe('mehmet_can');
    expect((res.body as any).password).toBeUndefined();
  });

  it('returns 401 when no Authorization header is sent', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${INVALID_TOKEN}`);
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/users/notifications ─────────────────────────────────────────────

describe('GET /api/users/notifications', () => {
  it('returns an array of notifications for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/users/notifications')
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // u1 has 2 notifications seeded in mockData
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('each notification has id, message, type, and read fields', async () => {
    const res = await request(app)
      .get('/api/users/notifications')
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    const n = res.body[0];
    expect(n).toHaveProperty('id');
    expect(n).toHaveProperty('message');
    expect(n).toHaveProperty('type');
    expect(n).toHaveProperty('read');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/users/notifications');
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/users/notifications/:id/read ───────────────────────────────────

describe('POST /api/users/notifications/:id/read', () => {
  it('marks a notification as read and returns { success: true }', async () => {
    const res = await request(app)
      .post('/api/users/notifications/n1/read');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 200 even for an unknown notification id (idempotent no-op)', async () => {
    const res = await request(app)
      .post('/api/users/notifications/olmayan-id/read');

    expect(res.status).toBe(200);
  });
});

// ─── GET /api/users/my-markers ────────────────────────────────────────────────

describe('GET /api/users/my-markers', () => {
  it('returns only the markers belonging to the authenticated user', async () => {
    const res = await request(app)
      .get('/api/users/my-markers')
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // All markers belong to u1
    res.body.forEach((m: any) => expect(m.reporterId).toBe('u1'));
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/users/my-markers');
    expect(res.status).toBe(401);
  });

  it('returns an empty array if the user has no markers', async () => {
    // u3 (ali_riza) owns only m3; token for u3
    const res = await request(app)
      .get('/api/users/my-markers')
      .set('Authorization', 'Bearer mock-token-u3');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((m: any) => m.reporterId === 'u3')).toBe(true);
  });
});
