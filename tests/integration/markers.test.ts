/**
 * Integration tests for the /api/markers endpoints.
 *
 * Tests use supertest against the real Express app (no mocks for the
 * HTTP layer).  Data is in-memory so each test suite starts fresh.
 *
 * Verification: correct HTTP status codes and JSON shapes.
 * Validation:   users can create markers; unauthenticated access is blocked.
 */

import request from 'supertest';
import { app } from '../../src/server';

const USER_TOKEN = 'mock-token-u1';
const ADMIN_TOKEN = 'mock-token-admin';

describe('GET /api/markers', () => {
  it('returns an array of markers (no auth required)', async () => {
    const res = await request(app).get('/api/markers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('each marker has required fields', async () => {
    const res = await request(app).get('/api/markers');
    const marker = res.body[0];
    expect(marker).toHaveProperty('id');
    expect(marker).toHaveProperty('lat');
    expect(marker).toHaveProperty('lng');
    expect(marker).toHaveProperty('reporterName');
    expect(marker).toHaveProperty('validationCount');
    expect(marker).toHaveProperty('disputeCount');
  });
});

describe('GET /api/markers/:id', () => {
  it('returns a single marker by id', async () => {
    const res = await request(app).get('/api/markers/m1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('m1');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/markers/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/markers', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/markers')
      .send({ lat: 41.0, lng: 28.9, size: 'medium', color: 'siyah', earTagColor: 'yok', classification: 'friendly' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when required dog fields are missing', async () => {
    const res = await request(app)
      .post('/api/markers')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ lat: 41.0, lng: 28.9 }); // missing size, color, etc.
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('creates a marker with valid data and returns 201', async () => {
    const res = await request(app)
      .post('/api/markers')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .field('lat', '41.01')
      .field('lng', '28.96')
      .field('size', 'medium')
      .field('color', 'siyah')
      .field('earTagColor', 'yok')
      .field('classification', 'friendly')
      .field('description', 'Test marker')
      .field('animalCount', '1');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.reporterName).toBe('mehmet_can');
    expect(res.body.validationCount).toBe(0);
  });

  it('rejects an image upload with wrong MIME type', async () => {
    const fakeGif = Buffer.from('GIF89a');

    const res = await request(app)
      .post('/api/markers')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .field('lat', '41.01')
      .field('lng', '28.96')
      .field('size', 'small')
      .field('color', 'beyaz')
      .field('earTagColor', 'mavi')
      .field('classification', 'aggressive')
      .attach('image', fakeGif, { filename: 'test.gif', contentType: 'image/gif' });

    // Marker is created but imageWarning is set (non-fatal image error)
    expect(res.status).toBe(201);
    expect(res.body.imageWarning).toBeDefined();
  });
});

describe('DELETE /api/markers/:id', () => {
  it('returns 403 when a user tries to delete someone else\'s marker', async () => {
    // m2 belongs to u2 (ayse_kaya), we use u1's token
    const res = await request(app)
      .delete('/api/markers/m2')
      .set('Authorization', `Bearer ${USER_TOKEN}`);
    expect(res.status).toBe(403);
  });

  it('admin can delete any marker', async () => {
    const res = await request(app)
      .delete('/api/markers/m8')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
