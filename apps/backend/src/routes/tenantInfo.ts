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
