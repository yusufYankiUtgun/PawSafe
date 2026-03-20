export interface StoredImage {
  markerId: string;
  filename: string;
  url: string;
  uploadedAt: string;
}

/**
 * Abstraction for image persistence (DIP: business layer depends on this,
 * not on a concrete repository class).
 */
export interface IImageStorage {
  saveImage(markerId: string, filename: string, url: string): void;
  getUrl(markerId: string): string | undefined;
  getImage(markerId: string): StoredImage | undefined;
}
