import { ImageRepository } from '../data/ImageRepository';

export class ImageUploadService {
  constructor(private imageRepo: ImageRepository) {}

  upload(markerId: string, base64Data?: string): string {
    const seed = markerId || `paws${Date.now()}`;
    const url = `https://picsum.photos/seed/${seed}/400/300`;
    this.imageRepo.save(markerId, url);
    return url;
  }

  getForMarker(markerId: string): string {
    return this.imageRepo.getByMarkerId(markerId) || `https://picsum.photos/seed/${markerId}/400/300`;
  }
}
