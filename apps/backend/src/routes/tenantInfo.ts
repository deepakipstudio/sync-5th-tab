import type { Request, Response } from 'express';
import { prisma } from '../prisma';

// GET /tenants/:id -> Get tenant info by UUID
export async function getTenantInfo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
      }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({ data: tenant });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// GET /tenants/:id/branding -> Get tenant brand colors for storefront
export async function getTenantBranding(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const tenantBrand = await prisma.tenantBrand.findUnique({
      where: { tenantId: id },
      select: {
        primaryColor: true,
        secondaryColor: true,
        primaryForegroundColor: true,
        secondaryForegroundColor: true,
        storeName: true,
      }
    });
    
    if (!tenantBrand) {
      return res.status(404).json({ error: 'Tenant brand not found' });
    }
    
    res.json({
      primaryBrandColor: tenantBrand.primaryColor,
      secondaryBrandColor: tenantBrand.secondaryColor,
      primaryForegroundColor: tenantBrand.primaryForegroundColor,
      secondaryForegroundColor: tenantBrand.secondaryForegroundColor,
      storeName: tenantBrand.storeName || null,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}