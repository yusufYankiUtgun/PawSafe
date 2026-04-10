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
  saveImage(markerId: string, filename: string, url: string): Promise<void>;
  getUrl(markerId: string): Promise<string | undefined>;
  getImage(markerId: string): Promise<StoredImage | undefined>;
}
