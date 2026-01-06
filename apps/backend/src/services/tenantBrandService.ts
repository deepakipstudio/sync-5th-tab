import { prisma } from '../prisma';
import { proxyToMarianatek } from './proxy';

/**
 * Sync tenant brand data from Marianatek Admin API
 * 
 * Fetches from /api/tenant_brands/ and updates/creates TenantBrand record
 * 
 * @param tenantId - The tenant ID
 * @param mtSubdomain - The Marianatek subdomain
 * @param accessToken - The OAuth access token for Marianatek API
 * @returns The created/updated TenantBrand record
 */
export async function syncTenantBrand(
  tenantId: string,
  mtSubdomain: string,
  accessToken: string
) {
  try {
    // Fetch from Marianatek Admin API
    const response = await proxyToMarianatek('tenant_brands/', {
      mtSubdomain,
      audience: 'admin',
      accessToken,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Marianatek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract first result from JSON:API format
    // Response format: { data: [{ id, type, attributes: { ... } }] }
    const brandData = data.data?.[0]?.attributes;

    if (!brandData) {
      throw new Error('No tenant brand data found in Marianatek response');
    }

    // Map Marianatek fields to our schema
    const brandName = brandData.brand_name || null;
    const primaryColor = brandData.primary_color || null;
    const primaryForegroundColor = brandData.primary_foreground_color || null;
    const secondaryColor = brandData.secondary_color || null;
    const secondaryForegroundColor = brandData.secondary_foreground_color || null;
    const logoLightUrl = brandData.logo_light || null;
    const logoDarkUrl = brandData.logo_dark || null;

    // Upsert TenantBrand record
    const tenantBrand = await prisma.tenantBrand.upsert({
      where: { tenantId },
      update: {
        brandName,
        primaryColor,
        primaryForegroundColor,
        secondaryColor,
        secondaryForegroundColor,
        logoLightUrl,
        logoDarkUrl,
      },
      create: {
        tenantId,
        brandName,
        primaryColor,
        primaryForegroundColor,
        secondaryColor,
        secondaryForegroundColor,
        logoLightUrl,
        logoDarkUrl,
      },
    });

    return tenantBrand;
  } catch (error: any) {
    console.error(`[syncTenantBrand] Error syncing brand for tenant ${tenantId}:`, error);
    throw error;
  }
}

