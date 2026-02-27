import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Storage configuration
const BANNERS_DIR = path.join(process.cwd(), 'uploads', 'banners');
const PRODUCTS_DIR = path.join(process.cwd(), 'uploads', 'products');
const VARIANTS_DIR = path.join(process.cwd(), 'uploads', 'variants');
const CATEGORIES_DIR = path.join(process.cwd(), 'uploads', 'categories');

// Ensure upload directories exist
[BANNERS_DIR, PRODUCTS_DIR, VARIANTS_DIR, CATEGORIES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Storage service abstraction layer.
 * Currently implements local filesystem storage.
 * Interface designed to easily swap to S3-compatible storage later.
 */
export interface StorageService {
  saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string>;
  deleteFile(filename: string): Promise<void>;
  getFileUrl(filename: string): string;
  saveImage(buffer: Buffer, originalName: string, mimeType: string, type: 'product' | 'variant'): Promise<string>;
  deleteImage(filename: string, type: 'product' | 'variant'): Promise<void>;
  getImageUrl(filename: string, type: 'product' | 'variant'): string;
  getResizedImageUrl(filename: string, type: 'product' | 'variant' | 'category' | 'banner', size: string): string;
  saveCategoryImage(buffer: Buffer, originalName: string, mimeType: string): Promise<string>;
  deleteCategoryImage(filename: string): Promise<void>;
  getCategoryImageUrl(filename: string): string;
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
    const filePath = path.join(BANNERS_DIR, filename);
    
    await fs.promises.writeFile(filePath, buffer);
    
    return filename;
  },

  /**
   * Delete file from local filesystem
   */
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(BANNERS_DIR, filename);
    
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

  /**
   * Save product or variant image
   */
  async saveImage(buffer: Buffer, originalName: string, mimeType: string, type: 'product' | 'variant'): Promise<string> {
    const ext = getExtension(mimeType);
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = type === 'product' ? PRODUCTS_DIR : VARIANTS_DIR;
    const filePath = path.join(uploadDir, filename);
    
    await fs.promises.writeFile(filePath, buffer);
    
    return filename;
  },

  /**
   * Delete product or variant image
   */
  async deleteImage(filename: string, type: 'product' | 'variant'): Promise<void> {
    const uploadDir = type === 'product' ? PRODUCTS_DIR : VARIANTS_DIR;
    const filePath = path.join(uploadDir, filename);
    
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
   * Get the URL path for serving product or variant image
   */
  getImageUrl(filename: string, type: 'product' | 'variant'): string {
    const folder = type === 'product' ? 'products' : 'variants';
    return `/uploads/${folder}/${filename}`;
  },

  /**
   * Get the URL path for serving resized image
   */
  getResizedImageUrl(filename: string, type: 'product' | 'variant' | 'category' | 'banner', size: string): string {
    const typeMap: Record<string, string> = {
      product: 'products',
      variant: 'variants',
      category: 'categories',
      banner: 'banners',
    };
    const folder = typeMap[type] || 'products';
    return `/images/${folder}/${size}/${filename}`;
  },

  /**
   * Save category image
   */
  async saveCategoryImage(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const ext = getExtension(mimeType);
    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(CATEGORIES_DIR, filename);
    
    await fs.promises.writeFile(filePath, buffer);
    
    return filename;
  },

  /**
   * Delete category image
   */
  async deleteCategoryImage(filename: string): Promise<void> {
    const filePath = path.join(CATEGORIES_DIR, filename);
    
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
   * Get the URL path for serving category image
   */
  getCategoryImageUrl(filename: string): string {
    return `/uploads/categories/${filename}`;
  },
};

// Export the active storage service (can be swapped to S3 later)
export const storage = localStorageService;

