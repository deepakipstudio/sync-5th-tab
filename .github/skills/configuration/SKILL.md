# Configuration Skills

Environment variables validated with Zod. Multi-tenant URL building at runtime. Frontend runtime config.

## Environment Variables

**File:** `apps/backend/src/config.ts`

### Required Variables

```bash
DATABASE_URL=postgresql://...
COOKIE_SECRET=your-secret-key
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Optional Variables

```bash
PORT=4000
COOKIE_NAME=sync5_session
SESSION_MAX_AGE_SECONDS=86400
NODE_ENV=development
```

### Frontend Variables

```bash
# Backend URL
NUXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Admin cache feature flag (default: enabled)
NUXT_PUBLIC_ADMIN_CACHE_ENABLED=true  # or false to disable
```

### Validation

```typescript
import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  COOKIE_SECRET: z.string().min(1),
  OAUTH_REDIRECT_URI: z.string().min(1),
  PORT: z.string().default('4000'),
})

const parsed = EnvSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error)
  process.exit(1)
}
```

## Multi-Tenant Configuration

**NEVER hardcode Marianatek URLs. Build dynamically from tenant data.**

### Helper Functions

**File:** `apps/backend/src/config.ts`

```typescript
// Base URL
export function getMTBaseURL(mtSubdomain: string): string {
  return `https://${mtSubdomain}.marianatek.com`
}

// OAuth URLs
export function getMTOAuthURLs(mtSubdomain: string) {
  const base = getMTBaseURL(mtSubdomain)
  return {
    authUrl: `${base}/o/authorize`,
    tokenUrl: `${base}/o/token`,
  }
}

// API URLs
export function getMTApiURLs(mtSubdomain: string) {
  const base = getMTBaseURL(mtSubdomain)
  return {
    adminApi: `${base}/api`,
    customerApi: `${base}/api/customer/v1`,
  }
}
```

### Usage

```typescript
// Get tenant from database
const tenant = await prisma.tenant.findUnique({ where: { id } })

// Build URLs dynamically
const { adminApi } = getMTApiURLs(tenant.mtSubdomain)
// => "https://studio1.marianatek.com/api"
```

## Frontend Runtime Config

**File:** `apps/frontend/nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      backendUrl: process.env.NUXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
      adminCacheEnabled: process.env.NUXT_PUBLIC_ADMIN_CACHE_ENABLED !== 'false' && process.env.NUXT_PUBLIC_ADMIN_CACHE_ENABLED !== '0' && process.env.NUXT_PUBLIC_ADMIN_CACHE_ENABLED !== ''
    }
  }
})
```

### Usage

```typescript
const config = useRuntimeConfig()
const backendUrl = config.public.backendUrl
```

### Environment Variables

```bash
# Backend URL
NUXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Admin cache (optional, defaults to enabled)
NUXT_PUBLIC_ADMIN_CACHE_ENABLED=true  # Set to 'false' to disable caching
```

## File Locations

- Backend config: `apps/backend/src/config.ts`
- Frontend config: `apps/frontend/nuxt.config.ts`
- Environment files: `.env` (backend), `.env` (frontend)

## Important Notes

- Always validate env vars with Zod
- Never hardcode Marianatek URLs
- Build URLs from tenant `mtSubdomain` at runtime
- Frontend config: use `NUXT_PUBLIC_*` prefix for client access
- Fail fast on invalid configuration
- Admin caching: controlled via `NUXT_PUBLIC_ADMIN_CACHE_ENABLED` (see `.github/skills/caching/SKILL.md`)


