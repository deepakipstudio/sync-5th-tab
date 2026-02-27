import type { Request, Response } from 'express';
import { prisma } from '../prisma';
import { env } from '../config';
import { proxyToMarianatek } from '../services/proxy';
import { storage } from '../services/storage';

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

// Helper to get session for MT API calls
async function getSessionForMT(req: Request, tenantId: string) {
  const result = await validateTenantAndSession(req, tenantId);
  if ('error' in result) {
    return null;
  }
  return result;
}

// GET /admin/:tenant/products - List products in DB
export async function getTenantProducts(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const products = await prisma.product.findMany({
      where: { tenantId: tenant },
      include: {
        variants: {
          orderBy: { sortOrder: 'asc' },
        },
        images: {
          where: { productId: { not: null } },
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
        categories: {
          where: {
            category: {
              deletedAt: null, // Only include active categories
            },
          },
          include: {
            category: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    // Enrich with image URLs and fetch product names from MT
    const sessionData = result;
    const productsWithUrls = await Promise.all(
      products.map(async (product) => {
        // Fetch product name from MT
        let mtProductName = null;
        try {
          const productParams = new URLSearchParams({ include: 'product_class' });
          const mtResponse = await proxyToMarianatek(`products/${product.mtProductId}?${productParams.toString()}`, {
            mtSubdomain: sessionData.tenant.mtSubdomain,
            audience: 'admin',
            accessToken: sessionData.session.accessToken,
          });

          if (mtResponse.ok) {
            const mtData = await mtResponse.json();
            mtProductName = mtData.data?.attributes?.title || null;
          }
        } catch (error: any) {
          console.error(`[getTenantProducts] Error fetching MT product name for ${product.mtProductId}:`, error);
          // Continue without MT product name
        }

        return {
          ...product,
          mtProductName,
          images: product.images.map(img => ({
            ...img,
            imageUrl: storage.getImageUrl(img.filename, 'product'),
          })),
          variants: product.variants.map(variant => ({
            ...variant,
            images: [], // Will be loaded separately if needed
          })),
          categories: product.categories
            .filter(pc => pc.category && pc.category.deletedAt === null)
            .map(pc => pc.category),
        };
      })
    );

    res.json({ 
      products: productsWithUrls,
      mtSubdomain: sessionData.tenant.mtSubdomain,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

// GET /admin/:tenant/products/check/:mtProductId - Check if product exists locally
export async function checkProductExists(req: Request, res: Response) {
  try {
    const { tenant, mtProductId } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const product = await prisma.product.findUnique({
      where: {
        tenantId_mtProductId: {
          tenantId: tenant,
          mtProductId: String(mtProductId),
        },
      },
      select: {
        id: true,
      },
    });

    res.json({
      exists: !!product,
      productId: product?.id || null,
    });
  } catch (error: any) {
    console.error('Error checking product existence:', error);
    res.status(500).json({ error: 'Failed to check product existence' });
  }
}

// GET /admin/:tenant/products/mt/search - Search MT products
export async function searchMTProducts(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const { query, page = '1', page_size = '100', inventory_location } = req.query;
    
    const sessionData = await getSessionForMT(req, tenant);
    if (!sessionData) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Build MT API query
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(page_size),
      include: 'product_class',
      ordering: 'title',
      turfed_locations_only: 'true',
    });

    if (query) {
      params.append('query', String(query));
    }
    if (inventory_location) {
      params.append('inventory_location', String(inventory_location));
    }

    const mtResponse = await proxyToMarianatek(`products?${params.toString()}`, {
      mtSubdomain: sessionData.tenant.mtSubdomain,
      audience: 'admin',
      accessToken: sessionData.session.accessToken,
    });

    if (!mtResponse.ok) {
      const errorText = await mtResponse.text();
      return res.status(mtResponse.status).json({ error: 'Failed to fetch MT products', details: errorText });
    }

    const mtData = await mtResponse.json();
    res.json(mtData);
  } catch (error: any) {
    console.error('Error searching MT products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
}

// GET /admin/:tenant/products/add - Get MT product details for add screen
export async function getMTProductForAdd(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const { mtProductId, inventory_location } = req.query;

    if (!mtProductId) {
      return res.status(400).json({ error: 'mtProductId is required' });
    }

    const sessionData = await getSessionForMT(req, tenant);
    if (!sessionData) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Fetch product from MT
    const productParams = new URLSearchParams({ include: 'product_class' });
    const productResponse = await proxyToMarianatek(`products/${mtProductId}?${productParams.toString()}`, {
      mtSubdomain: sessionData.tenant.mtSubdomain,
      audience: 'admin',
      accessToken: sessionData.session.accessToken,
    });

    if (!productResponse.ok) {
      return res.status(productResponse.status).json({ error: 'Product not found in MT' });
    }

    const productData = await productResponse.json();

    // Fetch variants from MT
    const variantParams = new URLSearchParams({
      parent: String(mtProductId),
      page: '1',
      page_size: '100',
    });
    if (inventory_location) {
      variantParams.append('inventory_location', String(inventory_location));
    }

    const variantUrl = `product_variants?${variantParams.toString()}`;
    console.log(`[getMTProductForAdd] Fetching variants for product ${mtProductId}`);
    console.log(`[getMTProductForAdd] Variant URL: ${variantUrl}`);
    console.log(`[getMTProductForAdd] Variant params:`, Object.fromEntries(variantParams.entries()));
    
    // Enhanced authentication logging
    const accessToken = sessionData.session.accessToken;
    const tokenPreview = accessToken 
      ? `${accessToken.substring(0, 10)}...${accessToken.substring(accessToken.length - 10)}`
      : 'NO TOKEN';
    console.log(`[getMTProductForAdd] Authentication details:`, {
      audience: 'admin',
      hasToken: !!accessToken,
      tokenPreview,
      mtSubdomain: sessionData.tenant.mtSubdomain,
    });

    const variantsResponse = await proxyToMarianatek(variantUrl, {
      mtSubdomain: sessionData.tenant.mtSubdomain,
      audience: 'admin',
      accessToken: sessionData.session.accessToken,
    });

    console.log(`[getMTProductForAdd] Variant response status: ${variantsResponse.status} ${variantsResponse.statusText}`);
    
    // Read response body once - it can only be consumed once
    const responseText = await variantsResponse.text().catch(() => 'Unknown error');
    
    let variantsData: { data: any[] } = { data: [] };
    
    if (variantsResponse.ok) {
      try {
        console.log(`[getMTProductForAdd] Variant response body (first 500 chars):`, responseText.substring(0, 500));
        
        const parsed = JSON.parse(responseText);
        
        // Validate response structure
        if (!parsed || typeof parsed !== 'object') {
          console.error(`[getMTProductForAdd] Invalid response structure - not an object:`, typeof parsed);
          variantsData = { data: [] };
        } else if (!Array.isArray(parsed.data)) {
          console.error(`[getMTProductForAdd] Invalid response structure - data is not an array:`, {
            hasData: 'data' in parsed,
            dataType: typeof parsed.data,
            dataValue: parsed.data,
            responseKeys: Object.keys(parsed),
          });
          // Try to find data in different possible locations
          if (Array.isArray(parsed)) {
            console.log(`[getMTProductForAdd] Response is directly an array, wrapping in data property`);
            variantsData = { data: parsed };
          } else {
            variantsData = { data: [] };
          }
        } else {
          variantsData = { data: parsed.data };
          console.log(`[getMTProductForAdd] Successfully fetched ${variantsData.data.length} variants for product ${mtProductId}`);
          if (variantsData.data.length > 0) {
            console.log(`[getMTProductForAdd] First variant sample:`, {
              id: variantsData.data[0]?.id,
              type: variantsData.data[0]?.type,
              hasAttributes: !!variantsData.data[0]?.attributes,
            });
          }
        }
      } catch (parseError: any) {
        console.error('[getMTProductForAdd] Error parsing variants response:', {
          error: parseError.message,
          stack: parseError.stack,
        });
        variantsData = { data: [] };
      }
    } else {
      // Enhanced error logging for authentication issues
      if (variantsResponse.status === 401 || variantsResponse.status === 403) {
        console.error(`[getMTProductForAdd] Authentication error (${variantsResponse.status}):`, {
          status: variantsResponse.status,
          statusText: variantsResponse.statusText,
          error: responseText.substring(0, 500),
          url: variantUrl,
          tokenPreview,
          audience: 'admin',
        });
      } else {
        console.error(`[getMTProductForAdd] Failed to fetch variants for product ${mtProductId}:`, {
          status: variantsResponse.status,
          statusText: variantsResponse.statusText,
          error: responseText.substring(0, 500),
          url: variantUrl,
        });
      }
    }

    res.json({
      product: productData.data,
      variants: variantsData.data || [],
    });
  } catch (error: any) {
    console.error('Error fetching MT product:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
}

// POST /admin/:tenant/products - Create product + all variants + images
export async function postTenantProduct(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const { mtProductId, description, visible = 'true', categoryIds } = req.body;

    if (!mtProductId) {
      return res.status(400).json({ error: 'mtProductId is required' });
    }

    // Check if product already exists
    const existing = await prisma.product.findUnique({
      where: {
        tenantId_mtProductId: {
          tenantId: tenant,
          mtProductId: String(mtProductId),
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Product already exists' });
    }

    // Fetch product and variants from MT to get all variant data
    const sessionData = result;
    const productParams = new URLSearchParams({ include: 'product_class' });
    const productResponse = await proxyToMarianatek(`products/${mtProductId}?${productParams.toString()}`, {
      mtSubdomain: sessionData.tenant.mtSubdomain,
      audience: 'admin',
      accessToken: sessionData.session.accessToken,
    });

    if (!productResponse.ok) {
      return res.status(404).json({ error: 'Product not found in MT' });
    }

    const productData = await productResponse.json();
    const mtProduct = productData.data;

    // Fetch all variants
    const variantParams = new URLSearchParams({
      parent: String(mtProductId),
      page: '1',
      page_size: '100',
    });

    const variantsResponse = await proxyToMarianatek(`product_variants?${variantParams.toString()}`, {
      mtSubdomain: sessionData.tenant.mtSubdomain,
      audience: 'admin',
      accessToken: sessionData.session.accessToken,
    });

    let mtVariants: any[] = [];
    if (variantsResponse.ok) {
      const variantsData = await variantsResponse.json();
      mtVariants = variantsData.data || [];
    }

    // Handle uploaded images
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const imageFiles = files?.images || [];
    const featuredIndex = req.body.featuredImageIndex ? parseInt(req.body.featuredImageIndex, 10) : 0;

    // Create product with variants and images in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const newProduct = await tx.product.create({
        data: {
          tenantId: tenant,
          mtProductId: String(mtProductId),
          description: description || null,
          mtTitle: mtProduct?.attributes?.title || null,
          mtDescription: mtProduct?.attributes?.description || null,
          visible: visible === 'true',
          sortOrder: null,
        },
      });

      // Create all variants
      const variantPromises = mtVariants.map((mtVariant: any, index: number) => {
        const attrs = mtVariant.attributes || {};
        const variantAttrs = Array.isArray(attrs.variant_attributes)
          ? attrs.variant_attributes.filter((a: any) => a.value != null)
          : [];
        const priceRaw = attrs.price != null ? parseFloat(attrs.price) : null;
        return tx.productVariant.create({
          data: {
            productId: newProduct.id,
            mtVariantId: String(mtVariant.id),
            sku: attrs.sku || '',
            description: null,
            mtTitle: attrs.title || null,
            mtPrice: (priceRaw != null && !isNaN(priceRaw)) ? priceRaw : null,
            mtAttributes: variantAttrs.length > 0 ? variantAttrs : undefined,
            visible: true,
            sortOrder: index,
          },
        });
      });

      const variants = await Promise.all(variantPromises);

      // Save product images
      const imagePromises = imageFiles.map(async (file, index) => {
        const filename = await storage.saveImage(file.buffer, file.originalname, file.mimetype, 'product');
        return tx.productImage.create({
          data: {
            productId: newProduct.id,
            variantId: null,
            filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            isFeatured: index === featuredIndex,
            sortOrder: index,
          },
        });
      });

      await Promise.all(imagePromises);

      // Handle category assignments if provided
      if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
        // Verify all categories belong to tenant and are active
        const categories = await tx.category.findMany({
          where: {
            id: { in: categoryIds },
            tenantId: tenant,
            deletedAt: null, // Only active categories
          },
        });

        if (categories.length !== categoryIds.length) {
          throw new Error('Some categories not found or belong to different tenant');
        }

        // Create category associations
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({
            productId: newProduct.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      return newProduct;
    });

    // Fetch created product with relations
    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        variants: true,
        images: {
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
        categories: {
          where: {
            category: {
              deletedAt: null, // Only include active categories
            },
          },
          include: {
            category: true,
          },
        },
      },
    });

    res.status(201).json({
      product: {
        ...createdProduct,
        images: createdProduct!.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'product'),
        })),
        categories: createdProduct!.categories
          .filter(pc => pc.category && pc.category.deletedAt === null)
          .map(pc => pc.category),
      },
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

// GET /admin/:tenant/products/:id - Get product with variants and images
export async function getTenantProduct(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const product = await prisma.product.findFirst({
      where: { id, tenantId: tenant },
      include: {
        variants: {
          include: {
            images: {
              orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        images: {
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
        categories: {
          where: {
            category: {
              deletedAt: null, // Only include active categories
            },
          },
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Fetch product name from MT
    let mtProductName = null;
    try {
      const sessionData = result;
      const productParams = new URLSearchParams({ include: 'product_class' });
      const mtResponse = await proxyToMarianatek(`products/${product.mtProductId}?${productParams.toString()}`, {
        mtSubdomain: sessionData.tenant.mtSubdomain,
        audience: 'admin',
        accessToken: sessionData.session.accessToken,
      });

      if (mtResponse.ok) {
        const mtData = await mtResponse.json();
        mtProductName = mtData.data?.attributes?.title || null;
      }
    } catch (error: any) {
      console.error('[getTenantProduct] Error fetching MT product name:', error);
      // Continue without MT product name
    }

    res.json({
      product: {
        ...product,
        mtProductName,
        images: product.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'product'),
        })),
        variants: product.variants.map(variant => ({
          ...variant,
          images: variant.images.map(img => ({
            ...img,
            imageUrl: storage.getImageUrl(img.filename, 'variant'),
          })),
        })),
        categories: product.categories
          .filter(pc => pc.category && pc.category.deletedAt === null)
          .map(pc => pc.category),
      },
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

// PUT /admin/:tenant/products/:id - Update product
export async function putTenantProduct(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const product = await prisma.product.findFirst({
      where: { id, tenantId: tenant },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { description, visible, sortOrder, categoryIds } = req.body;

    // Normalize visible to boolean (handle both string and boolean)
    let visibleValue: boolean | undefined = undefined;
    if (visible !== undefined) {
      if (typeof visible === 'string') {
        visibleValue = visible === 'true' || visible === '1';
      } else {
        visibleValue = Boolean(visible);
      }
    }

    // Handle image updates if provided
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const imageFiles = files?.images || [];
    const featuredIndex = req.body.featuredImageIndex ? parseInt(req.body.featuredImageIndex, 10) : -1;
    const deletedImageIds = req.body.deletedImageIds ? JSON.parse(req.body.deletedImageIds || '[]') : [];

    await prisma.$transaction(async (tx) => {
      // Delete removed images
      if (deletedImageIds.length > 0) {
        const imagesToDelete = await tx.productImage.findMany({
          where: {
            id: { in: deletedImageIds },
            productId: id,
          },
        });

        for (const img of imagesToDelete) {
          await storage.deleteImage(img.filename, 'product');
        }

        await tx.productImage.deleteMany({
          where: {
            id: { in: deletedImageIds },
            productId: id,
          },
        });
      }

      // Always clear all featured flags first to ensure only one image is featured
      await tx.productImage.updateMany({
        where: { productId: id },
        data: { isFeatured: false },
      });

      // Add new images (initially all set to isFeatured: false)
      if (imageFiles.length > 0) {
        const existingImages = await tx.productImage.findMany({
          where: { productId: id },
        });
        const maxSortOrder = existingImages.length > 0 
          ? Math.max(...existingImages.map(img => img.sortOrder))
          : -1;

        const imagePromises = imageFiles.map(async (file, index) => {
          const filename = await storage.saveImage(file.buffer, file.originalname, file.mimetype, 'product');
          return tx.productImage.create({
            data: {
              productId: id,
              variantId: null,
              filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              isFeatured: false, // Will be set below if this is the featured image
              sortOrder: maxSortOrder + 1 + index,
            },
          });
        });

        await Promise.all(imagePromises);
      }

      // Set the correct featured image
      const featuredImageId = req.body.featuredImageId;
      if (featuredImageId) {
        // User selected an existing image as featured
        await tx.productImage.update({
          where: { id: featuredImageId },
          data: { isFeatured: true },
        });
      } else if (featuredIndex >= 0 && imageFiles.length > 0) {
        // User selected a new image as featured by index
        const newImages = await tx.productImage.findMany({
          where: { productId: id },
          orderBy: { sortOrder: 'desc' },
          take: imageFiles.length,
        });
        if (newImages[featuredIndex]) {
          await tx.productImage.update({
            where: { id: newImages[featuredIndex].id },
            data: { isFeatured: true },
          });
        }
      } else if (imageFiles.length > 0 && featuredIndex === -1) {
        // Default: first new image if no selection
        const newImages = await tx.productImage.findMany({
          where: { productId: id },
          orderBy: { sortOrder: 'desc' },
          take: imageFiles.length,
        });
        if (newImages[0]) {
          await tx.productImage.update({
            where: { id: newImages[0].id },
            data: { isFeatured: true },
          });
        }
      }

      // Handle category assignments if provided
      if (categoryIds !== undefined) {
        const categoryIdsArray = Array.isArray(categoryIds) ? categoryIds : [];
        
        if (categoryIdsArray.length > 0) {
          // Verify all categories belong to tenant and are active
          const categories = await tx.category.findMany({
            where: {
              id: { in: categoryIdsArray },
              tenantId: tenant,
              deletedAt: null, // Only active categories
            },
          });

          if (categories.length !== categoryIdsArray.length) {
            throw new Error('Some categories not found or belong to different tenant');
          }
        }

        // Remove all existing category associations
        await tx.productCategory.deleteMany({
          where: { productId: id },
        });

        // Create new category associations
        if (categoryIdsArray.length > 0) {
          await tx.productCategory.createMany({
            data: categoryIdsArray.map((categoryId: string) => ({
              productId: id,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Update product fields
      await tx.product.update({
        where: { id },
        data: {
          ...(description !== undefined && { description: description || null }),
          ...(visibleValue !== undefined && { visible: visibleValue }),
          ...(sortOrder !== undefined && { sortOrder: sortOrder ? parseInt(String(sortOrder), 10) : null }),
        },
      });
    });

    // Fetch updated product
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
        categories: {
          where: {
            category: {
              deletedAt: null, // Only include active categories
            },
          },
          include: {
            category: true,
          },
        },
      },
    });

    res.json({
      product: {
        ...updatedProduct,
        images: updatedProduct!.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'product'),
        })),
        categories: updatedProduct!.categories
          .filter(pc => pc.category && pc.category.deletedAt === null)
          .map(pc => pc.category),
      },
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
}

// DELETE /admin/:tenant/products/:id - Delete product from sync
export async function deleteTenantProduct(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // Verify product belongs to tenant and fetch with all related data
    const product = await prisma.product.findFirst({
      where: { id, tenantId: tenant },
      include: {
        images: true,
        variants: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete all product images from storage
    for (const image of product.images) {
      try {
        await storage.deleteImage(image.filename, 'product');
      } catch (error: any) {
        console.error(`Error deleting product image ${image.id}:`, error);
        // Continue even if image deletion fails
      }
    }

    // Delete all variant images from storage
    for (const variant of product.variants) {
      for (const image of variant.images) {
        try {
          await storage.deleteImage(image.filename, 'variant');
        } catch (error: any) {
          console.error(`Error deleting variant image ${image.id}:`, error);
          // Continue even if image deletion fails
        }
      }
    }

    // Delete product from database (cascade will handle variants and images)
    await prisma.product.delete({ where: { id } });

    res.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

// GET /admin/:tenant/products/mt/:mtProductId - Get product with variants and images by MT product ID
export async function getTenantProductByMtId(req: Request, res: Response) {
  try {
    const { tenant, mtProductId } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const product = await prisma.product.findFirst({
      where: { mtProductId, tenantId: tenant },
      include: {
        variants: {
          include: {
            images: {
              orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        images: {
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
        categories: {
          where: {
            category: {
              deletedAt: null, // Only include active categories
            },
          },
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Fetch product name from MT
    let mtProductName = null;
    try {
      const sessionData = result;
      const productParams = new URLSearchParams({ include: 'product_class' });
      const mtResponse = await proxyToMarianatek(`products/${product.mtProductId}?${productParams.toString()}`, {
        mtSubdomain: sessionData.tenant.mtSubdomain,
        audience: 'admin',
        accessToken: sessionData.session.accessToken,
      });

      if (mtResponse.ok) {
        const mtData = await mtResponse.json();
        mtProductName = mtData.data?.attributes?.title || null;
      }
    } catch (error: any) {
      console.error('[getTenantProductByMtId] Error fetching MT product name:', error);
      // Continue without MT product name
    }

    res.json({
      product: {
        ...product,
        mtProductName,
        images: product.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'product'),
        })),
        variants: product.variants.map(variant => ({
          ...variant,
          images: variant.images.map(img => ({
            ...img,
            imageUrl: storage.getImageUrl(img.filename, 'variant'),
          })),
        })),
        categories: product.categories
          .filter(pc => pc.category && pc.category.deletedAt === null)
          .map(pc => pc.category),
      },
    });
  } catch (error: any) {
    console.error('Error fetching product by MT ID:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

// PUT /admin/:tenant/products/mt/:mtProductId - Update product by MT product ID
export async function putTenantProductByMtId(req: Request, res: Response) {
  try {
    const { tenant, mtProductId } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const product = await prisma.product.findFirst({
      where: { mtProductId, tenantId: tenant },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { description, visible, sortOrder } = req.body;

    // Handle categoryIds parsing from FormData (may be categoryIds[] or categoryIds)
    let categoryIds: string[] | undefined = undefined;
    if (req.body.categoryIds !== undefined) {
      // Handle array or single value
      categoryIds = Array.isArray(req.body.categoryIds) ? req.body.categoryIds : [req.body.categoryIds];
    } else if (req.body['categoryIds[]'] !== undefined) {
      // Handle bracket notation from FormData
      categoryIds = Array.isArray(req.body['categoryIds[]']) ? req.body['categoryIds[]'] : [req.body['categoryIds[]']];
    }

    // Normalize visible to boolean (handle both string and boolean)
    let visibleValue: boolean | undefined = undefined;
    if (visible !== undefined) {
      if (typeof visible === 'string') {
        visibleValue = visible === 'true' || visible === '1';
      } else {
        visibleValue = Boolean(visible);
      }
    }

    // Handle image updates if provided
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const imageFiles = files?.images || [];
    const featuredIndex = req.body.featuredImageIndex ? parseInt(req.body.featuredImageIndex, 10) : -1;
    const deletedImageIds = req.body.deletedImageIds ? JSON.parse(req.body.deletedImageIds || '[]') : [];

    await prisma.$transaction(async (tx) => {
      // Delete removed images
      if (deletedImageIds.length > 0) {
        const imagesToDelete = await tx.productImage.findMany({
          where: {
            id: { in: deletedImageIds },
            productId: product.id,
          },
        });

        for (const img of imagesToDelete) {
          await storage.deleteImage(img.filename, 'product');
        }

        await tx.productImage.deleteMany({
          where: {
            id: { in: deletedImageIds },
            productId: product.id,
          },
        });
      }

      // Always clear all featured flags first to ensure only one image is featured
      await tx.productImage.updateMany({
        where: { productId: product.id },
        data: { isFeatured: false },
      });

      // Add new images (initially all set to isFeatured: false)
      if (imageFiles.length > 0) {
        const existingImages = await tx.productImage.findMany({
          where: { productId: product.id },
        });
        const maxSortOrder = existingImages.length > 0 
          ? Math.max(...existingImages.map(img => img.sortOrder))
          : -1;

        const imagePromises = imageFiles.map(async (file, index) => {
          const filename = await storage.saveImage(file.buffer, file.originalname, file.mimetype, 'product');
          return tx.productImage.create({
            data: {
              productId: product.id,
              variantId: null,
              filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              isFeatured: false, // Will be set below if this is the featured image
              sortOrder: maxSortOrder + 1 + index,
            },
          });
        });

        await Promise.all(imagePromises);
      }

      // Set the correct featured image
      const featuredImageId = req.body.featuredImageId;
      if (featuredImageId) {
        // User selected an existing image as featured
        await tx.productImage.update({
          where: { id: featuredImageId },
          data: { isFeatured: true },
        });
      } else if (featuredIndex >= 0 && imageFiles.length > 0) {
        // User selected a new image as featured by index
        const newImages = await tx.productImage.findMany({
          where: { productId: product.id },
          orderBy: { sortOrder: 'desc' },
          take: imageFiles.length,
        });
        if (newImages[featuredIndex]) {
          await tx.productImage.update({
            where: { id: newImages[featuredIndex].id },
            data: { isFeatured: true },
          });
        }
      } else if (imageFiles.length > 0 && featuredIndex === -1) {
        // Default: first new image if no selection
        const newImages = await tx.productImage.findMany({
          where: { productId: product.id },
          orderBy: { sortOrder: 'desc' },
          take: imageFiles.length,
        });
        if (newImages[0]) {
          await tx.productImage.update({
            where: { id: newImages[0].id },
            data: { isFeatured: true },
          });
        }
      }

      // Handle category assignments if provided
      if (categoryIds !== undefined) {
        // Filter out empty strings and invalid values
        const categoryIdsArray = categoryIds
          .filter((id: any) => id && typeof id === 'string' && id.trim() !== '')
          .map((id: string) => id.trim());
        
        if (categoryIdsArray.length > 0) {
          // Verify all categories belong to tenant and are active
          const categories = await tx.category.findMany({
            where: {
              id: { in: categoryIdsArray },
              tenantId: tenant,
              deletedAt: null, // Only active categories
            },
          });

          if (categories.length !== categoryIdsArray.length) {
            throw new Error('Some categories not found or belong to different tenant');
          }
        }

        // Remove all existing category associations
        await tx.productCategory.deleteMany({
          where: { productId: product.id },
        });

        // Create new category associations (even if empty array - clears categories)
        if (categoryIdsArray.length > 0) {
          await tx.productCategory.createMany({
            data: categoryIdsArray.map((categoryId: string) => ({
              productId: product.id,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Update product fields
      await tx.product.update({
        where: { id: product.id },
        data: {
          ...(description !== undefined && { description: description || null }),
          ...(visibleValue !== undefined && { visible: visibleValue }),
          ...(sortOrder !== undefined && { sortOrder: sortOrder ? parseInt(String(sortOrder), 10) : null }),
        },
      });
    });

    // Fetch updated product
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: {
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
        categories: {
          where: {
            category: {
              deletedAt: null, // Only include active categories
            },
          },
          include: {
            category: true,
          },
        },
      },
    });

    res.json({
      product: {
        ...updatedProduct,
        images: updatedProduct!.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'product'),
        })),
        categories: updatedProduct!.categories
          .filter(pc => pc.category && pc.category.deletedAt === null)
          .map(pc => pc.category),
      },
    });
  } catch (error: any) {
    console.error('Error updating product by MT ID:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
}

// DELETE /admin/:tenant/products/mt/:mtProductId - Delete product by MT product ID
export async function deleteTenantProductByMtId(req: Request, res: Response) {
  try {
    const { tenant, mtProductId } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // Verify product belongs to tenant and fetch with all related data
    const product = await prisma.product.findFirst({
      where: { mtProductId, tenantId: tenant },
      include: {
        images: true,
        variants: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete all product images from storage
    for (const image of product.images) {
      try {
        await storage.deleteImage(image.filename, 'product');
      } catch (error: any) {
        console.error(`Error deleting product image ${image.id}:`, error);
        // Continue even if image deletion fails
      }
    }

    // Delete all variant images from storage
    for (const variant of product.variants) {
      for (const image of variant.images) {
        try {
          await storage.deleteImage(image.filename, 'variant');
        } catch (error: any) {
          console.error(`Error deleting variant image ${image.id}:`, error);
          // Continue even if image deletion fails
        }
      }
    }

    // Delete product from database (cascade will handle variants and images)
    await prisma.product.delete({ where: { id: product.id } });

    res.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting product by MT ID:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

// GET /admin/:tenant/products/:id/variants - Get variants with MT pricing/stock
export async function getProductVariants(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const { inventory_location } = req.query;
    
    const result = await validateTenantAndSession(req, tenant);
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const product = await prisma.product.findFirst({
      where: { id, tenantId: tenant },
      include: {
        variants: {
          include: {
            images: {
              orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Fetch variant data from MT for pricing/stock
    const sessionData = result;
    const variantIds = product.variants.map(v => v.mtVariantId);
    
    const variantsWithMTData = await Promise.all(
      product.variants.map(async (variant) => {
        try {
          const params = new URLSearchParams({});
          if (inventory_location) {
            params.append('inventory_location', String(inventory_location));
          }

          const mtResponse = await proxyToMarianatek(`product_variants/${variant.mtVariantId}?${params.toString()}`, {
            mtSubdomain: sessionData.tenant.mtSubdomain,
            audience: 'admin',
            accessToken: sessionData.session.accessToken,
          });

          let mtData = null;
          if (mtResponse.ok) {
            const mtResponseData = await mtResponse.json();
            mtData = mtResponseData.data;
          }

          return {
            ...variant,
            images: variant.images.map(img => ({
              ...img,
              imageUrl: storage.getImageUrl(img.filename, 'variant'),
            })),
            mtData, // Include MT pricing/stock data
          };
        } catch (error) {
          console.error(`Error fetching MT data for variant ${variant.id}:`, error);
          return {
            ...variant,
            images: variant.images.map(img => ({
              ...img,
              imageUrl: storage.getImageUrl(img.filename, 'variant'),
            })),
            mtData: null,
          };
        }
      })
    );

    res.json({ variants: variantsWithMTData });
  } catch (error: any) {
    console.error('Error fetching variants:', error);
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
}

// GET /admin/:tenant/products/mt/:mtProductId/variants - Get variants with MT pricing/stock by MT product ID
export async function getProductVariantsByMtId(req: Request, res: Response) {
  try {
    const { tenant, mtProductId } = req.params;
    const { inventory_location } = req.query;
    
    const result = await validateTenantAndSession(req, tenant);
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const product = await prisma.product.findFirst({
      where: { mtProductId, tenantId: tenant },
      include: {
        variants: {
          include: {
            images: {
              orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Fetch variant data from MT for pricing/stock using list endpoint
    const sessionData = result;
    
    // Build query parameters for the list endpoint
    const params = new URLSearchParams({
      parent: String(mtProductId),
      page: '1',
      page_size: '100',
    });
    
    if (inventory_location) {
      params.append('inventory_location', String(inventory_location));
    }

    // Fetch all variants for this product in a single call
    let mtVariantsMap = new Map<number, any>();
    try {
      const mtResponse = await proxyToMarianatek(`product_variants?${params.toString()}`, {
        mtSubdomain: sessionData.tenant.mtSubdomain,
        audience: 'admin',
        accessToken: sessionData.session.accessToken,
      });

      if (mtResponse.ok) {
        const mtResponseData = await mtResponse.json();
        // MT API returns JSON:API format with 'data' array
        const variants = mtResponseData.data || mtResponseData.results || [];
        // Create a map of variant ID to MT data for quick lookup
        variants.forEach((variant: any) => {
          // JSON:API format: variant.id is a string, variant.attributes contains the data
          const variantIdStr = variant.id;
          if (variantIdStr) {
            const variantId = parseInt(variantIdStr, 10);
            if (!isNaN(variantId)) {
              // Extract location-specific stock if inventory_location is provided
              let locationStock = null;
              let locationPrice = null;
              
              if (inventory_location && variant.attributes?.region_overrides) {
                // Find stock for the specific location
                for (const region of variant.attributes.region_overrides) {
                  if (region.location_overrides) {
                    const locationOverride = region.location_overrides.find(
                      (loc: any) => String(loc.id) === String(inventory_location)
                    );
                    if (locationOverride) {
                      locationStock = locationOverride.present_quantity != null 
                        ? parseInt(locationOverride.present_quantity, 10) 
                        : null;
                      locationPrice = locationOverride.price != null
                        ? parseFloat(locationOverride.price)
                        : null;
                      break;
                    }
                  }
                }
              }
              
              // Flatten the structure for easier frontend access
              const flattenedData = {
                ...variant,
                attributes: {
                  ...variant.attributes,
                  // Add location-specific stock and price at the top level for easy access
                  present_quantity: locationStock ?? variant.attributes?.present_quantity ?? null,
                  price: locationPrice ?? variant.attributes?.price ?? null,
                }
              };
              
              mtVariantsMap.set(variantId, flattenedData);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching MT variants list:', error);
    }

    // Merge local variant data with MT data
    const variantsWithMTData = product.variants.map((variant) => {
      // Convert mtVariantId to number for Map lookup (Map key is number)
      const variantIdNum = typeof variant.mtVariantId === 'string' 
        ? parseInt(variant.mtVariantId, 10) 
        : variant.mtVariantId;
      const mtData = !isNaN(variantIdNum) ? mtVariantsMap.get(variantIdNum) || null : null;
      
      return {
        ...variant,
        images: variant.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'variant'),
        })),
        mtData, // Include MT pricing/stock data with inventory_location context
      };
    });

    res.json({ variants: variantsWithMTData });
  } catch (error: any) {
    console.error('Error fetching variants by MT ID:', error);
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
}

// GET /admin/:tenant/products/variants/:id - Get single variant with MT data
export async function getProductVariant(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const { inventory_location } = req.query;
    
    const result = await validateTenantAndSession(req, tenant);
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const variant = await prisma.productVariant.findFirst({
      where: { 
        id,
        product: {
          tenantId: tenant,
        },
      },
      include: {
        product: true,
        images: {
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });

    if (!variant || !variant.product) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    // Fetch MT data for pricing/stock
    const sessionData = result;
    const params = new URLSearchParams({});
    if (inventory_location) {
      params.append('inventory_location', String(inventory_location));
    }

    const mtResponse = await proxyToMarianatek(`product_variants/${variant.mtVariantId}?${params.toString()}`, {
      mtSubdomain: sessionData.tenant.mtSubdomain,
      audience: 'admin',
      accessToken: sessionData.session.accessToken,
    });

    let mtData = null;
    if (mtResponse.ok) {
      const mtResponseData = await mtResponse.json();
      mtData = mtResponseData.data;
    }

    res.json({
      variant: {
        ...variant,
        images: variant.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'variant'),
        })),
        mtData,
      },
    });
  } catch (error: any) {
    console.error('Error fetching variant:', error);
    res.status(500).json({ error: 'Failed to fetch variant' });
  }
}

// PUT /admin/:tenant/products/variants/:id - Update variant
export async function putProductVariant(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const variant = await prisma.productVariant.findFirst({
      where: { 
        id,
        product: {
          tenantId: tenant,
        },
      },
      include: {
        product: true,
      },
    });

    if (!variant || !variant.product) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const { description, visible, sortOrder } = req.body;

    // Handle image updates
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const imageFiles = files?.images || [];
    const featuredIndex = req.body.featuredImageIndex ? parseInt(req.body.featuredImageIndex, 10) : -1;
    const deletedImageIds = req.body.deletedImageIds ? JSON.parse(req.body.deletedImageIds || '[]') : [];

    await prisma.$transaction(async (tx) => {
      // Delete removed images
      if (deletedImageIds.length > 0) {
        const imagesToDelete = await tx.productImage.findMany({
          where: {
            id: { in: deletedImageIds },
            variantId: id,
          },
        });

        for (const img of imagesToDelete) {
          await storage.deleteImage(img.filename, 'variant');
        }

        await tx.productImage.deleteMany({
          where: {
            id: { in: deletedImageIds },
            variantId: id,
          },
        });
      }

      // Always clear all featured flags first to ensure only one image is featured
      await tx.productImage.updateMany({
        where: { variantId: id },
        data: { isFeatured: false },
      });

      // Add new images (initially all set to isFeatured: false)
      if (imageFiles.length > 0) {
        const existingImages = await tx.productImage.findMany({
          where: { variantId: id },
        });
        const maxSortOrder = existingImages.length > 0 
          ? Math.max(...existingImages.map(img => img.sortOrder))
          : -1;

        const imagePromises = imageFiles.map(async (file, index) => {
          const filename = await storage.saveImage(file.buffer, file.originalname, file.mimetype, 'variant');
          return tx.productImage.create({
            data: {
              productId: null,
              variantId: id,
              filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              isFeatured: false, // Will be set below if this is the featured image
              sortOrder: maxSortOrder + 1 + index,
            },
          });
        });

        await Promise.all(imagePromises);
      }

      // Set the correct featured image
      const featuredImageId = req.body.featuredImageId;
      if (featuredImageId) {
        // User selected an existing image as featured
        await tx.productImage.update({
          where: { id: featuredImageId },
          data: { isFeatured: true },
        });
      } else if (featuredIndex >= 0 && imageFiles.length > 0) {
        // User selected a new image as featured by index
        const newImages = await tx.productImage.findMany({
          where: { variantId: id },
          orderBy: { sortOrder: 'desc' },
          take: imageFiles.length,
        });
        if (newImages[featuredIndex]) {
          await tx.productImage.update({
            where: { id: newImages[featuredIndex].id },
            data: { isFeatured: true },
          });
        }
      } else if (imageFiles.length > 0 && featuredIndex === -1) {
        // Default: first new image if no selection
        const newImages = await tx.productImage.findMany({
          where: { variantId: id },
          orderBy: { sortOrder: 'desc' },
          take: imageFiles.length,
        });
        if (newImages[0]) {
          await tx.productImage.update({
            where: { id: newImages[0].id },
            data: { isFeatured: true },
          });
        }
      }

      // Update variant fields
      await tx.productVariant.update({
        where: { id },
        data: {
          ...(description !== undefined && { description: description || null }),
          ...(visible !== undefined && { visible: visible === 'true' }),
          ...(sortOrder !== undefined && { sortOrder: sortOrder ? parseInt(String(sortOrder), 10) : null }),
        },
      });
    });

    // Fetch updated variant
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });

    res.json({
      variant: {
        ...updatedVariant,
        images: updatedVariant!.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'variant'),
        })),
      },
    });
  } catch (error: any) {
    console.error('Error updating variant:', error);
    res.status(500).json({ error: 'Failed to update variant' });
  }
}

// GET /admin/:tenant/products/mt/:mtProductId/variants/:mtVariantId - Get single variant with MT data by MT IDs
export async function getProductVariantByMtId(req: Request, res: Response) {
  try {
    const { tenant, mtProductId, mtVariantId } = req.params;
    const { inventory_location } = req.query;
    
    const result = await validateTenantAndSession(req, tenant);
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const variant = await prisma.productVariant.findFirst({
      where: { 
        mtVariantId,
        product: {
          mtProductId,
          tenantId: tenant,
        },
      },
      include: {
        product: true,
        images: {
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });

    if (!variant || !variant.product) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    // Fetch MT data for pricing/stock
    const sessionData = result;
    const params = new URLSearchParams({});
    if (inventory_location) {
      params.append('inventory_location', String(inventory_location));
    }

    const mtResponse = await proxyToMarianatek(`product_variants/${variant.mtVariantId}?${params.toString()}`, {
      mtSubdomain: sessionData.tenant.mtSubdomain,
      audience: 'admin',
      accessToken: sessionData.session.accessToken,
    });

    let mtData = null;
    if (mtResponse.ok) {
      const mtResponseData = await mtResponse.json();
      mtData = mtResponseData.data;
    }

    res.json({
      variant: {
        ...variant,
        images: variant.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'variant'),
        })),
        mtData,
      },
    });
  } catch (error: any) {
    console.error('Error fetching variant by MT ID:', error);
    res.status(500).json({ error: 'Failed to fetch variant' });
  }
}

// PUT /admin/:tenant/products/mt/:mtProductId/variants/:mtVariantId - Update variant by MT IDs
export async function putProductVariantByMtId(req: Request, res: Response) {
  try {
    const { tenant, mtProductId, mtVariantId } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const variant = await prisma.productVariant.findFirst({
      where: { 
        mtVariantId,
        product: {
          mtProductId,
          tenantId: tenant,
        },
      },
      include: {
        product: true,
      },
    });

    if (!variant || !variant.product) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const { description, visible, sortOrder } = req.body;

    // Handle image updates
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const imageFiles = files?.images || [];
    const featuredIndex = req.body.featuredImageIndex ? parseInt(req.body.featuredImageIndex, 10) : -1;
    const deletedImageIds = req.body.deletedImageIds ? JSON.parse(req.body.deletedImageIds || '[]') : [];

    await prisma.$transaction(async (tx) => {
      // Delete removed images
      if (deletedImageIds.length > 0) {
        const imagesToDelete = await tx.productImage.findMany({
          where: {
            id: { in: deletedImageIds },
            variantId: variant.id,
          },
        });

        for (const img of imagesToDelete) {
          await storage.deleteImage(img.filename, 'variant');
        }

        await tx.productImage.deleteMany({
          where: {
            id: { in: deletedImageIds },
            variantId: variant.id,
          },
        });
      }

      // Always clear all featured flags first to ensure only one image is featured
      await tx.productImage.updateMany({
        where: { variantId: variant.id },
        data: { isFeatured: false },
      });

      // Add new images (initially all set to isFeatured: false)
      if (imageFiles.length > 0) {
        const existingImages = await tx.productImage.findMany({
          where: { variantId: variant.id },
        });
        const maxSortOrder = existingImages.length > 0 
          ? Math.max(...existingImages.map(img => img.sortOrder))
          : -1;

        const imagePromises = imageFiles.map(async (file, index) => {
          const filename = await storage.saveImage(file.buffer, file.originalname, file.mimetype, 'variant');
          return tx.productImage.create({
            data: {
              productId: null,
              variantId: variant.id,
              filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              isFeatured: false, // Will be set below if this is the featured image
              sortOrder: maxSortOrder + 1 + index,
            },
          });
        });

        await Promise.all(imagePromises);
      }

      // Set the correct featured image
      const featuredImageId = req.body.featuredImageId;
      if (featuredImageId) {
        // User selected an existing image as featured
        await tx.productImage.update({
          where: { id: featuredImageId },
          data: { isFeatured: true },
        });
      } else if (featuredIndex >= 0 && imageFiles.length > 0) {
        // User selected a new image as featured by index
        const newImages = await tx.productImage.findMany({
          where: { variantId: variant.id },
          orderBy: { sortOrder: 'desc' },
          take: imageFiles.length,
        });
        if (newImages[featuredIndex]) {
          await tx.productImage.update({
            where: { id: newImages[featuredIndex].id },
            data: { isFeatured: true },
          });
        }
      } else if (imageFiles.length > 0 && featuredIndex === -1) {
        // Default: first new image if no selection
        const newImages = await tx.productImage.findMany({
          where: { variantId: variant.id },
          orderBy: { sortOrder: 'desc' },
          take: imageFiles.length,
        });
        if (newImages[0]) {
          await tx.productImage.update({
            where: { id: newImages[0].id },
            data: { isFeatured: true },
          });
        }
      }

      // Update variant fields
      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          ...(description !== undefined && { description: description || null }),
          ...(visible !== undefined && { visible: visible === 'true' }),
          ...(sortOrder !== undefined && { sortOrder: sortOrder ? parseInt(String(sortOrder), 10) : null }),
        },
      });
    });

    // Fetch updated variant
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: variant.id },
      include: {
        images: {
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });

    res.json({
      variant: {
        ...updatedVariant,
        images: updatedVariant!.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'variant'),
        })),
      },
    });
  } catch (error: any) {
    console.error('Error updating variant by MT ID:', error);
    res.status(500).json({ error: 'Failed to update variant' });
  }
}

// POST /admin/:tenant/products/sync - Sync selected products from MT
export async function syncProducts(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const result = await validateTenantAndSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const { productIds } = req.body as { productIds: string[] };

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'productIds array is required' });
    }

    const sessionData = result;
    const summary = {
      synced: 0,
      newVariants: 0,
      deletedVariants: 0,
      updatedVariants: 0,
      errors: [] as string[],
    };

    // Process each product
    for (const productId of productIds) {
      try {
        const product = await prisma.product.findFirst({
          where: { id: productId, tenantId: tenant },
          include: { variants: true },
        });

        if (!product) {
          summary.errors.push(`Product ${productId} not found`);
          continue;
        }

        // Fetch current product and variants from MT
        const productParams = new URLSearchParams({ include: 'product_class' });
        const productResponse = await proxyToMarianatek(`products/${product.mtProductId}?${productParams.toString()}`, {
          mtSubdomain: sessionData.tenant.mtSubdomain,
          audience: 'admin',
          accessToken: sessionData.session.accessToken,
        });

        if (!productResponse.ok) {
          summary.errors.push(`Product ${productId} not found in MT`);
          continue;
        }

        const productData = await productResponse.json();
        const mtProductAttrs = productData.data?.attributes || {};

        // Update product with MT title/description if changed
        if (mtProductAttrs.title && mtProductAttrs.title !== product.mtTitle) {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              mtTitle: mtProductAttrs.title,
              mtDescription: mtProductAttrs.description || null,
            },
          });
        }

        // Fetch variants from MT
        const variantParams = new URLSearchParams({
          parent: String(product.mtProductId),
          page: '1',
          page_size: '100',
        });

        const variantsResponse = await proxyToMarianatek(`product_variants?${variantParams.toString()}`, {
          mtSubdomain: sessionData.tenant.mtSubdomain,
          audience: 'admin',
          accessToken: sessionData.session.accessToken,
        });

        let mtVariants: any[] = [];
        if (variantsResponse.ok) {
          const variantsData = await variantsResponse.json();
          mtVariants = variantsData.data || [];
        }

        // Compare and sync variants
        const dbVariantMap = new Map(product.variants.map(v => [v.mtVariantId, v]));
        const mtVariantMap = new Map(mtVariants.map((v: any) => [String(v.id), v]));

        // Find new variants (in MT but not in DB)
        const newVariants = mtVariants.filter((v: any) => !dbVariantMap.has(String(v.id)));

        // Find deleted variants (in DB but not in MT)
        const deletedVariants = product.variants.filter(v => !mtVariantMap.has(v.mtVariantId));

        // Find updated variants (SKU changed)
        const updatedVariants = product.variants.filter(v => {
          const mtVariant = mtVariantMap.get(v.mtVariantId);
          if (!mtVariant) return false;
          const mtSku = mtVariant.attributes?.sku || '';
          return mtSku !== v.sku;
        });

        // Apply changes in transaction
        await prisma.$transaction(async (tx) => {
          // Create new variants
          for (const mtVariant of newVariants) {
            const attrs = mtVariant.attributes || {};
            const variantAttrs = Array.isArray(attrs.variant_attributes)
              ? attrs.variant_attributes.filter((a: any) => a.value != null)
              : [];
            const priceRaw = attrs.price != null ? parseFloat(attrs.price) : null;
            await tx.productVariant.create({
              data: {
                productId: product.id,
                mtVariantId: String(mtVariant.id),
                sku: attrs.sku || '',
                description: null,
                mtTitle: attrs.title || null,
                mtPrice: (priceRaw != null && !isNaN(priceRaw)) ? priceRaw : null,
                mtAttributes: variantAttrs.length > 0 ? variantAttrs : undefined,
                visible: true,
                sortOrder: product.variants.length + newVariants.indexOf(mtVariant),
              },
            });
            summary.newVariants++;
          }

          // Update SKU + price + attributes for changed variants
          for (const variant of updatedVariants) {
            const mtVariant = mtVariantMap.get(variant.mtVariantId);
            if (mtVariant) {
              const attrs = mtVariant.attributes || {};
              const variantAttrs = Array.isArray(attrs.variant_attributes)
                ? attrs.variant_attributes.filter((a: any) => a.value != null)
                : [];
              const priceRaw = attrs.price != null ? parseFloat(attrs.price) : null;
              await tx.productVariant.update({
                where: { id: variant.id },
                data: {
                  sku: attrs.sku || variant.sku,
                  mtTitle: attrs.title || null,
                  mtPrice: (priceRaw != null && !isNaN(priceRaw)) ? priceRaw : null,
                  mtAttributes: variantAttrs.length > 0 ? variantAttrs : undefined,
                },
              });
              summary.updatedVariants++;
            }
          }

          // Refresh price + attributes for all unchanged existing variants too
          const unchangedVariants = product.variants.filter(v => {
            const mtVariant = mtVariantMap.get(v.mtVariantId);
            return mtVariant && !updatedVariants.includes(v);
          });
          for (const variant of unchangedVariants) {
            const mtVariant = mtVariantMap.get(variant.mtVariantId);
            if (mtVariant) {
              const attrs = mtVariant.attributes || {};
              const variantAttrs = Array.isArray(attrs.variant_attributes)
                ? attrs.variant_attributes.filter((a: any) => a.value != null)
                : [];
              const priceRaw = attrs.price != null ? parseFloat(attrs.price) : null;
              await tx.productVariant.update({
                where: { id: variant.id },
                data: {
                  mtTitle: attrs.title || null,
                  mtPrice: (priceRaw != null && !isNaN(priceRaw)) ? priceRaw : null,
                  mtAttributes: variantAttrs.length > 0 ? variantAttrs : undefined,
                },
              });
            }
          }

          // Soft delete removed variants (set visible to false)
          // Note: We keep them in DB to preserve user's custom images/descriptions
          for (const variant of deletedVariants) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { visible: false },
            });
            summary.deletedVariants++;
          }
        });

        summary.synced++;
      } catch (error: any) {
        console.error(`Error syncing product ${productId}:`, error);
        summary.errors.push(`Product ${productId}: ${error.message}`);
      }
    }

    res.json({ summary });
  } catch (error: any) {
    console.error('Error syncing products:', error);
    res.status(500).json({ error: 'Failed to sync products' });
  }
}

