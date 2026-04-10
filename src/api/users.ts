import { Router, Request, Response } from 'express';
import { AuthService } from '../business/AuthService';
import { NotificationObserver } from '../business/NotificationObserver';
import { MarkerService } from '../business/MarkerService';

export function createUsersRouter(
  authService: AuthService,
  notificationObserver: NotificationObserver,
  markerService?: MarkerService,
): Router {
  const router = Router();

  router.post('/register', async (req: Request, res: Response) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Tüm alanlar gerekli.' });
    }
    const result = await authService.register(email, username, password);
    if (!result) return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı.' });
    res.status(201).json(result);
  });

  router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gerekli.' });
    }
    const result = await authService.login(email, password);
    if (!result) return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
    res.json(result);
  });

  router.get('/me', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    const user = await authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  router.get('/notifications', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    const user = await authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });
    res.json(notificationObserver.getForUser(user.id));
  });

  router.post('/notifications/:id/read', (req: Request, res: Response) => {
    notificationObserver.markRead(req.params.id);
    res.json({ success: true });
  });

  // Profile: current user's markers
  router.get('/my-markers', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    const user = await authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });
    const all = markerService ? await markerService.getAll() : [];
    res.json(all.filter(m => m.reporterId === user.id));
  });

  return router;
}
