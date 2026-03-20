import { Router, Request, Response } from 'express';
import { ValidationService } from '../business/ValidationService';
import { AuthService } from '../business/AuthService';
import { LeaderboardObserver } from '../business/LeaderboardObserver';
import { DisputeReason } from '../interfaces/types';

const VALID_REASONS: ReadonlySet<string> = new Set([
  'inappropriate', 'irrelevant', 'false_report', 'duplicate', 'spam', 'other',
]);

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

    const { reason, explanation } = req.body;

    if (!reason || !VALID_REASONS.has(reason)) {
      return res.status(400).json({
        error: 'Geçerli bir itiraz nedeni seçiniz.',
        validReasons: Array.from(VALID_REASONS),
      });
    }

    const result = validationService.dispute(
      req.params.markerId,
      user.id,
      reason as DisputeReason,
      typeof explanation === 'string' ? explanation.slice(0, 500) : undefined,
    );

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
