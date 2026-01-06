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
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const imageFile = files?.image?.[0];
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
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const imageFile = files?.image?.[0];
    let imageUrl: string | null = category.imageUrl;

    if (imageFile) {
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
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(finalSlug !== category.slug && { slug: finalSlug }),
        ...(imageUrl !== category.imageUrl && { imageUrl }),
        ...(sortOrder !== undefined && { sortOrder: sortOrder ? parseInt(String(sortOrder), 10) : null }),
      },
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

