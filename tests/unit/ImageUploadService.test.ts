/**
 * Unit tests for ImageUploadService (business layer).
 *
 * The IImageStorage dependency is mocked so these tests are isolated
 * from the file system and from ImageRepository.
 *
 * Verification: validate() rejects bad types/sizes correctly.
 * Validation: processUpload() stores a URL and returns it as users expect.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ImageUploadService } from '../../src/business/ImageUploadService';
import { IImageStorage } from '../../src/interfaces/IImageStorage';

// ─── In-memory mock storage ───────────────────────────────────────────────────

class MockStorage implements IImageStorage {
  private store: Map<string, { filename: string; url: string; uploadedAt: string }> = new Map();

  saveImage(markerId: string, filename: string, url: string) {
    this.store.set(markerId, { filename, url, uploadedAt: new Date().toISOString() });
  }
  getUrl(markerId: string) { return this.store.get(markerId)?.url; }
  getImage(markerId: string) {
    const e = this.store.get(markerId);
    return e ? { markerId, ...e } : undefined;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSvc() {
  const storage = new MockStorage();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pawsafe-test-'));
  const svc = new ImageUploadService(storage, tmpDir);
  return { svc, storage, tmpDir };
}

const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array(10).fill(0)]);
const PNG_MAGIC  = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(6).fill(0)]);

// ─── validate() ───────────────────────────────────────────────────────────────

describe('ImageUploadService – validate()', () => {
  it('accepts image/jpeg within size limit', () => {
    const { svc } = makeSvc();
    expect(svc.validate('image/jpeg', 1024).valid).toBe(true);
  });

  it('accepts image/png within size limit', () => {
    const { svc } = makeSvc();
    expect(svc.validate('image/png', 2 * 1024 * 1024).valid).toBe(true);
  });

  it('rejects image/gif', () => {
    const { svc } = makeSvc();
    const result = svc.validate('image/gif', 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/jpeg.*png|png.*jpeg/i);
  });

  it('rejects files larger than 5 MB', () => {
    const { svc } = makeSvc();
    const result = svc.validate('image/jpeg', 5 * 1024 * 1024 + 1);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/5 MB/i);
  });

  it('rejects application/octet-stream', () => {
    const { svc } = makeSvc();
    expect(svc.validate('application/octet-stream', 500).valid).toBe(false);
  });
});

// ─── processUpload() ──────────────────────────────────────────────────────────

describe('ImageUploadService – processUpload()', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('saves a JPEG to disk and returns a /uploads/ URL', () => {
    const { svc, storage, tmpDir } = makeSvc();

    const result = svc.processUpload('m1', 'image/jpeg', JPEG_MAGIC.length, JPEG_MAGIC);

    expect(result.success).toBe(true);
    expect(result.url).toMatch(/^\/uploads\/m1_\d+\.jpg$/);
    expect(storage.getUrl('m1')).toBe(result.url);

    const filename = result.url!.replace('/uploads/', '');
    expect(fs.existsSync(path.join(tmpDir, filename))).toBe(true);

    fs.unlinkSync(path.join(tmpDir, filename));
  });

  it('saves a PNG and uses .png extension', () => {
    const { svc, tmpDir } = makeSvc();

    const result = svc.processUpload('m2', 'image/png', PNG_MAGIC.length, PNG_MAGIC);

    expect(result.success).toBe(true);
    expect(result.url).toMatch(/\.png$/);

    const filename = result.url!.replace('/uploads/', '');
    fs.unlinkSync(path.join(tmpDir, filename));
  });

  it('returns failure for an invalid MIME type and does NOT write a file', () => {
    const { svc, tmpDir } = makeSvc();
    const before = fs.readdirSync(tmpDir).length;

    const result = svc.processUpload('m3', 'image/gif', 100, Buffer.alloc(100));

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(fs.readdirSync(tmpDir).length).toBe(before);
  });

  it('returns failure for an oversized file', () => {
    const { svc } = makeSvc();
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024);

    const result = svc.processUpload('m4', 'image/jpeg', bigBuffer.length, bigBuffer);

    expect(result.success).toBe(false);
  });

  it('returns the previously stored URL via getForMarker()', () => {
    const { svc, tmpDir } = makeSvc();

    svc.processUpload('m5', 'image/jpeg', JPEG_MAGIC.length, JPEG_MAGIC);
    const url = svc.getForMarker('m5');

    expect(url).toMatch(/^\/uploads\/m5_/);

    const filename = url!.replace('/uploads/', '');
    fs.unlinkSync(path.join(tmpDir, filename));
  });
});
