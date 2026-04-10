import { Router, Request, Response } from 'express';
import { AuthService } from '../business/AuthService';
import { MarkerService } from '../business/MarkerService';
import { UserRepository } from '../data/UserRepository';

export function createAdminRouter(
  authService: AuthService,
  markerService: MarkerService,
  userRepo: UserRepository
): Router {
  const router = Router();

  async function requireAdmin(req: Request, res: Response): Promise<boolean> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ error: 'Yetkilendirme gerekli.' }); return false; }
    const user = await authService.getUserFromToken(token);
    if (!user || user.role !== 'admin') { res.status(403).json({ error: 'Admin yetkisi gerekli.' }); return false; }
    return true;
  }

  router.get('/markers', async (req: Request, res: Response) => {
    if (!await requireAdmin(req, res)) return;
    res.json(await markerService.getAll());
  });

  router.delete('/markers/:id', async (req: Request, res: Response) => {
    if (!await requireAdmin(req, res)) return;
    const deleted = await markerService.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Marker bulunamadı.' });
    res.json({ success: true });
  });

  router.get('/users', async (req: Request, res: Response) => {
    if (!await requireAdmin(req, res)) return;
    const users = (await userRepo.getAll()).map(({ password: _, ...u }) => u);
    res.json(users);
  });

  router.get('/stats', async (req: Request, res: Response) => {
    if (!await requireAdmin(req, res)) return;
    const markers = await markerService.getAll();
    const users   = await userRepo.getAll();
    res.json({
      totalMarkers:     markers.length,
      totalUsers:       users.filter(u => u.role !== 'admin').length,
      totalValidations: markers.reduce((sum, m) => sum + m.validationCount, 0),
      totalDisputes:    markers.reduce((sum, m) => sum + m.disputeCount, 0),
    });
  });

  return router;
}
