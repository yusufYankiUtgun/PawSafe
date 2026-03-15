import { Router, Request, Response } from 'express';
import { AuthService } from '../business/AuthService';
import { NotificationObserver } from '../business/NotificationObserver';

export function createUsersRouter(
  authService: AuthService,
  notificationObserver: NotificationObserver
): Router {
  const router = Router();

  router.post('/register', (req: Request, res: Response) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Tüm alanlar gerekli.' });
    }
    const result = authService.register(email, username, password);
    if (!result) return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı.' });
    res.status(201).json(result);
  });

  router.post('/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gerekli.' });
    }
    const result = authService.login(email, password);
    if (!result) return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
    res.json(result);
  });

  router.get('/me', (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    const user = authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  router.get('/notifications', (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    const user = authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });
    res.json(notificationObserver.getForUser(user.id));
  });

  router.post('/notifications/:id/read', (req: Request, res: Response) => {
    notificationObserver.markRead(req.params.id);
    res.json({ success: true });
  });

  return router;
}
