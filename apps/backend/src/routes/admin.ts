import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { prisma } from '../prisma';
import { storage } from '../services/storage';

// Allowed image types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: JPG, PNG, WebP, GIF`));
    }
  },
});

// Multer error handler middleware
export function handleMulterError(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}

// Export multer middleware for use in server.ts
export const uploadBannerImage = upload.single('image');

// Multer middleware for multiple product/variant images
export const uploadProductImages = upload.fields([
  { name: 'images', maxCount: 20 }, // Support up to 20 images
]);

// Helper to validate tenant exists
async function validateTenant(tenantId: string) {
  return prisma.tenant.findUnique({ where: { id: tenantId } });
}

// GET /admin/:tenant/banners -> list all banners for tenant
export async function getTenantBanners(req: Request, res: Response) {
  const { tenant } = req.params;
  const dbTenant = await validateTenant(tenant);
  if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

  const banners = await prisma.banner.findMany({
    where: { tenantId: dbTenant.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  // Add imageUrl to each banner for frontend compatibility
  const bannersWithUrl = banners.map(banner => ({
    ...banner,
    imageUrl: storage.getFileUrl(banner.filename),
  }));

  res.json({ banners: bannersWithUrl });
}

// GET /admin/:tenant/banners/:id -> get single banner
export async function getTenantBanner(req: Request, res: Response) {
  const { tenant, id } = req.params;
  const dbTenant = await validateTenant(tenant);
  if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

  const banner = await prisma.banner.findFirst({
    where: { id, tenantId: dbTenant.id },
  });

  if (!banner) return res.status(404).json({ error: 'banner not found' });

  res.json({
    banner: {
      ...banner,
      imageUrl: storage.getFileUrl(banner.filename),
    },
  });
}

// POST /admin/:tenant/banners -> create banner for tenant (multipart/form-data)
export async function postTenantBanner(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const dbTenant = await validateTenant(tenant);
    if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

    // Check file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Parse form fields
    const { collectionId, productClass, expiresAt, sortOrder, visible } = req.body;

    // Save file to storage
    const filename = await storage.saveFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const banner = await prisma.banner.create({
      data: {
        tenantId: dbTenant.id,
        filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        collectionId: collectionId ? parseInt(collectionId, 10) : null,
        productClass: productClass || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : null,
        visible: visible === 'true' || visible === true,
      },
    });

    res.status(201).json({
      banner: {
        ...banner,
        imageUrl: storage.getFileUrl(banner.filename),
      },
    });
  } catch (error: any) {
    console.error('Error creating banner:', error);
    res.status(500).json({ error: 'Failed to create banner' });
  }
}

// PUT /admin/:tenant/banners/:id -> update banner (multipart/form-data)
export async function putTenantBanner(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const dbTenant = await validateTenant(tenant);
    if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

    // Verify banner belongs to tenant
    const existingBanner = await prisma.banner.findFirst({
      where: { id, tenantId: dbTenant.id },
    });

    if (!existingBanner) return res.status(404).json({ error: 'banner not found' });

    // Parse form fields
    const { collectionId, productClass, expiresAt, sortOrder, visible } = req.body;

    // Build update data
    const updateData: any = {};

    // Handle optional new image upload
    if (req.file) {
      // Delete old file
      await storage.deleteFile(existingBanner.filename);

      // Save new file
      const filename = await storage.saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      updateData.filename = filename;
      updateData.originalName = req.file.originalname;
      updateData.mimeType = req.file.mimetype;
      updateData.size = req.file.size;
    }

    // Update other fields if provided
    if (collectionId !== undefined) {
      updateData.collectionId = collectionId ? parseInt(collectionId, 10) : null;
    }
    if (productClass !== undefined) {
      updateData.productClass = productClass || null;
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }
    if (sortOrder !== undefined) {
      updateData.sortOrder = sortOrder ? parseInt(sortOrder, 10) : null;
    }
    if (visible !== undefined) {
      updateData.visible = visible === 'true' || visible === true;
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: updateData,
    });

    res.json({
      banner: {
        ...banner,
        imageUrl: storage.getFileUrl(banner.filename),
      },
    });
  } catch (error: any) {
    console.error('Error updating banner:', error);
    res.status(500).json({ error: 'Failed to update banner' });
  }
}

// DELETE /admin/:tenant/banners/:id -> delete banner and image file
export async function deleteTenantBanner(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const dbTenant = await validateTenant(tenant);
    if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

    // Verify banner belongs to tenant
    const existingBanner = await prisma.banner.findFirst({
      where: { id, tenantId: dbTenant.id },
    });

    if (!existingBanner) return res.status(404).json({ error: 'banner not found' });

    // Delete the image file
    await storage.deleteFile(existingBanner.filename);

    // Delete the database record
    await prisma.banner.delete({ where: { id } });

    res.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
}
