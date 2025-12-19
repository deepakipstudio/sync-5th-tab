/**
 * Proxy Service for Marianatek API
 *
 * Multi-tenant aware: Routes requests to the correct tenant's Marianatek instance.
 * URLs are built dynamically based on tenant.mtSubdomain.
 *
 * URL Structure:
 *   - Admin API:    https://{subdomain}.marianatek.com/api/{endpoint}
 *   - Customer API: https://{subdomain}.marianatek.com/api/customer/v1/{endpoint}
 *
 * Usage:
 *   // Admin API call
 *   const response = await proxyToMarianatek('/tenants/self/', {
 *     mtSubdomain: tenant.mtSubdomain,
 *     audience: 'admin',
 *     accessToken: userToken,
 *   })
 *
 *   // Customer API call  
 *   const response = await proxyToMarianatek('/customers/', {
 *     mtSubdomain: tenant.mtSubdomain,
 *     audience: 'customer',
 *     accessToken: userToken,
 *   })
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
  
  // Remove leading slash from path to avoid URL resolution issues
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Ensure baseUrl ends with / for proper concatenation
  const fullUrl = baseUrl.endsWith('/') ? `${baseUrl}${cleanPath}` : `${baseUrl}/${cleanPath}`;

  console.log(`[proxyToMarianatek] ${fullUrl}`); // Debug log

  const headers: HeadersInit = {
    ...(fetchOptions.headers || {}),
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return fetch(fullUrl, {
    ...fetchOptions,
    headers,
  });
}
