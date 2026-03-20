import { IImageStorage, StoredImage } from '../interfaces/IImageStorage';

/**
 * In-memory image storage.
 * Implements IImageStorage so that ImageUploadService depends on the
 * abstraction, not this concrete class (DIP).
 */
export class ImageRepository implements IImageStorage {
  private images: Map<string, StoredImage> = new Map();

  saveImage(markerId: string, filename: string, url: string): void {
    this.images.set(markerId, {
      markerId,
      filename,
      url,
      uploadedAt: new Date().toISOString(),
    });
  }

  getUrl(markerId: string): string | undefined {
    return this.images.get(markerId)?.url;
  }

  getImage(markerId: string): StoredImage | undefined {
    return this.images.get(markerId);
  }

  /** Backward-compat wrapper used by legacy callers. */
  save(markerId: string, imageUrl: string): string {
    this.saveImage(markerId, '', imageUrl);
    return imageUrl;
  }

  /** Backward-compat wrapper. */
  getByMarkerId(markerId: string): string | undefined {
    return this.getUrl(markerId);
  }
}
