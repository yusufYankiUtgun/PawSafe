import { Router, Request, Response } from 'express';
import { ValidationService } from '../business/ValidationService';
import { AuthService } from '../business/AuthService';
import { LeaderboardObserver } from '../business/LeaderboardObserver';

export function createValidationsRouter(
  validationService: ValidationService,
  authService: AuthService,
  leaderboardObserver: LeaderboardObserver
): Router {
  const router = Router();

  router.post('/:markerId/validate', (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    const user = authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });

    const result = validationService.validate(req.params.markerId, user.id);
    if (!result.success) return res.status(400).json({ error: result.message });
    res.json({ success: true, message: result.message });
  });

  router.post('/:markerId/dispute', (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    const user = authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });

    const result = validationService.dispute(req.params.markerId, user.id);
    if (!result.success) return res.status(400).json({ error: result.message });
    res.json({ success: true, message: result.message });
  });

  router.get('/leaderboard', (_req: Request, res: Response) => {
    res.json({
      data: leaderboardObserver.rerank(),
      lastUpdate: leaderboardObserver.getLastUpdate(),
    });
  });

  return router;
}
