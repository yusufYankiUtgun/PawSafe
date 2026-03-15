import { Router, Request, Response } from 'express';
import { MarkerService } from '../business/MarkerService';
import { AuthService } from '../business/AuthService';

export function createMarkersRouter(markerService: MarkerService, authService: AuthService): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json(markerService.getAll());
  });

  router.get('/:id', (req: Request, res: Response) => {
    const marker = markerService.getById(req.params.id);
    if (!marker) return res.status(404).json({ error: 'Marker bulunamadı.' });
    res.json(marker);
  });

  router.post('/', (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });

    const user = authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });

    const { lat, lng, imageUrl, description, animalCount } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Konum bilgisi gerekli.' });
    }

    const marker = markerService.createMarker(
      lat,
      lng,
      imageUrl || '',
      user.id,
      user.username,
      description || '',
      animalCount || 1
    );
    res.status(201).json(marker);
  });

  router.delete('/:id', (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });

    const user = authService.getUserFromToken(token);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }

    const deleted = markerService.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Marker bulunamadı.' });
    res.json({ success: true });
  });

  return router;
}
