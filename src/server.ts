import express from 'express';
import cors from 'cors';
import path from 'path';

// Data layer
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

// --- Wire up singletons ---
const userRepo = new UserRepository();
const markerRepo = new MarkerRepository();
const validationRepo = new ValidationRepository();
const imageRepo = new ImageRepository();

const authService = new AuthService(userRepo);
const markerService = new MarkerService(markerRepo, userRepo);
const imageUploadService = new ImageUploadService(imageRepo);
const validationService = new ValidationService(validationRepo, markerRepo);

// Observer pattern wiring
const trustScoreObserver = new TrustScoreObserver(userRepo);
const notificationObserver = new NotificationObserver();
const leaderboardObserver = new LeaderboardObserver(userRepo);

validationService.subscribe(trustScoreObserver);
validationService.subscribe(notificationObserver);
validationService.subscribe(leaderboardObserver);

// --- Express app ---
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/markers', createMarkersRouter(markerService, authService));
app.use('/api/users', createUsersRouter(authService, notificationObserver, markerService));
app.use('/api/validations', createValidationsRouter(validationService, authService, leaderboardObserver));
app.use('/api/admin', createAdminRouter(authService, markerService, userRepo));

// Serve HTML pages
app.get('/leaderboard', (_req, res) => res.sendFile(path.join(__dirname, '../public/leaderboard.html')));
app.get('/profile', (_req, res) => res.sendFile(path.join(__dirname, '../public/profile.html')));
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PawSafe running at http://localhost:${PORT}`);
});
