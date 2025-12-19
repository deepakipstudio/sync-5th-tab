import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Storage configuration
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'banners');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Storage service abstraction layer.
 * Currently implements local filesystem storage.
 * Interface designed to easily swap to S3-compatible storage later.
 */
export interface StorageService {
  saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string>;
  deleteFile(filename: string): Promise<void>;
  getFileUrl(filename: string): string;
}

/**
 * Get file extension from mime type
 */
function getExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return mimeToExt[mimeType] || '.jpg';
}

/**
 * Local filesystem storage implementation
 */
export const localStorageService: StorageService = {
  /**
   * Save file to local filesystem
   * @returns The generated filename (UUID-based)
   */
  async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const ext = getExtension(mimeType);
    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    
    await fs.promises.writeFile(filePath, buffer);
    
    return filename;
  },

  /**
   * Delete file from local filesystem
   */
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, filename);
    
    try {
      await fs.promises.unlink(filePath);
    } catch (err: any) {
      // Ignore if file doesn't exist
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  },

  /**
   * Get the URL path for serving the file
   */
  getFileUrl(filename: string): string {
    return `/uploads/banners/${filename}`;
  },
};

// Export the active storage service (can be swapped to S3 later)
export const storage = localStorageService;

