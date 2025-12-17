/**
 * Multi-Tenant Configuration for Marianatek Integration
 *
 * IMPORTANT: Marianatek URLs are constructed dynamically per tenant at runtime.
 * Each tenant (studio) has its own Marianatek subdomain:
 *
 * Format: https://${tenant.mtSubdomain}.marianatek.com
 *
 * Examples:
 *   - studio1.marianatek.com
 *   - studio2.marianatek.com
 *
 * DO NOT hardcode Marianatek URLs in .env. Instead:
 *   1. Fetch tenant data from database (includes mtSubdomain)
 *   2. Use getMTBaseURL() helper to build base URL
 *   3. Construct auth/API URLs dynamically
 *
 * Helper function:
 *   getMTBaseURL(mtSubdomain: string): string
 *     -> Returns: https://${mtSubdomain}.marianatek.com
 */

import dotenv from 'dotenv';
dotenv.config();
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  COOKIE_SECRET: z.string().min(1),
  COOKIE_NAME: z.string().default('sync5_session'),
  SESSION_MAX_AGE_SECONDS: z.string().default('86400'),
  OAUTH_REDIRECT_URI: z.string().min(1),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  PORT: Number(parsed.data.PORT),
  SESSION_MAX_AGE_SECONDS: Number(parsed.data.SESSION_MAX_AGE_SECONDS),
};

/**
 * Build Marianatek base URL for a tenant
 *
 * @param mtSubdomain - The tenant's Marianatek subdomain (e.g., "studio1")
 * @returns Full base URL (e.g., "https://studio1.marianatek.com")
 */
export function getMTBaseURL(mtSubdomain: string): string {
  return `https://${mtSubdomain}.marianatek.com`;
}

/**
 * Build Marianatek OAuth URLs for a tenant
 */
export function getMTOAuthURLs(mtSubdomain: string) {
  const base = getMTBaseURL(mtSubdomain);
  return {
    authUrl: `${base}/o/authorize`,
    tokenUrl: `${base}/o/token`,
  };
}

/**
 * Build Marianatek API base URLs for a tenant
 */
export function getMTApiURLs(mtSubdomain: string) {
  const base = getMTBaseURL(mtSubdomain);
  return {
    adminApi: `${base}/api/admin`,
    customerApi: `${base}/api/customer`,
  };
}
