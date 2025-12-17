import type { Request, Response } from 'express';
import { prisma } from '../prisma';
import { proxyToMarianatek } from '../services/proxy';

// GET /:tenant/products -> visible products for tenant
export async function getTenantProducts(req: Request, res: Response) {
  const { tenant } = req.params;
  const dbTenant = await prisma.tenant.findFirst({ where: { slug: tenant } });
  if (!dbTenant) return res.status(404).json({ error: 'tenant not found' });

  const products = await prisma.product.findMany({
    where: { tenantId: dbTenant.id, visible: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  // Placeholder: augment with Marianatek data via proxy if needed
  // const mtRes = await proxyToMarianatek('/products', { audience: 'customer' });

  res.json({ items: products });
}
