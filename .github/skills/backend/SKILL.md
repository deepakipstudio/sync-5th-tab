# Backend Skills

Express.js backend with TypeScript, Prisma ORM, and multi-tenant architecture. Session-based authentication with OAuth 2.0 integration.

## Technologies

- Express.js with TypeScript
- Prisma ORM (PostgreSQL)
- Zod for env validation
- Multer for file uploads
- Cookie-parser for sessions

## Route Organization

**Location:** `apps/backend/src/routes/`

One file per domain:
- `auth.ts` - OAuth flow
- `products.ts` - Product management
- `admin.ts` - Admin operations (banners, uploads)
- `tenant.ts` - Customer-facing endpoints
- `me.ts` - Session validation
- `account.ts` - Account info

**Server setup:** `apps/backend/src/server.ts`

## Session Validation

**Pattern:** `validateTenantAndSession()` helper

```typescript
async function validateTenantAndSession(req: Request, tenantId: string) {
  const cookieName = env.COOKIE_NAME || 'sync5_session'
  const sessionId = req.cookies?.[cookieName]

  if (!sessionId) {
    return { error: 'Not authenticated', status: 401 }
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { tenant: true },
  })

  // Validate expiry, tenant match, role
  if (session.tenantId !== tenantId) {
    return { error: 'Tenant mismatch', status: 403 }
  }

  return { session, tenant: session.tenant }
}
```

**Usage:**

```typescript
const result = await validateTenantAndSession(req, tenant)
if ('error' in result) {
  return res.status(result.status || 500).json({ error: result.error })
}
const { session, tenant } = result
```

## Prisma Queries

**Always filter by `tenantId`:**

```typescript
const products = await prisma.product.findMany({
  where: { tenantId: tenant },
  include: {
    variants: { orderBy: { sortOrder: 'asc' } },
    images: { orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }] },
  },
  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
})
```

**Include patterns:**

```typescript
include: {
  tenant: true,
  variants: true,
  images: true,
}
```

**Unique constraints:**

```typescript
where: {
  tenantId_mtProductId: {
    tenantId: tenant,
    mtProductId: String(mtProductId),
  },
}
```

## Error Handling

**HTTP Status Codes:**
- `400` - Bad request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (no permission)
- `404` - Not found
- `500` - Server error

**Error Format:**

```typescript
return res.status(400).json({ error: 'mtProductId is required' })
```

**Try-catch pattern:**

```typescript
try {
  // ... logic
  res.json({ data })
} catch (e: any) {
  res.status(500).json({ error: e.message })
}
```

## Service Layer

**Location:** `apps/backend/src/services/`

- `proxy.ts` - Marianatek API proxy
- `storage.ts` - File storage abstraction
- `oauth.ts` - OAuth token exchange

**Usage:**

```typescript
import { proxyToMarianatek } from '../services/proxy'
import { storage } from '../services/storage'
```

## File Locations

- Routes: `apps/backend/src/routes/`
- Services: `apps/backend/src/services/`
- Config: `apps/backend/src/config.ts`
- Prisma: `apps/backend/prisma/schema.prisma`
- Server: `apps/backend/src/server.ts`
- Types: `apps/backend/src/types.ts`

## Important Notes

- Always validate tenant from URL matches session tenant
- Use `validateTenantAndSession()` for admin routes
- Return consistent error format: `{ error: string }`
- Session cookies: `httpOnly`, `secure` in production, `sameSite: 'lax'`
- Always include tenant in Prisma queries








