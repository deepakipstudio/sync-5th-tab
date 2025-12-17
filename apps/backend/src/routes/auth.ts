import type { Request, Response } from 'express';
import { env, getMTOAuthURLs } from '../config';
import { prisma } from '../prisma';
import { exchangeCodeForTokens } from '../services/oauth';
import crypto from 'crypto';

// GET /auth/mt/redirect -> Build Marianatek authorize URL (PKCE)
export async function authRedirect(req: Request, res: Response) {
  const { tenant, role } = req.query as { tenant?: string; role?: 'admin' | 'customer' };
  if (!tenant) return res.status(400).json({ error: 'tenant is required' });
  if (!role) return res.status(400).json({ error: 'role is required' });

  // Lookup tenant by UUID
  const tenantRecord = await prisma.tenant.findUnique({ where: { id: tenant } });
  if (!tenantRecord) return res.status(404).json({ error: 'tenant not found' });

  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = base64url(sha256(codeVerifier));

  // Store temporary state + verifier + role in-memory for starter; replace with Redis later
  (req.app as any).pkceStore ??= new Map<string, { codeVerifier: string; tenantId: string; role: 'admin' | 'customer' }>();
  (req.app as any).pkceStore.set(state, { codeVerifier, tenantId: tenantRecord.id, role });

  // Build OAuth URLs dynamically using tenant's mtSubdomain
  const { authUrl } = getMTOAuthURLs(tenantRecord.mtSubdomain);
  const url = new URL(authUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', tenantRecord.clientId);
  url.searchParams.set('redirect_uri', env.OAUTH_REDIRECT_URI);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);

  res.json({ url: url.toString() });
}

// POST /auth/mt/callback -> exchange code+verifier and create session
export async function authCallback(req: Request, res: Response) {
  try {
    const { code, state, userId } = req.body as {
      code: string;
      state: string;
      userId?: string;
    };
    if (!code || !state) return res.status(400).json({ error: 'invalid payload' });

    const store: Map<string, { codeVerifier: string; tenantId: string; role: 'admin' | 'customer' }> = (req.app as any).pkceStore;
    const entry = store?.get(state);
    if (!entry) return res.status(400).json({ error: 'invalid state' });

    const role = entry.role; // Retrieve role from stored state

    const tenant = await prisma.tenant.findUnique({ where: { id: entry.tenantId } });
    if (!tenant) return res.status(404).json({ error: 'tenant not found' });

    const tokens = await exchangeCodeForTokens({
      code,
      codeVerifier: entry.codeVerifier,
      mtSubdomain: tenant.mtSubdomain,
      clientId: tenant.clientId,
      clientSecret: tenant.clientSecret ?? undefined,
      redirectUri: env.OAUTH_REDIRECT_URI,
    });

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const session = await prisma.session.create({
      data: {
        userId: userId || 'oauth-user', // Placeholder until we extract from MT token
        tenantId: tenant.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        role,
      },
    });

    // Set httpOnly cookie with session id only; tokens are server-side
    res.cookie(process.env.COOKIE_NAME || 'sync5_session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: (Number(process.env.SESSION_MAX_AGE_SECONDS || 86400)) * 1000,
    });

    res.json({ ok: true, role, tenantId: tenant.id, tenant: tenant.slug });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
// POST /auth/logout -> Clear session
export async function authLogout(req: Request, res: Response) {
  const cookieName = process.env.COOKIE_NAME || 'sync5_session'
  const sessionId = req.cookies[cookieName]
  
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
  }
  
  res.clearCookie(cookieName)
  res.json({ ok: true })
}

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest();
}
function base64url(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
