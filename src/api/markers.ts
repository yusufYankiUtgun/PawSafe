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

    const { lat, lng, description, animalCount, size, color, earTagColor, classification, address } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Konum bilgisi gerekli.' });
    }
    if (!size || !color || !earTagColor || !classification) {
      return res.status(400).json({ error: 'Lütfen köpek özelliklerini seçin.' });
    }

    const marker = markerService.createMarker(
      lat, lng, '', user.id, user.username,
      description || '', animalCount || 1,
      size, color, earTagColor, classification, address || ''
    );
    res.status(201).json(marker);
  });

  router.put('/:id', (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });

    const user = authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });

    const marker = markerService.getById(req.params.id);
    if (!marker) return res.status(404).json({ error: 'Marker bulunamadı.' });
    if (marker.reporterId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu marker size ait değil.' });
    }

    const { description, animalCount, size, color, earTagColor, classification } = req.body;
    const updated = markerService.update(req.params.id, { description, animalCount, size, color, earTagColor, classification });
    res.json(updated);
  });

  router.delete('/:id', (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });

    const user = authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });

    const marker = markerService.getById(req.params.id);
    if (!marker) return res.status(404).json({ error: 'Marker bulunamadı.' });
    if (marker.reporterId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu marker size ait değil.' });
    }

    markerService.delete(req.params.id);
    res.json({ success: true });
  });

  return router;
}
