import * as mysql from 'mysql2/promise';
import { IImageStorage, StoredImage } from '../interfaces/IImageStorage';

/**
 * Dual-mode image storage: in-memory when no pool is provided,
 * MySQL-backed otherwise.  Implements IImageStorage (DIP).
 */
export class ImageRepository implements IImageStorage {
  private images: Map<string, StoredImage> = new Map();

  constructor(private pool: mysql.Pool | null = null) {}

  async saveImage(markerId: string, filename: string, url: string): Promise<void> {
    const uploadedAt = new Date().toISOString();
    if (!this.pool) {
      this.images.set(markerId, { markerId, filename, url, uploadedAt });
      return;
    }
    await this.pool.execute(
      `INSERT INTO images (marker_id, filename, url, uploaded_at) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE filename = VALUES(filename), url = VALUES(url), uploaded_at = VALUES(uploaded_at)`,
      [markerId, filename, url, uploadedAt],
    );
  }

  async getUrl(markerId: string): Promise<string | undefined> {
    if (!this.pool) return this.images.get(markerId)?.url;
    const [rows] = await this.pool.execute(
      'SELECT url FROM images WHERE marker_id = ?',
      [markerId],
    );
    return (rows as any[])[0]?.url ?? undefined;
  }

  async getImage(markerId: string): Promise<StoredImage | undefined> {
    if (!this.pool) return this.images.get(markerId);
    const [rows] = await this.pool.execute(
      'SELECT * FROM images WHERE marker_id = ?',
      [markerId],
    );
    const r = (rows as any[])[0];
    if (!r) return undefined;
    return { markerId: r.marker_id, filename: r.filename, url: r.url, uploadedAt: r.uploaded_at };
  }
}
