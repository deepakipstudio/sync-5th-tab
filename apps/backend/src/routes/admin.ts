import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { storage } from '../services/storage';
import { env } from '../config';
import { syncTenantBrand } from '../services/tenantBrandService';
import { fetchLocationsForTenant } from '../services/locationService';

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

// Multer middleware for category image upload
export const uploadCategoryImage = upload.single('image');

// Helper to validate tenant exists
async function validateTenant(tenantId: string) {
  return prisma.tenant.findUnique({ where: { id: tenantId } });
}

// Helper to validate tenant and session (for authenticated routes)
async function validateTenantAndSession(req: Request, tenantId: string) {
  const cookieName = env.COOKIE_NAME || 'sync5_session';
  const sessionId = req.cookies?.[cookieName];

  if (!sessionId) {
    return { error: 'Not authenticated', status: 401 };
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { tenant: true },
  });

  if (!session) {
    return { error: 'Invalid session', status: 401 };
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return { error: 'Session expired', status: 401 };
  }

  if (session.tenantId !== tenantId) {
    return { error: 'Tenant mismatch', status: 403 };
  }

  if (session.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return { session, tenant: session.tenant };
}

// GET /admin/:tenant/banners -> list all banners for tenant
export async function getTenantBanners(req: Request, res: Response) {
  const { tenant } = req.params;
  const dbTenant = await validateTenant(tenant);
  if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

  const banners = await prisma.banner.findMany({
    where: { tenantId: dbTenant.id },
    include: {
      category: true,
    },
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
    include: {
      category: true,
    },
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
    const { categoryId, productClass, expiresAt, sortOrder, visible } = req.body;

    // Verify category belongs to tenant if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          tenantId: dbTenant.id,
          deletedAt: null, // Only allow active categories
        },
      });

      if (!category) {
        return res.status(400).json({ error: 'Category not found or belongs to different tenant' });
      }
    }

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
        categoryId: categoryId || null,
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
    const { categoryId, productClass, expiresAt, sortOrder, visible } = req.body;

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

    // Verify category belongs to tenant if provided
    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            tenantId: dbTenant.id,
            deletedAt: null, // Only allow active categories
          },
        });

        if (!category) {
          return res.status(400).json({ error: 'Category not found or belongs to different tenant' });
        }
      }
      updateData.categoryId = categoryId || null;
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

// GET /admin/:tenant/settings -> get tenant brand settings
export async function getTenantSettings(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const dbTenant = await validateTenant(tenant);
    if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

    // Get TenantBrand record
    const tenantBrand = await prisma.tenantBrand.findUnique({
      where: { tenantId: dbTenant.id },
    });

    if (!tenantBrand) {
      return res.status(404).json({ error: 'Brand settings not found. Please sync from Marianatek.' });
    }

    res.json({
      brand: {
        id: tenantBrand.id,
        brandName: tenantBrand.brandName,
        primaryColor: tenantBrand.primaryColor,
        primaryForegroundColor: tenantBrand.primaryForegroundColor,
        secondaryColor: tenantBrand.secondaryColor,
        secondaryForegroundColor: tenantBrand.secondaryForegroundColor,
        logoLightUrl: tenantBrand.logoLightUrl,
        logoDarkUrl: tenantBrand.logoDarkUrl,
        createdAt: tenantBrand.createdAt,
        updatedAt: tenantBrand.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching tenant settings:', error);
    res.status(500).json({ error: 'Failed to fetch tenant settings' });
  }
}

// POST /admin/:tenant/sync-brand -> sync brand data from Marianatek
export async function syncBrand(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    
    // Validate tenant and session
    const validation = await validateTenantAndSession(req, tenant);
    if ('error' in validation) {
      return res.status(validation.status).json({ error: validation.error });
    }

    const { session, tenant: dbTenant } = validation;

    // Sync brand data from Marianatek
    const tenantBrand = await syncTenantBrand(
      dbTenant.id,
      dbTenant.mtSubdomain,
      session.accessToken
    );

    res.json({
      ok: true,
      brand: {
        id: tenantBrand.id,
        brandName: tenantBrand.brandName,
        primaryColor: tenantBrand.primaryColor,
        primaryForegroundColor: tenantBrand.primaryForegroundColor,
        secondaryColor: tenantBrand.secondaryColor,
        secondaryForegroundColor: tenantBrand.secondaryForegroundColor,
        logoLightUrl: tenantBrand.logoLightUrl,
        logoDarkUrl: tenantBrand.logoDarkUrl,
      },
    });
  } catch (error: any) {
    console.error('Error syncing brand:', error);
    res.status(500).json({ error: error.message || 'Failed to sync brand data' });
  }
}

// GET /admin/:tenant/store-settings -> get tenant store settings (brand colors, banners, store info, store hours, locations)
export async function getStoreSettings(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const dbTenant = await validateTenant(tenant);
    if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

    // Get TenantBrand record for brand colors and store info
    const tenantBrand = await prisma.tenantBrand.findUnique({
      where: { tenantId: dbTenant.id },
      include: {
        storeHours: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
    });

    // Get banners
    const banners = await prisma.banner.findMany({
      where: { tenantId: dbTenant.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    const bannersWithUrl = banners.map(banner => ({
      ...banner,
      imageUrl: storage.getFileUrl(banner.filename),
    }));

    // Get store hours
    const storeHours = tenantBrand?.storeHours.map(hour => ({
      dayOfWeek: hour.dayOfWeek,
      openTime: hour.openTime,
      closeTime: hour.closeTime,
      isOpen: hour.isOpen,
    })) || [];

    // Fetch locations (requires authentication)
    let locations: Array<{ id: string; name: string }> = [];
    try {
      const sessionResult = await validateTenantAndSession(req, dbTenant.id);
      if (!('error' in sessionResult)) {
        locations = await fetchLocationsForTenant(
          dbTenant.mtSubdomain,
          sessionResult.session.accessToken
        );
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Continue without locations if fetch fails
    }

    res.json({
      brandSettings: {
        primaryBrandColor: tenantBrand?.primaryColor || null,
        secondaryBrandColor: tenantBrand?.secondaryColor || null,
      },
      banners: bannersWithUrl,
      storeInfo: {
        storeName: tenantBrand?.storeName || null,
        storeDescription: tenantBrand?.storeDescription || null,
        contactEmail: tenantBrand?.contactEmail || null,
        defaultLocationId: tenantBrand?.defaultLocationId || null,
      },
      storeHours,
      locations,
    });
  } catch (error: any) {
    console.error('Error fetching store settings:', error);
    res.status(500).json({ error: 'Failed to fetch store settings' });
  }
}

// PUT /admin/:tenant/store-settings/brand -> update brand colors
// Note: Brand colors are now synced from Marianatek, but we keep this endpoint
// for backward compatibility or manual overrides if needed
export async function updateBrandSettings(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const dbTenant = await validateTenant(tenant);
    if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

    const { primaryBrandColor, secondaryBrandColor } = req.body;

    // Validate color format (optional, can be null)
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (primaryBrandColor && !colorRegex.test(primaryBrandColor)) {
      return res.status(400).json({ error: 'Invalid primary brand color format' });
    }
    if (secondaryBrandColor && !colorRegex.test(secondaryBrandColor)) {
      return res.status(400).json({ error: 'Invalid secondary brand color format' });
    }

    // Update or create TenantBrand record
    const tenantBrand = await prisma.tenantBrand.upsert({
      where: { tenantId: dbTenant.id },
      update: {
        primaryColor: primaryBrandColor || null,
        secondaryColor: secondaryBrandColor || null,
      },
      create: {
        tenantId: dbTenant.id,
        primaryColor: primaryBrandColor || null,
        secondaryColor: secondaryBrandColor || null,
      },
    });

    res.json({
      brandSettings: {
        primaryBrandColor: tenantBrand.primaryColor,
        secondaryBrandColor: tenantBrand.secondaryColor,
      },
    });
  } catch (error: any) {
    console.error('Error updating brand settings:', error);
    res.status(500).json({ error: 'Failed to update brand settings' });
  }
}

// GET /admin/:tenant/store-settings/locations -> get available locations from Marianatek
export async function getStoreLocations(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const { tenant: dbTenant, session } = result;

    const locations = await fetchLocationsForTenant(
      dbTenant.mtSubdomain,
      session.accessToken
    );

    res.json({ locations });
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
}

// PUT /admin/:tenant/store-settings/store-info -> update store information
export async function updateStoreInfo(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const dbTenant = await validateTenant(tenant);
    if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

    const { storeName, storeDescription, contactEmail, defaultLocationId } = req.body;

    // Validation
    if (!storeName || typeof storeName !== 'string' || storeName.trim().length === 0) {
      return res.status(400).json({ error: 'storeName is required' });
    }

    if (!contactEmail || typeof contactEmail !== 'string' || contactEmail.trim().length === 0) {
      return res.status(400).json({ error: 'contactEmail is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail.trim())) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate defaultLocationId if provided
    if (defaultLocationId) {
      try {
        const result = await validateTenantAndSession(req, dbTenant.id);
        if (!('error' in result)) {
          const locations = await fetchLocationsForTenant(
            dbTenant.mtSubdomain,
            result.session.accessToken
          );
          const locationExists = locations.some(loc => loc.id === String(defaultLocationId));
          if (!locationExists) {
            return res.status(400).json({ error: 'Invalid defaultLocationId' });
          }
        }
      } catch (error) {
        // If we can't validate location, still allow the update but log the error
        console.warn('Could not validate defaultLocationId:', error);
      }
    }

    // Update TenantBrand record
    const tenantBrand = await prisma.tenantBrand.upsert({
      where: { tenantId: dbTenant.id },
      update: {
        storeName: storeName.trim(),
        storeDescription: storeDescription?.trim() || null,
        contactEmail: contactEmail.trim(),
        defaultLocationId: defaultLocationId || null,
      },
      create: {
        tenantId: dbTenant.id,
        storeName: storeName.trim(),
        storeDescription: storeDescription?.trim() || null,
        contactEmail: contactEmail.trim(),
        defaultLocationId: defaultLocationId || null,
      },
    });

    res.json({
      storeInfo: {
        storeName: tenantBrand.storeName,
        storeDescription: tenantBrand.storeDescription,
        contactEmail: tenantBrand.contactEmail,
        defaultLocationId: tenantBrand.defaultLocationId,
      },
    });
  } catch (error: any) {
    console.error('Error updating store info:', error);
    res.status(500).json({ error: 'Failed to update store info' });
  }
}

// PUT /admin/:tenant/store-settings/store-hours -> update store hours
export async function updateStoreHours(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const dbTenant = await validateTenant(tenant);
    if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

    const { storeHours } = req.body;

    if (!Array.isArray(storeHours)) {
      return res.status(400).json({ error: 'storeHours must be an array' });
    }

    // Validate store hours
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM format

    for (const hour of storeHours) {
      if (!daysOfWeek.includes(hour.dayOfWeek)) {
        return res.status(400).json({ error: `Invalid dayOfWeek: ${hour.dayOfWeek}` });
      }

      if (hour.isOpen) {
        if (!hour.openTime || !hour.closeTime) {
          return res.status(400).json({ error: `openTime and closeTime are required when isOpen is true for ${hour.dayOfWeek}` });
        }

        if (!timeRegex.test(hour.openTime) || !timeRegex.test(hour.closeTime)) {
          return res.status(400).json({ error: `Invalid time format for ${hour.dayOfWeek}. Use HH:MM format (e.g., 09:00)` });
        }

        // Validate closeTime is after openTime
        const [openHour, openMin] = hour.openTime.split(':').map(Number);
        const [closeHour, closeMin] = hour.closeTime.split(':').map(Number);
        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;

        if (closeMinutes <= openMinutes) {
          return res.status(400).json({ error: `closeTime must be after openTime for ${hour.dayOfWeek}` });
        }
      }
    }

    // Get or create TenantBrand
    let tenantBrand = await prisma.tenantBrand.findUnique({
      where: { tenantId: dbTenant.id },
    });

    if (!tenantBrand) {
      tenantBrand = await prisma.tenantBrand.create({
        data: { tenantId: dbTenant.id },
      });
    }

    // Delete existing store hours
    await prisma.storeHours.deleteMany({
      where: { tenantBrandId: tenantBrand.id },
    });

    // Create new store hours
    const now = new Date();
    const createdHours = await prisma.storeHours.createMany({
      data: storeHours.map((hour: any) => ({
        id: crypto.randomUUID(),
        tenantBrandId: tenantBrand.id,
        dayOfWeek: hour.dayOfWeek,
        openTime: hour.isOpen ? hour.openTime : null,
        closeTime: hour.isOpen ? hour.closeTime : null,
        isOpen: hour.isOpen || false,
        updatedAt: now,
      })),
    });

    // Fetch updated store hours
    const updatedHours = await prisma.storeHours.findMany({
      where: { tenantBrandId: tenantBrand.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    res.json({
      storeHours: updatedHours.map(hour => ({
        dayOfWeek: hour.dayOfWeek,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        isOpen: hour.isOpen,
      })),
    });
  } catch (error: any) {
    console.error('Error updating store hours:', error);
    res.status(500).json({ error: 'Failed to update store hours' });
  }
}