import type { Request, Response } from 'express';
import { prisma } from '../prisma';
import { env, getMTApiURLs } from '../config';
import { proxyToMarianatek } from '../services/proxy';

/**
 * GET /debug/mt-endpoints/:tenant
 * 
 * Debug endpoint to test various Marianatek API endpoints
 * and see what data is available. Remove in production!
 */
export async function debugMTEndpoints(req: Request, res: Response) {
  try {
    const { tenant } = req.params;
    const cookieName = env.COOKIE_NAME || 'sync5_session';
    const sessionId = req.cookies?.[cookieName];

    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { tenant: true },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    if (session.tenantId !== tenant) {
      return res.status(403).json({ error: 'Tenant mismatch' });
    }

    // Check token expiry
    const tokenExpired = new Date(session.expiresAt).getTime() <= Date.now();
    const { adminApi } = getMTApiURLs(session.tenant.mtSubdomain);

    const results: Record<string, any> = {};

    // List of endpoints to test
    const endpointsToTest = [
      '/tenants/self/',
      '/tenants/self',  // Try without trailing slash
      '/tenant_brands/',
      '/employees/',
    ];

    for (const endpoint of endpointsToTest) {
      const fullUrl = `${adminApi}${endpoint}`;
      try {
        console.log(`Testing endpoint: ${fullUrl}`);
        const response = await proxyToMarianatek(endpoint, {
          mtSubdomain: session.tenant.mtSubdomain,
          audience: 'admin',
          accessToken: session.accessToken,
        });

        const status = response.status;
        let data: any = null;
        let rawText: string = '';

        try {
          rawText = await response.text();
          data = JSON.parse(rawText);
        } catch (parseErr) {
          // Keep raw text if not JSON
        }

        results[endpoint] = {
          fullUrl,
          status,
          ok: response.ok,
          data,
          rawText: rawText.substring(0, 500), // First 500 chars
        };
      } catch (err: any) {
        results[endpoint] = {
          fullUrl,
          status: 0,
          ok: false,
          data: null,
          error: err.message,
        };
      }
    }

    return res.json({
      message: 'Marianatek API endpoint test results',
      mtSubdomain: session.tenant.mtSubdomain,
      adminApiBase: adminApi,
      sessionInfo: {
        expiresAt: session.expiresAt,
        tokenExpired,
        role: session.role,
        // Show first/last few chars of token to verify it exists
        accessTokenPreview: session.accessToken 
          ? `${session.accessToken.substring(0, 10)}...${session.accessToken.substring(session.accessToken.length - 10)}`
          : 'NO TOKEN',
      },
      results,
    });
  } catch (e: any) {
    console.error('debugMTEndpoints error:', e);
    return res.status(500).json({ error: e.message });
  }
}
