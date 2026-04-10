import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

// Data layer
import { initDb, getPool } from './data/db';
import { UserRepository } from './data/UserRepository';
import { MarkerRepository } from './data/MarkerRepository';
import { ValidationRepository } from './data/ValidationRepository';
import { ImageRepository } from './data/ImageRepository';

// Business layer
import { AuthService } from './business/AuthService';
import { MarkerService } from './business/MarkerService';
import { ValidationService } from './business/ValidationService';
import { ImageUploadService } from './business/ImageUploadService';
import { TrustScoreObserver } from './business/TrustScoreObserver';
import { NotificationObserver } from './business/NotificationObserver';
import { LeaderboardObserver } from './business/LeaderboardObserver';

// API routes
import { createMarkersRouter } from './api/markers';
import { createUsersRouter } from './api/users';
import { createValidationsRouter } from './api/validations';
import { createAdminRouter } from './api/admin';

// --- Express app ---
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../public')));
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

/**
 * Wire up repositories, services, observers, and API routes.
 * Must be called BEFORE the HTML catch-all routes so that /api/* paths
 * are matched by the API routers and not swallowed by the wildcard.
 */
function wireUp(): void {
  const pool = getPool();

  const userRepo       = new UserRepository(pool);
  const markerRepo     = new MarkerRepository(pool);
  const validationRepo = new ValidationRepository(pool);
  const imageRepo      = new ImageRepository(pool);

  const authService        = new AuthService(userRepo);
  const markerService      = new MarkerService(markerRepo, userRepo);
  const imageUploadService = new ImageUploadService(imageRepo);
  const validationService  = new ValidationService(validationRepo, markerRepo);

  // Observer pattern wiring
  const trustScoreObserver = new TrustScoreObserver(userRepo);
  const notificationObserver = new NotificationObserver();
  const leaderboardObserver  = new LeaderboardObserver(userRepo);

  validationService.subscribe(trustScoreObserver);
  validationService.subscribe(notificationObserver);
  validationService.subscribe(leaderboardObserver);

  // API routes — registered FIRST so they take priority over the catch-all below
  app.use('/api/markers',     createMarkersRouter(markerService, authService, imageUploadService));
  app.use('/api/users',       createUsersRouter(authService, notificationObserver, markerService));
  app.use('/api/validations', createValidationsRouter(validationService, authService, leaderboardObserver));
  app.use('/api/admin',       createAdminRouter(authService, markerService, userRepo));

  // HTML page routes — registered AFTER API routes
  app.get('/leaderboard', (_req, res) => res.sendFile(path.join(__dirname, '../public/leaderboard.html')));
  app.get('/profile',     (_req, res) => res.sendFile(path.join(__dirname, '../public/profile.html')));
  app.get('/shelter',     (_req, res) => res.sendFile(path.join(__dirname, '../public/shelter.html')));
  app.get('/donation',    (_req, res) => res.sendFile(path.join(__dirname, '../public/donation.html')));
  app.get('/admin',       (_req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));
  app.get('/login',       (_req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
  app.get('*',            (_req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
}

export { app }; // export for integration tests

// --- Bootstrap ---
async function bootstrap(): Promise<void> {
  await initDb(); // no-op when DB_HOST is unset (in-memory mode)
  wireUp();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`PawSafe running at http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  bootstrap().catch(err => {
    console.error('Startup failed:', err);
    process.exit(1);
  });
} else {
  // When imported by tests, wire up immediately (pool is null → in-memory mode).
  wireUp();
}
