import type { Request, Response } from 'express';
import { prisma } from '../prisma';

// POST /admin/:tenant/banners -> create/update banners for tenant
export async function postTenantBanner(req: Request, res: Response) {
  const { tenant } = req.params;
  const dbTenant = await prisma.tenant.findUnique({ where: { id: tenant } });
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
