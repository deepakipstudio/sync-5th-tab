import type { Request, Response } from 'express';
import { prisma } from '../prisma';
import { env } from '../config';
import { storage } from '../services/storage';
import { generateSlug, ensureUniqueSlug, rewriteSlugForSoftDelete } from '../utils/slug';

// Helper to validate tenant and session
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

// GET /admin/:tenant/categories - List all active categories with product counts
export async function getTenantCategories(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const result = await validateTenantAndSession(req, tenant);

    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const categories = await prisma.category.findMany({
      where: {
        tenantId: tenant,
        deletedAt: null, // Exclude soft-deleted categories
      },
      include: {
        products: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const categoriesWithCounts = categories.map(category => ({
      ...category,
      productCount: category.products.length,
      imageUrl: category.imageUrl ? storage.getCategoryImageUrl(category.imageUrl) : null,
      products: undefined, // Remove products array from response
    }));

    res.json({ categories: categoriesWithCounts });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

// GET /admin/:tenant/categories/:id - Get single category with products
export async function getTenantCategory(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const result = await validateTenantAndSession(req, tenant);

    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const category = await prisma.category.findFirst({
      where: {
        id,
        tenantId: tenant,
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                mtProductId: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      category: {
        ...category,
        imageUrl: category.imageUrl ? storage.getCategoryImageUrl(category.imageUrl) : null,
        products: category.products.map(pc => pc.product),
      },
    });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
}

// POST /admin/:tenant/categories - Create category
export async function postTenantCategory(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const result = await validateTenantAndSession(req, tenant);

    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const { name, description, slug: providedSlug, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate or use provided slug
    const baseSlug = providedSlug || generateSlug(name);
    const { slug, wasModified: slugWasAutoModified } = await ensureUniqueSlug(
      baseSlug,
      tenant
    );

    // Handle image upload if provided
    // Note: upload.single('image') stores file in req.file, not req.files.image[0]
    const imageFile = req.file;
    let imageUrl: string | null = null;

    if (imageFile) {
      imageUrl = await storage.saveCategoryImage(
        imageFile.buffer,
        imageFile.originalname,
        imageFile.mimetype
      );
    }

    const category = await prisma.category.create({
      data: {
        tenantId: tenant,
        name,
        description: description || null,
        slug,
        imageUrl,
        sortOrder: sortOrder ? parseInt(String(sortOrder), 10) : null,
      },
    });

    res.status(201).json({
      category: {
        ...category,
        imageUrl: category.imageUrl ? storage.getCategoryImageUrl(category.imageUrl) : null,
      },
      slugWasAutoModified,
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
}

// PUT /admin/:tenant/categories/:id - Update category
export async function putTenantCategory(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const result = await validateTenantAndSession(req, tenant);

    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const category = await prisma.category.findFirst({
      where: {
        id,
        tenantId: tenant,
        deletedAt: null, // Only allow updating active categories
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Debug: Log what we receive
    console.log('Category update - req.body:', req.body);
    console.log('Category update - req.body keys:', Object.keys(req.body || {}));
    console.log('Category update - name:', req.body.name);
    console.log('Category update - description:', req.body.description);
    console.log('Category update - slug:', req.body.slug);
    console.log('Category update - sortOrder:', req.body.sortOrder);

    const { name, description, slug: providedSlug, sortOrder } = req.body;

    // Handle slug update
    let finalSlug = category.slug;
    let slugWasAutoModified = false;

    if (name && name !== category.name) {
      // Name changed, regenerate slug
      const baseSlug = providedSlug || generateSlug(name);
      const slugResult = await ensureUniqueSlug(baseSlug, tenant, id);
      finalSlug = slugResult.slug;
      slugWasAutoModified = slugResult.wasModified;
    } else if (providedSlug && providedSlug !== category.slug) {
      // Slug manually changed
      const slugResult = await ensureUniqueSlug(providedSlug, tenant, id);
      finalSlug = slugResult.slug;
      slugWasAutoModified = slugResult.wasModified;
    }

    // Handle image update
    // Note: upload.single('image') stores file in req.file, not req.files.image[0]
    const imageFile = req.file;
    let imageUrl: string | null = category.imageUrl;

    console.log('Category update - file received:', {
      hasImageFile: !!imageFile,
      imageFileInfo: imageFile ? {
        fieldname: imageFile.fieldname,
        originalname: imageFile.originalname,
        mimetype: imageFile.mimetype,
        size: imageFile.size,
        bufferLength: imageFile.buffer?.length
      } : null,
      currentImageUrl: category.imageUrl
    });

    if (imageFile) {
      console.log('Updating category image...');
      // Delete old image if exists
      if (category.imageUrl) {
        await storage.deleteCategoryImage(category.imageUrl);
      }
      // Save new image
      imageUrl = await storage.saveCategoryImage(
        imageFile.buffer,
        imageFile.originalname,
        imageFile.mimetype
      );
      console.log('Category image updated to:', imageUrl);
    }

    // Always update fields that are present in req.body
    // Handle empty strings: empty string = clear (set to null), undefined = no change
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (description !== undefined) {
      // Empty string means clear the description (set to null)
      updateData.description = description === '' ? null : description;
    }
    
    if (finalSlug !== category.slug) {
      updateData.slug = finalSlug;
    }
    
    if (imageUrl !== category.imageUrl) {
      updateData.imageUrl = imageUrl;
    }
    
    if (sortOrder !== undefined) {
      updateData.sortOrder = sortOrder ? parseInt(String(sortOrder), 10) : null;
    }

    console.log('Category update - updateData:', updateData);
    console.log('Category update - will update fields:', Object.keys(updateData));

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    console.log('Category update - updated category:', {
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      imageUrl: updatedCategory.imageUrl,
    });

    res.json({
      category: {
        ...updatedCategory,
        imageUrl: updatedCategory.imageUrl ? storage.getCategoryImageUrl(updatedCategory.imageUrl) : null,
      },
      slugWasAutoModified,
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
}

// DELETE /admin/:tenant/categories/:id - Soft delete category
export async function deleteTenantCategory(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const { removeAssociations } = req.query;
    const result = await validateTenantAndSession(req, tenant);

    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const category = await prisma.category.findFirst({
      where: {
        id,
        tenantId: tenant,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.deletedAt) {
      return res.status(400).json({ error: 'Category already deleted' });
    }

    // Rewrite slug for soft delete
    const deletedSlug = rewriteSlugForSoftDelete(category.slug);

    await prisma.$transaction(async (tx) => {
      // Soft delete category
      await tx.category.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          slug: deletedSlug,
        },
      });

      // Optionally remove product associations
      if (removeAssociations === 'true') {
        await tx.productCategory.deleteMany({
          where: { categoryId: id },
        });
      }
    });

    res.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
}

// POST /admin/:tenant/categories/:id/products - Assign products to category
export async function postCategoryProducts(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const result = await validateTenantAndSession(req, tenant);

    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const { productIds } = req.body as { productIds: string[] };

    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds must be an array' });
    }

    // Verify category exists and is active
    const category = await prisma.category.findFirst({
      where: {
        id,
        tenantId: tenant,
        deletedAt: null, // Only allow assigning to active categories
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Verify all products belong to the tenant
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId: tenant,
      },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'Some products not found or belong to different tenant' });
    }

    // Create associations (ignore duplicates)
    await prisma.$transaction(async (tx) => {
      for (const productId of productIds) {
        await tx.productCategory.upsert({
          where: {
            productId_categoryId: {
              productId,
              categoryId: id,
            },
          },
          create: {
            productId,
            categoryId: id,
          },
          update: {}, // No-op if exists
        });
      }
    });

    res.json({ ok: true });
  } catch (error: any) {
    console.error('Error assigning products to category:', error);
    res.status(500).json({ error: 'Failed to assign products to category' });
  }
}

// DELETE /admin/:tenant/categories/:id/products/:productId - Unlink product from category
export async function deleteCategoryProduct(req: Request, res: Response) {
  try {
    const { tenant, id, productId } = req.params;
    const result = await validateTenantAndSession(req, tenant);

    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // Verify category belongs to tenant
    const category = await prisma.category.findFirst({
      where: {
        id,
        tenantId: tenant,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Verify product belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenant,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Remove association
    await prisma.productCategory.deleteMany({
      where: {
        productId,
        categoryId: id,
      },
    });

    res.json({ ok: true });
  } catch (error: any) {
    console.error('Error unlinking product from category:', error);
    res.status(500).json({ error: 'Failed to unlink product from category' });
  }
}

// PUT /admin/:tenant/categories/reorder - Bulk update sortOrder
export async function putCategoriesReorder(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const result = await validateTenantAndSession(req, tenant);

    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const { categoryOrders } = req.body as { categoryOrders: Array<{ id: string; sortOrder: number }> };

    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({ error: 'categoryOrders must be an array' });
    }

    await prisma.$transaction(async (tx) => {
      for (const { id, sortOrder } of categoryOrders) {
        // Verify category belongs to tenant and is active
        const category = await tx.category.findFirst({
          where: {
            id,
            tenantId: tenant,
            deletedAt: null,
          },
        });

        if (category) {
          await tx.category.update({
            where: { id },
            data: { sortOrder },
          });
        }
      }
    });

    res.json({ ok: true });
  } catch (error: any) {
    console.error('Error reordering categories:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
}

// GET /admin/:tenant/categories/check-slug - Check if slug is available
export async function checkSlugAvailability(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const { slug, excludeId } = req.query;
    const result = await validateTenantAndSession(req, tenant);

    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Slug parameter is required' });
    }

    // Check if slug exists
    const existing = await prisma.category.findFirst({
      where: {
        tenantId: tenant,
        slug: slug,
        deletedAt: null,
        ...(excludeId && typeof excludeId === 'string' ? { id: { not: excludeId } } : {}),
      },
    });

    if (!existing) {
      // Slug is available
      return res.json({ available: true });
    }

    // Slug is taken, generate a suggested unique slug
    const { slug: suggestedSlug } = await ensureUniqueSlug(slug, tenant, excludeId as string | undefined);
    
    return res.json({
      available: false,
      suggestedSlug,
    });
  } catch (error: any) {
    console.error('Error checking slug availability:', error);
    res.status(500).json({ error: 'Failed to check slug availability' });
  }
}

// GET /admin/:tenant/categories/generate-slug - Generate unique slug from name
export async function generateUniqueSlugFromName(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const { name, excludeId } = req.query;
    const result = await validateTenantAndSession(req, tenant);

    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name parameter is required' });
    }

    // Generate slug from name
    const baseSlug = generateSlug(name);
    
    // Ensure it's unique
    const { slug } = await ensureUniqueSlug(baseSlug, tenant, excludeId as string | undefined);

    return res.json({ slug });
  } catch (error: any) {
    console.error('Error generating slug:', error);
    res.status(500).json({ error: 'Failed to generate slug' });
  }
}

