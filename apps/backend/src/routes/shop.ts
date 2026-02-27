import type { Request, Response } from 'express';
import { prisma } from '../prisma';
import { proxyToMarianatek } from '../services/proxy';
import { storage } from '../services/storage';
import { fetchLocationsForTenant } from '../services/locationService';

/**
 * Validate customer session for shop routes
 * 
 * @param req - Express request
 * @param tenantId - Tenant ID from route parameter
 * @returns Session and tenant data, or error object
 */
async function validateCustomerSession(req: Request, tenantId: string) {
  const cookieName = process.env.COOKIE_NAME || 'sync5_session';
  const sessionId = req.cookies?.[cookieName];
  
  if (!sessionId) {
    return { error: 'No session', status: 401 };
  }

  const session = await prisma.session.findUnique({ 
    where: { id: sessionId },
    include: { tenant: true }
  });
  
  if (!session) {
    return { error: 'Invalid session', status: 401 };
  }
  
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return { error: 'Session expired', status: 401 };
  }

  // Verify customer role
  if (session.role !== 'customer') {
    return { error: 'Invalid role', status: 403 };
  }

  // Verify tenant matches
  if (session.tenantId !== tenantId) {
    return { error: 'Tenant mismatch', status: 403 };
  }

  return { session, tenant: session.tenant };
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBREV: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

/** Build a single-line address from location attributes (formatted_address or parts). */
function buildAddressFromLocation(attrs: {
  formatted_address?: string | null;
  address_line_one?: string | null;
  address_line_two?: string | null;
  address_line_three?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
}): string | undefined {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a6de727a-68a8-45e2-a4c6-8f390c9db417',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7f7ae4'},body:JSON.stringify({sessionId:'7f7ae4',location:'shop.ts:buildAddressFromLocation',message:'attrs received',hypothesisId:'A-B-C-D',data:{formatted_address_type:typeof attrs.formatted_address,formatted_address_value:attrs.formatted_address,address_line_one:attrs.address_line_one,city:attrs.city,state_province:attrs.state_province,postal_code:attrs.postal_code},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (attrs.formatted_address && String(attrs.formatted_address).trim()) {
    return String(attrs.formatted_address).trim();
  }
  const parts = [
    attrs.address_line_one,
    attrs.address_line_two,
    attrs.address_line_three,
    attrs.city,
    attrs.state_province,
    attrs.postal_code,
  ].filter((p) => p != null && String(p).trim() !== '');
  return parts.length ? parts.map((p) => String(p).trim()).join(', ') : undefined;
}

/** Format HH:MM to display (e.g. 09:00 -> 9am, 17:00 -> 5pm). */
function formatTimeHHMM(hhmm: string | null): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'am' : 'pm';
  const min = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
  return `${hour}${min}${ampm}`;
}

/** Format tenant store hours for display; supports all-same, per-day, and closed days. */
function formatStoreHoursForDisplay(
  storeHours: Array<{ dayOfWeek: string; openTime: string | null; closeTime: string | null; isOpen: boolean }>
): string {
  if (!storeHours?.length) return '';

  const byDay = new Map<string, { openTime: string | null; closeTime: string | null; isOpen: boolean }>();
  for (const h of storeHours) {
    byDay.set(h.dayOfWeek, {
      openTime: h.openTime,
      closeTime: h.closeTime,
      isOpen: h.isOpen ?? false,
    });
  }

  const ordered = DAY_ORDER.map((day) => {
    const row = byDay.get(day) ?? { isOpen: false, openTime: null, closeTime: null };
    return { day, abbr: DAY_ABBREV[day], ...row };
  }).map((d) => ({
    ...d,
    isOpen: d.isOpen ?? false,
    key: `${d.isOpen ? 'open' : 'closed'}-${d.openTime ?? ''}-${d.closeTime ?? ''}`,
  }));

  // Group consecutive days with same schedule
  const groups: Array<{ days: string[]; abbrs: string[]; isOpen: boolean; openTime: string | null; closeTime: string | null }> = [];
  for (const row of ordered) {
    const last = groups[groups.length - 1];
    const sameAsLast =
      last &&
      last.isOpen === row.isOpen &&
      last.openTime === row.openTime &&
      last.closeTime === row.closeTime;
    if (sameAsLast) {
      last.days.push(row.day);
      last.abbrs.push(row.abbr);
    } else {
      groups.push({
        days: [row.day],
        abbrs: [row.abbr],
        isOpen: row.isOpen,
        openTime: row.openTime,
        closeTime: row.closeTime,
      });
    }
  }

  const parts = groups.map((g) => {
    const range = g.abbrs.length === 1 ? g.abbrs[0] : `${g.abbrs[0]}-${g.abbrs[g.abbrs.length - 1]}`;
    if (!g.isOpen) return `${range}: Closed`;
    const open = formatTimeHHMM(g.openTime);
    const close = formatTimeHHMM(g.closeTime);
    return `${range}: ${open}-${close}`;
  });

  return parts.join('; ');
}

/**
 * Fetch locations from Marianatek Customer API
 */
async function fetchCustomerLocations(
  mtSubdomain: string,
  accessToken: string
): Promise<Array<{ id: string; name: string; address?: string; hours?: string }>> {
  try {
    // Try without trailing slash first (per API docs: /locations)
    let response = await proxyToMarianatek('locations', {
      mtSubdomain,
      audience: 'customer',
      accessToken,
    });

    // If 404, try with trailing slash (some APIs require it)
    if (!response.ok && response.status === 404) {
      response = await proxyToMarianatek('locations/', {
        mtSubdomain,
        audience: 'customer',
        accessToken,
      });
    }

    // If still 404, Customer API might not have locations endpoint - fallback to Admin API
    if (!response.ok && response.status === 404) {
      // Customer API doesn't have locations endpoint - use Admin API instead
      // This is acceptable since we have admin session access
      response = await proxyToMarianatek('locations/', {
        mtSubdomain,
        audience: 'admin',
        accessToken,
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Marianatek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a6de727a-68a8-45e2-a4c6-8f390c9db417',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7f7ae4'},body:JSON.stringify({sessionId:'7f7ae4',location:'shop.ts:fetchCustomerLocations',message:'raw MT API response shape',hypothesisId:'C-D',data:{hasResults:!!(data.results&&Array.isArray(data.results)),hasData:!!(data.data&&Array.isArray(data.data)),firstResultKeys:data.results?.[0]?Object.keys(data.results[0]):null,firstDataItemKeys:data.data?.[0]?Object.keys(data.data[0]):null,firstAttrKeys:data.data?.[0]?.attributes?Object.keys(data.data[0].attributes):null,firstLocSnippet:data.results?.[0]?{fa:data.results[0].formatted_address,fa_type:typeof data.results[0].formatted_address}:null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // Extract locations from JSON:API format
    let locations: Array<{ id: string; name: string; address?: string; hours?: string }> = [];

    if (data.results && Array.isArray(data.results)) {
      // Standard REST API format
      locations = data.results.map((loc: any) => ({
        id: String(loc.id),
        name: loc.name || 'Unnamed Location',
        address: buildAddressFromLocation({
          formatted_address: loc.formatted_address,
          address_line_one: loc.address_line_one,
          address_line_two: loc.address_line_two,
          address_line_three: loc.address_line_three,
          city: loc.city,
          state_province: loc.state_province,
          postal_code: loc.postal_code,
        }),
        hours: undefined, // Populated from TenantBrand below
      }));
    } else if (data.data && Array.isArray(data.data)) {
      // JSON:API format
      locations = data.data.map((item: any) => {
        const attrs = item.attributes || {};
        return {
          id: String(item.id),
          name: attrs.name || item.name || 'Unnamed Location',
          address: buildAddressFromLocation({
            formatted_address: attrs.formatted_address,
            address_line_one: attrs.address_line_one,
            address_line_two: attrs.address_line_two,
            address_line_three: attrs.address_line_three,
            city: attrs.city,
            state_province: attrs.state_province,
            postal_code: attrs.postal_code,
          }),
          hours: undefined as string | undefined,
        };
      });
    }

    return locations;
  } catch (error: any) {
    console.error(`[fetchCustomerLocations] Error fetching locations:`, error);
    throw error;
  }
}

// GET /shop/:tenant/locations -> Get available locations (from Marianatek Customer API) + tenant store hours
export async function getShopLocations(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const result = await validateCustomerSession(req, tenant);

    if ('error' in result) {
      return res.status(result.status || 401).json({ error: result.error });
    }

    const locations = await fetchCustomerLocations(
      result.tenant.mtSubdomain,
      result.session.accessToken
    );

    // Tenant-level store hours (later: per-location hours can be keyed by locationId)
    const tenantBrand = await prisma.tenantBrand.findUnique({
      where: { tenantId: result.tenant.id },
      include: { storeHours: { orderBy: { dayOfWeek: 'asc' } } },
    });
    const storeHoursFormatted = tenantBrand?.storeHours?.length
      ? formatStoreHoursForDisplay(
          tenantBrand.storeHours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isOpen: h.isOpen,
          }))
        )
      : '';

    const locationsWithHours = locations.map((loc) => ({
      ...loc,
      hours: storeHoursFormatted || undefined,
    }));

    res.json({ locations: locationsWithHours });
  } catch (error: any) {
    console.error('Error fetching shop locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
}

// GET /shop/:tenant/banners -> Get visible banners for homepage slider
export async function getShopBanners(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const result = await validateCustomerSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 401).json({ error: result.error });
    }

    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        tenantId: tenant,
        visible: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      include: {
        category: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ],
    });

    const bannersWithUrl = banners.map(banner => ({
      ...banner,
      imageUrl: storage.getFileUrl(banner.filename),
    }));

    res.json({ banners: bannersWithUrl });
  } catch (error: any) {
    console.error('Error fetching shop banners:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
}

// GET /shop/:tenant/categories -> Get all active categories with product counts
export async function getShopCategories(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const result = await validateCustomerSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 401).json({ error: result.error });
    }

    const categories = await prisma.category.findMany({
      where: {
        tenantId: tenant,
        deletedAt: null, // Exclude soft-deleted categories
      },
      include: {
        products: {
          where: {
            product: {
              visible: true, // Only count visible products
            }
          },
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
    console.error('Error fetching shop categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

/** Look up a valid admin session for the tenant to use with the admin MT API */
async function getAdminToken(tenantId: string): Promise<{ accessToken: string; mtSubdomain: string } | null> {
  const adminSession = await prisma.session.findFirst({
    where: { tenantId, role: 'admin' },
    include: { tenant: true },
    orderBy: { expiresAt: 'desc' },
  });
  if (!adminSession || new Date(adminSession.expiresAt).getTime() <= Date.now()) {
    return null;
  }
  return { accessToken: adminSession.accessToken, mtSubdomain: adminSession.tenant.mtSubdomain };
}

/** Enrich variants with live price/stock/attributes from MT admin API, optionally scoped to a location */
async function enrichVariantsWithMtApi(
  variants: any[],
  mtProductId: string,
  tenantId: string,
  locationId?: string
): Promise<any[]> {
  const adminCreds = await getAdminToken(tenantId);
  if (!adminCreds) {
    return variants.map(v => ({ ...v, mtPrice: null, mtStock: null, mtAttributes: [] }));
  }

  const { accessToken, mtSubdomain } = adminCreds;
  try {
    const params = new URLSearchParams({ parent: mtProductId, page: '1', page_size: '100' });
    const mtResponse = await proxyToMarianatek(`product_variants?${params.toString()}`, {
      mtSubdomain,
      audience: 'admin',
      accessToken,
    });

    if (!mtResponse.ok) {
      return variants.map(v => ({ ...v, mtPrice: null, mtStock: null, mtAttributes: [] }));
    }

    const mtData = await mtResponse.json();
    const mtVariants: any[] = mtData.data || mtData.results || [];

    const mtMap = new Map<string, { price: number | null; stock: number | null; variantAttributes: any[] }>();
    for (const mv of mtVariants) {
      const attrs = mv.attributes || {};
      let price = attrs.price != null ? parseFloat(attrs.price) : null;
      let stock = attrs.present_quantity != null ? parseInt(attrs.present_quantity, 10) : null;

      // Apply location-specific overrides when a locationId is provided
      if (locationId && Array.isArray(attrs.region_overrides)) {
        for (const region of attrs.region_overrides) {
          if (Array.isArray(region.location_overrides)) {
            const locOverride = region.location_overrides.find(
              (loc: any) => String(loc.id) === String(locationId)
            );
            if (locOverride) {
              if (locOverride.price != null) price = parseFloat(locOverride.price);
              if (locOverride.present_quantity != null) stock = parseInt(locOverride.present_quantity, 10);
              break;
            }
          }
        }
      }

      const variantAttributes: any[] = Array.isArray(attrs.variant_attributes)
        ? attrs.variant_attributes
            .filter((a: any) => a.value != null)
            .map((a: any) => ({ name: a.name || a.code || '', value: a.value, code: a.code || '' }))
        : [];

      mtMap.set(String(mv.id), { price, stock, variantAttributes });
    }

    return variants.map(v => {
      const mt = mtMap.get(String(v.mtVariantId));
      return {
        ...v,
        mtPrice: mt?.price ?? null,
        mtStock: mt?.stock ?? null,
        mtAttributes: mt?.variantAttributes ?? [],
      };
    });
  } catch (err) {
    console.error('Error enriching variants from MT API:', err);
    return variants.map(v => ({ ...v, mtPrice: null, mtStock: null, mtAttributes: [] }));
  }
}

// GET /shop/:tenant/categories/:slug -> Get category with products
export async function getShopCategory(req: Request, res: Response) {
  try {
    const { tenant, slug } = req.params;
    const result = await validateCustomerSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 401).json({ error: result.error });
    }

    const category = await prisma.category.findFirst({
      where: {
        tenantId: tenant,
        slug,
        deletedAt: null,
      },
      include: {
        products: {
          where: {
            product: {
              visible: true,
            }
          },
          include: {
            product: {
              include: {
                images: {
                  where: { productId: { not: null } },
                  orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
                },
                variants: {
                  where: { visible: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const products = await Promise.all(category.products.map(async pc => {
      const product = pc.product;
      const variants = await enrichVariantsWithMtApi(product.variants, product.mtProductId, tenant);
      return {
        ...product,
        images: product.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'product'),
        })),
        variants,
      };
    }));

    const { products: _, ...categoryWithoutProducts } = category;
    
    res.json({
      category: {
        ...categoryWithoutProducts,
        imageUrl: category.imageUrl ? storage.getCategoryImageUrl(category.imageUrl) : null,
      },
      products,
    });
  } catch (error: any) {
    console.error('Error fetching shop category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
}

// GET /shop/:tenant/products -> Get products (filtered by category if provided)
export async function getShopProducts(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const { categoryId } = req.query;
    const result = await validateCustomerSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 401).json({ error: result.error });
    }

    const where: any = {
      tenantId: tenant,
      visible: true,
    };

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId as string,
        },
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: {
          where: { visible: true },
          orderBy: { sortOrder: 'asc' },
        },
        images: {
          where: { productId: { not: null } },
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
        categories: {
          where: {
            category: {
              deletedAt: null,
            },
          },
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ],
    });

    const productsWithUrls = await Promise.all(products.map(async product => {
      const variants = await enrichVariantsWithMtApi(product.variants, product.mtProductId, tenant);
      return {
        ...product,
        images: product.images.map(img => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'product'),
        })),
        variants,
        categories: product.categories
          .filter(pc => pc.category && pc.category.deletedAt === null)
          .map(pc => pc.category),
      };
    }));

    res.json({ products: productsWithUrls });
  } catch (error: any) {
    console.error('Error fetching shop products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

// GET /shop/:tenant/products/:id -> Get product with variants and images
export async function getShopProduct(req: Request, res: Response) {
  try {
    const { tenant, id } = req.params;
    const { locationId } = req.query;
    const result = await validateCustomerSession(req, tenant);
    
    if ('error' in result) {
      return res.status(result.status || 401).json({ error: result.error });
    }

    const product = await prisma.product.findFirst({
      where: {
        id,
        tenantId: tenant,
        visible: true,
      },
      include: {
        variants: {
          where: { visible: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            images: {
              orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
            },
          },
        },
        images: {
          where: { productId: { not: null } },
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        },
        categories: {
          where: {
            category: {
              deletedAt: null,
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

    // Use DB-stored MT title/description (set during admin product sync)
    const mtTitle: string | null = product.mtTitle || null;
    const mtDescription: string | null = product.mtDescription || null;

    const enrichedVariants = await enrichVariantsWithMtApi(
      product.variants,
      product.mtProductId,
      tenant,
      locationId ? String(locationId) : undefined
    );

    const productWithUrls = {
      ...product,
      mtTitle,
      mtDescription,
      images: product.images.map(img => ({
        ...img,
        imageUrl: storage.getImageUrl(img.filename, 'product'),
      })),
      variants: enrichedVariants.map((v, i) => ({
        ...v,
        images: (product.variants[i]?.images || []).map((img: any) => ({
          ...img,
          imageUrl: storage.getImageUrl(img.filename, 'variant'),
        })),
      })),
      categories: product.categories
        .filter(pc => pc.category && pc.category.deletedAt === null)
        .map(pc => pc.category),
    };

    res.json({ product: productWithUrls });
  } catch (error: any) {
    console.error('Error fetching shop product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

