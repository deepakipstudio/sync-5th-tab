import type { Request, Response } from 'express';
import { resizeImage } from '../services/imageResize';
import path from 'path';

/**
 * GET /images/:type/:size/:filename
 * Resize and serve images on-the-fly
 * 
 * Types: products, variants, categories, banners
 * Sizes: thumbnail, small, medium, large, or WIDTHxHEIGHT (e.g., 800x600)
 */
export async function getResizedImage(req: Request, res: Response) {
  try {
    const { type, size, filename } = req.params;
    
    // Validate type
    const validTypes = ['products', 'variants', 'categories', 'banners'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid image type. Must be one of: ${validTypes.join(', ')}` });
    }
    
    // Validate filename (security: prevent path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    try {
      // Resize image (will use cache if available)
      const resizedPath = await resizeImage(type, filename, size);
      
      // Determine content type from file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
      };
      const contentType = contentTypeMap[ext] || 'image/jpeg';
      
      // Set cache headers (cache for 1 year since images are immutable)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Type', contentType);
      
      // Send file
      res.sendFile(resizedPath);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Image not found' });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error serving resized image:', error);
    res.status(500).json({ error: 'Failed to resize image' });
  }
}

