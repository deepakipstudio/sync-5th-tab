import type { Request, Response } from 'express';
import { env, getMTOAuthURLs } from '../config';
import { prisma } from '../prisma';
import { exchangeCodeForTokens } from '../services/oauth';
import crypto from 'crypto';

// GET /auth/mt/redirect -> Build Marianatek authorize URL (PKCE)
export async function authRedirect(req: Request, res: Response) {
  const { tenant } = req.query as { tenant?: string };
  if (!tenant) return res.status(400).json({ error: 'tenant is required' });

  // Lookup tenant by UUID
  const tenantRecord = await prisma.tenant.findUnique({ where: { id: tenant } });
  if (!tenantRecord) return res.status(404).json({ error: 'tenant not found' });

  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = base64url(sha256(codeVerifier));

  // Store temporary state + verifier in-memory for starter; replace with Redis later
  (req.app as any).pkceStore ??= new Map<string, { codeVerifier: string; tenantId: string }>();
  (req.app as any).pkceStore.set(state, { codeVerifier, tenantId: tenantRecord.id });

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
    const { code, state, role, userId } = req.body as {
      code: string;
      state: string;
      role: 'admin' | 'customer';
      userId: string;
    };
    if (!code || !state || !role || !userId) return res.status(400).json({ error: 'invalid payload' });

    const store: Map<string, { codeVerifier: string; tenantId: string }> = (req.app as any).pkceStore;
    const entry = store?.get(state);
    if (!entry) return res.status(400).json({ error: 'invalid state' });

    const tenant = await prisma.tenant.findUnique({ where: { id: entry.tenantId } });
    if (!tenant) return res.status(404).json({ error: 'tenant not found' });

    const tokens = await exchangeCodeForTokens({
      code,
      codeVerifier: entry.codeVerifier,
      mtSubdomain: tenant.mtSubdomain,
      clientId: tenant.clientId,
      clientSecret: tenant.clientSecret ?? undefined,
    });

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const session = await prisma.session.create({
      data: {
        userId,
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

    res.json({ ok: true, role, tenant: tenant.slug });
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
