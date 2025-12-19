import type { Request, Response } from 'express';
import { prisma } from '../prisma';

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

  res.json({ banners });
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

  res.json({ banner });
}

// POST /admin/:tenant/banners -> create banner for tenant
export async function postTenantBanner(req: Request, res: Response) {
  const { tenant } = req.params;
  const dbTenant = await validateTenant(tenant);
  if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

  const { imageUrl, collectionId, productClass, expiresAt, sortOrder, visible } = req.body as {
    imageUrl: string;
    collectionId?: number;
    productClass?: string;
    expiresAt?: string;
    sortOrder?: number;
    visible?: boolean;
  };

  if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });

  const banner = await prisma.banner.create({
    data: {
      tenantId: dbTenant.id,
      imageUrl,
      collectionId: collectionId ?? null,
      productClass: productClass ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      sortOrder: sortOrder ?? null,
      visible: visible ?? true,
    },
  });

  res.status(201).json({ banner });
}

// PUT /admin/:tenant/banners/:id -> update banner
export async function putTenantBanner(req: Request, res: Response) {
  const { tenant, id } = req.params;
  const dbTenant = await validateTenant(tenant);
  if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

  // Verify banner belongs to tenant
  const existingBanner = await prisma.banner.findFirst({
    where: { id, tenantId: dbTenant.id },
  });

  if (!existingBanner) return res.status(404).json({ error: 'banner not found' });

  const { imageUrl, collectionId, productClass, expiresAt, sortOrder, visible } = req.body as {
    imageUrl?: string;
    collectionId?: number | null;
    productClass?: string | null;
    expiresAt?: string | null;
    sortOrder?: number | null;
    visible?: boolean;
  };

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      ...(imageUrl !== undefined && { imageUrl }),
      ...(collectionId !== undefined && { collectionId }),
      ...(productClass !== undefined && { productClass }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(visible !== undefined && { visible }),
    },
  });

  res.json({ banner });
}

// DELETE /admin/:tenant/banners/:id -> delete banner
export async function deleteTenantBanner(req: Request, res: Response) {
  const { tenant, id } = req.params;
  const dbTenant = await validateTenant(tenant);
  if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

  // Verify banner belongs to tenant
  const existingBanner = await prisma.banner.findFirst({
    where: { id, tenantId: dbTenant.id },
  });

  if (!existingBanner) return res.status(404).json({ error: 'banner not found' });

  await prisma.banner.delete({ where: { id } });

  res.json({ ok: true });
}
