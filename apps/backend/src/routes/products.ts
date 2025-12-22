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

    const { mtProductId, description, visible = 'true' } = req.body;

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
          visible: visible === 'true',
          sortOrder: null,
        },
      });

      // Create all variants
      const variantPromises = mtVariants.map((mtVariant: any, index: number) => {
        const attrs = mtVariant.attributes || {};
        return tx.productVariant.create({
          data: {
            productId: newProduct.id,
            mtVariantId: String(mtVariant.id),
            sku: attrs.sku || '',
            description: null,
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
      },
    });

    res.status(201).json({
      product: {
        ...createdProduct,
        images: createdProduct!.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'product'),
        })),
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

    const { description, visible, sortOrder } = req.body;

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

      // Add new images
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
              isFeatured: index === featuredIndex || (featuredIndex === -1 && index === 0),
              sortOrder: maxSortOrder + 1 + index,
            },
          });
        });

        await Promise.all(imagePromises);
      }

      // Update featured image if specified
      if (featuredIndex >= 0 && imageFiles.length === 0) {
        // User is just changing featured flag on existing images
        const featuredImageId = req.body.featuredImageId;
        if (featuredImageId) {
          await tx.productImage.updateMany({
            where: { productId: id },
            data: { isFeatured: false },
          });
          await tx.productImage.update({
            where: { id: featuredImageId },
            data: { isFeatured: true },
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
      },
    });

    res.json({
      product: {
        ...updatedProduct,
        images: updatedProduct!.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'product'),
        })),
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

      // Add new images
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
              isFeatured: index === featuredIndex || (featuredIndex === -1 && index === 0),
              sortOrder: maxSortOrder + 1 + index,
            },
          });
        });

        await Promise.all(imagePromises);
      }

      // Update featured image if specified
      if (featuredIndex >= 0 && imageFiles.length === 0) {
        const featuredImageId = req.body.featuredImageId;
        if (featuredImageId) {
          await tx.productImage.updateMany({
            where: { variantId: id },
            data: { isFeatured: false },
          });
          await tx.productImage.update({
            where: { id: featuredImageId },
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
            await tx.productVariant.create({
              data: {
                productId: product.id,
                mtVariantId: String(mtVariant.id),
                sku: attrs.sku || '',
                description: null,
                visible: true,
                sortOrder: product.variants.length + newVariants.indexOf(mtVariant),
              },
            });
            summary.newVariants++;
          }

          // Update SKU for changed variants
          for (const variant of updatedVariants) {
            const mtVariant = mtVariantMap.get(variant.mtVariantId);
            if (mtVariant) {
              const attrs = mtVariant.attributes || {};
              await tx.productVariant.update({
                where: { id: variant.id },
                data: { sku: attrs.sku || variant.sku },
              });
              summary.updatedVariants++;
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

