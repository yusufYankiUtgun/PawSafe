import { Router, Request, Response } from 'express';
import multer from 'multer';
import { MarkerService } from '../business/MarkerService';
import { AuthService } from '../business/AuthService';
import { ImageUploadService } from '../business/ImageUploadService';

/**
 * Multer is configured to use memory storage so ImageUploadService
 * can perform its own validation before writing to disk.
 * Max 6 MB at the multer level (the service enforces the 5 MB business rule).
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

export function createMarkersRouter(
  markerService: MarkerService,
  authService: AuthService,
  imageUploadService?: ImageUploadService,
): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const markers = await markerService.getAll();
    const enriched = await Promise.all(markers.map(async m => ({
      ...m,
      imageUrl: (await imageUploadService?.getForMarker(m.id)) || m.imageUrl || '',
    })));
    res.json(enriched);
  });

  router.get('/:id', async (req: Request, res: Response) => {
    const marker = await markerService.getById(req.params.id);
    if (!marker) return res.status(404).json({ error: 'Marker bulunamadı.' });
    const imageUrl = (await imageUploadService?.getForMarker(marker.id)) || marker.imageUrl || '';
    res.json({ ...marker, imageUrl });
  });

  router.post('/', upload.single('image'), async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });

    const user = await authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });

    const { lat, lng, description, animalCount, size, color, earTagColor, classification, address } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Konum bilgisi gerekli.' });
    }
    if (!size || !color || !earTagColor || !classification) {
      return res.status(400).json({ error: 'Lütfen köpek özelliklerini seçin.' });
    }

    const marker = await markerService.createMarker(
      parseFloat(lat), parseFloat(lng), '', user.id, user.username,
      description || '', parseInt(animalCount) || 1,
      size, color, earTagColor, classification, address || ''
    );

    // Handle optional image upload
    if (req.file && imageUploadService) {
      const result = await imageUploadService.processUpload(
        marker.id,
        req.file.mimetype,
        req.file.size,
        req.file.buffer,
      );
      if (!result.success) {
        // Marker is already saved; image error is non-fatal — return warning
        return res.status(201).json({ ...marker, imageUrl: '', imageWarning: result.error });
      }
      marker.imageUrl = result.url!;
    }

    res.status(201).json(marker);
  });

  router.put('/:id', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });

    const user = await authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });

    const marker = await markerService.getById(req.params.id);
    if (!marker) return res.status(404).json({ error: 'Marker bulunamadı.' });
    if (marker.reporterId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu marker size ait değil.' });
    }

    const { description, animalCount, size, color, earTagColor, classification } = req.body;
    const updated = await markerService.update(req.params.id, { description, animalCount, size, color, earTagColor, classification });
    res.json(updated);
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli.' });

    const user = await authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Geçersiz token.' });

    const marker = await markerService.getById(req.params.id);
    if (!marker) return res.status(404).json({ error: 'Marker bulunamadı.' });
    if (marker.reporterId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu marker size ait değil.' });
    }

    await markerService.delete(req.params.id);
    res.json({ success: true });
  });

  return router;
}
