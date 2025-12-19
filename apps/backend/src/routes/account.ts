import type { Request, Response } from 'express';
import { prisma } from '../prisma';
import { env } from '../config';
import { proxyToMarianatek } from '../services/proxy';

/**
 * GET /admin/:tenant/account
 * Fetches the authenticated admin's account info
 * 
 * Uses /api/tenants/self to get tenant details from Marianatek
 */
export async function getAdminAccount(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const cookieName = env.COOKIE_NAME || 'sync5_session';
    const sessionId = req.cookies?.[cookieName];

    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { tenant: true },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Verify tenant matches
    if (session.tenantId !== tenant) {
      return res.status(403).json({ error: 'Tenant mismatch' });
    }

    // Verify admin role
    if (session.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Fetch tenant info from Marianatek /api/tenants/self
    let mtTenantData: any = null;

    try {
      const mtResponse = await proxyToMarianatek('tenants/self/', {
        mtSubdomain: session.tenant.mtSubdomain,
        audience: 'admin',
        accessToken: session.accessToken,
      });

      if (mtResponse.ok) {
        const mtData = await mtResponse.json();
        // JSON:API format: { data: { id, type, attributes: { ... } } }
        mtTenantData = mtData.data?.attributes || null;
      }
    } catch (mtError) {
      console.warn('Could not fetch from Marianatek:', mtError);
    }

    // Build response
    return res.json({
      data: {
        // Session info
        role: session.role,
        
        // Tenant info from our database
        tenant: {
          id: session.tenant.id,
          name: mtTenantData?.name || session.tenant.name,
          slug: session.tenant.slug,
          mtSubdomain: session.tenant.mtSubdomain,
        },

        // Additional MT tenant info if available
        mtTenant: mtTenantData ? {
          id: mtTenantData.id,
          name: mtTenantData.name,
          email: mtTenantData.email,
          phone: mtTenantData.phone_number,
          timezone: mtTenantData.timezone,
          currency: mtTenantData.currency_code,
        } : null,
      },
    });
  } catch (e: any) {
    console.error('getAdminAccount error:', e);
    return res.status(500).json({ error: e.message });
  }
}
