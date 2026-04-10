import * as mysql from 'mysql2/promise';
import { mockUsers, mockMarkers } from './mockData';

let pool: mysql.Pool | null = null;

/** Returns the active pool, or null when running in in-memory mode. */
export function getPool(): mysql.Pool | null {
  return pool;
}

/**
 * Initialise the MySQL connection pool and ensure tables + seed data exist.
 * If DB_HOST is not set the function is a no-op; all repositories fall back
 * to their in-memory stores and tests continue to work unchanged.
 */
export async function initDb(): Promise<void> {
  if (!process.env.DB_HOST) return; // in-memory mode — nothing to do

  pool = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME     || 'pawsafe',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit:    10,
  });

  await createTables();
  await seedIfEmpty();
}

async function createTables(): Promise<void> {
  const p = pool!;

  await p.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id          VARCHAR(64)  PRIMARY KEY,
      username    VARCHAR(100) NOT NULL,
      email       VARCHAR(255) NOT NULL UNIQUE,
      password    VARCHAR(255) NOT NULL,
      trust_score INT          NOT NULL DEFAULT 0,
      role        ENUM('user','admin') NOT NULL DEFAULT 'user'
    )
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS markers (
      id               VARCHAR(64)  PRIMARY KEY,
      lat              DOUBLE       NOT NULL,
      lng              DOUBLE       NOT NULL,
      image_url        TEXT,
      description      TEXT,
      reporter_id      VARCHAR(64)  NOT NULL,
      reporter_name    VARCHAR(100) NOT NULL,
      validation_count INT          NOT NULL DEFAULT 0,
      dispute_count    INT          NOT NULL DEFAULT 0,
      created_at       VARCHAR(32)  NOT NULL,
      animal_count     INT          NOT NULL DEFAULT 1,
      size             VARCHAR(16),
      color            VARCHAR(32),
      ear_tag_color    VARCHAR(32),
      classification   VARCHAR(16),
      address          TEXT
    )
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS validations (
      id          VARCHAR(64) PRIMARY KEY,
      marker_id   VARCHAR(64) NOT NULL,
      user_id     VARCHAR(64) NOT NULL,
      type        ENUM('validate','dispute') NOT NULL,
      created_at  VARCHAR(32) NOT NULL,
      reason      VARCHAR(32),
      explanation TEXT,
      UNIQUE KEY uq_marker_user (marker_id, user_id)
    )
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS images (
      marker_id   VARCHAR(64)  PRIMARY KEY,
      filename    VARCHAR(255) NOT NULL,
      url         TEXT         NOT NULL,
      uploaded_at VARCHAR(32)  NOT NULL
    )
  `);
}

async function seedIfEmpty(): Promise<void> {
  const p = pool!;

  const [rows] = await p.execute('SELECT COUNT(*) AS cnt FROM users');
  const count = (rows as any[])[0].cnt as number;
  if (count > 0) return; // already seeded

  for (const u of mockUsers) {
    await p.execute(
      'INSERT IGNORE INTO users (id, username, email, password, trust_score, role) VALUES (?,?,?,?,?,?)',
      [u.id, u.username, u.email, u.password, u.trustScore, u.role],
    );
  }

  for (const m of mockMarkers) {
    await p.execute(
      `INSERT IGNORE INTO markers
         (id, lat, lng, image_url, description, reporter_id, reporter_name,
          validation_count, dispute_count, created_at, animal_count,
          size, color, ear_tag_color, classification, address)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        m.id, m.lat, m.lng, m.imageUrl || '', m.description,
        m.reporterId, m.reporterName, m.validationCount, m.disputeCount,
        m.createdAt, m.animalCount,
        m.size ?? null, m.color ?? null, m.earTagColor ?? null,
        m.classification ?? null, m.address ?? null,
      ],
    );
  }
}
