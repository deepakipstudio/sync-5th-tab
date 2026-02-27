import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Common size presets
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES | string;

// Storage directories
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const RESIZED_DIR = path.join(process.cwd(), 'uploads', 'resized');

// Ensure resized directory exists
if (!fs.existsSync(RESIZED_DIR)) {
  fs.mkdirSync(RESIZED_DIR, { recursive: true });
}

/**
 * Parse size string to dimensions
 * Supports: 'thumbnail', 'small', 'medium', 'large', or 'WIDTHxHEIGHT'
 */
function parseSize(size: string): { width: number; height: number } {
  // Check if it's a preset
  if (size in IMAGE_SIZES) {
    return IMAGE_SIZES[size as keyof typeof IMAGE_SIZES];
  }
  
  // Try to parse as WIDTHxHEIGHT
  const match = size.match(/^(\d+)x(\d+)$/);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }
  
  // Default to medium if invalid
  return IMAGE_SIZES.medium;
}

/**
 * Get the path to the original image file
 */
function getOriginalImagePath(type: string, filename: string): string {
  const typeMap: Record<string, string> = {
    products: 'products',
    variants: 'variants',
    categories: 'categories',
    banners: 'banners',
  };
  
  const dir = typeMap[type] || 'products';
  return path.join(UPLOADS_DIR, dir, filename);
}

/**
 * Get the path to the resized image file
 */
function getResizedImagePath(type: string, size: string, filename: string): string {
  const sizeDir = path.join(RESIZED_DIR, type, size);
  if (!fs.existsSync(sizeDir)) {
    fs.mkdirSync(sizeDir, { recursive: true });
  }
  return path.join(sizeDir, filename);
}

/**
 * Resize an image and save it
 * Returns the path to the resized image
 */
export async function resizeImage(
  type: string,
  filename: string,
  size: string
): Promise<string> {
  const dimensions = parseSize(size);
  const originalPath = getOriginalImagePath(type, filename);
  const resizedPath = getResizedImagePath(type, size, filename);
  
  // Check if original file exists
  if (!fs.existsSync(originalPath)) {
    throw new Error(`Original image not found: ${originalPath}`);
  }
  
  // Check if resized image already exists (cached)
  if (fs.existsSync(resizedPath)) {
    return resizedPath;
  }
  
  // Resize and save
  await sharp(originalPath)
    .resize(dimensions.width, dimensions.height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toFile(resizedPath);
  
  return resizedPath;
}

/**
 * Check if a resized image exists
 */
export function resizedImageExists(type: string, size: string, filename: string): boolean {
  const resizedPath = getResizedImagePath(type, size, filename);
  return fs.existsSync(resizedPath);
}

