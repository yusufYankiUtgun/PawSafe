import * as path from 'path';
import * as fs from 'fs';
import { IImageStorage } from '../interfaces/IImageStorage';

const ALLOWED_MIMES: ReadonlySet<string> = new Set(['image/jpeg', 'image/png']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Handles image upload validation and persistence.
 *
 * Responsibilities (SRP):
 *  – validate MIME type and size (business rule)
 *  – generate a safe filename
 *  – write the file to the uploads directory
 *  – delegate storage metadata to IImageStorage (DIP)
 *
 * The class is intentionally stateless beyond its injected storage dependency
 * so that it is easy to unit-test with a mock IImageStorage.
 */
export class ImageUploadService {
  private readonly uploadsDir: string;

  constructor(
    private storage: IImageStorage,
    uploadsDir?: string,
  ) {
    this.uploadsDir = uploadsDir ?? path.join(__dirname, '../../public/uploads');
  }

  /** Ensure the uploads directory exists.  Called lazily so tests can skip it. */
  private ensureDir(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Validate MIME type and file size.
   * Returns { valid: true } or { valid: false, error: string }.
   */
  validate(mimeType: string, sizeBytes: number): { valid: boolean; error?: string } {
    if (!ALLOWED_MIMES.has(mimeType)) {
      return { valid: false, error: 'Yalnızca JPEG ve PNG dosyaları kabul edilmektedir.' };
    }
    if (sizeBytes > MAX_SIZE_BYTES) {
      return { valid: false, error: 'Dosya boyutu 5 MB\'ı geçemez.' };
    }
    return { valid: true };
  }

  /**
   * Validate and persist an uploaded image.
   *
   * @param markerId   – the report the image belongs to
   * @param mimeType   – MIME type reported by the client / multer
   * @param sizeBytes  – file size in bytes
   * @param buffer     – raw file contents
   * @returns { success, url } on success, { success: false, error } on failure
   */
  async processUpload(
    markerId: string,
    mimeType: string,
    sizeBytes: number,
    buffer: Buffer,
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const validation = this.validate(mimeType, sizeBytes);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    this.ensureDir();

    const ext = mimeType === 'image/png' ? '.png' : '.jpg';
    // Safe filename: no path traversal, no user-controlled input in the name
    const safeFilename = `${markerId}_${Date.now()}${ext}`;
    const filePath = path.join(this.uploadsDir, safeFilename);

    try {
      fs.writeFileSync(filePath, buffer);
    } catch {
      return { success: false, error: 'Dosya kaydedilemedi.' };
    }

    const url = `/uploads/${safeFilename}`;
    await this.storage.saveImage(markerId, safeFilename, url);
    return { success: true, url };
  }

  /** Return the stored image URL for a marker, or undefined if none. */
  async getForMarker(markerId: string): Promise<string | undefined> {
    return this.storage.getUrl(markerId);
  }
}
