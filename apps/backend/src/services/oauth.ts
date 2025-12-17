/**
 * OAuth 2.0 Service for Marianatek
 *
 * Multi-tenant aware: URLs are constructed dynamically per tenant.
 * Each tenant has its own Marianatek subdomain and OAuth flow.
 *
 * Usage:
 *   const tokens = await exchangeCodeForTokens({
 *     code,
 *     codeVerifier,
 *     mtSubdomain: tenant.mtSubdomain,
 *     clientId: tenant.mtClientId,
 *     ...
 *   })
 */

import { getMTOAuthURLs } from '../config';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
}

export async function exchangeCodeForTokens({
  code,
  codeVerifier,
  mtSubdomain,
  clientId,
  clientSecret,
  redirectUri,
}: {
  code: string;
  codeVerifier: string;
  mtSubdomain: string;
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
}): Promise<TokenResponse> {
  const { tokenUrl } = getMTOAuthURLs(mtSubdomain);
  const form = new URLSearchParams();
  form.set('grant_type', 'authorization_code');
  form.set('code', code);
  form.set('client_id', clientId);
  if (clientSecret) form.set('client_secret', clientSecret);
  form.set('code_verifier', codeVerifier);
  form.set('redirect_uri', redirectUri || '');

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as TokenResponse;
}
