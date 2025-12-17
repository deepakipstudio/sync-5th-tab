/**
 * Proxy Service for Marianatek API
 *
 * Multi-tenant aware: Routes requests to the correct tenant's Marianatek instance.
 * URLs are built dynamically based on tenant.mtSubdomain.
 *
 * Usage:
 *   const response = await proxyToMarianatek(
 *     '/customers',
 *     {
 *       mtSubdomain: tenant.mtSubdomain,
 *       audience: 'customer',
 *       accessToken: userToken,
 *     }
 *   )
 */

import { getMTApiURLs } from '../config';

export async function proxyToMarianatek(
  path: string,
  options: RequestInit & {
    mtSubdomain: string;
    audience?: 'admin' | 'customer';
    accessToken?: string;
  }
): Promise<Response> {
  const { mtSubdomain, audience = 'customer', accessToken, ...fetchOptions } = options;
  const { adminApi, customerApi } = getMTApiURLs(mtSubdomain);
  const baseUrl = audience === 'admin' ? adminApi : customerApi;
  const url = new URL(path, baseUrl);

  const headers: HeadersInit = {
    ...(fetchOptions.headers || {}),
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}
