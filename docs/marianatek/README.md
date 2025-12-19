# Marianatek Multi-Tenant Integration

This project integrates with **Marianatek**, a fitness studio management platform. Since this is a **multi-tenant SaaS application**, each studio (tenant) has its own Marianatek subdomain.

## 🏗️ Architecture

### Multi-Tenant Structure

Each tenant in the database has:
- `id`: Unique tenant identifier
- `mtSubdomain`: Tenant's Marianatek subdomain (e.g., "studio1", "studio2")
- `mtClientId`: OAuth client ID for this tenant's Marianatek instance
- `mtClientSecret`: OAuth client secret (optional)

### URL Format

```
https://${tenant.mtSubdomain}.marianatek.com
```

**Examples:**
- `https://studio1.marianatek.com`
- `https://studio2.marianatek.com`
- `https://corporate.marianatek.com`

## ✅ Best Practices

### ❌ DO NOT

```typescript
// ❌ Never hardcode URLs
const apiBase = 'https://tenant.example.com/api/customer'
const authUrl = 'https://tenant.example.com/o/authorize'
```

### ✅ DO

```typescript
// ✅ Use helper functions
import { getMTBaseURL, getMTOAuthURLs, getMTApiURLs } from '../config'

const baseUrl = getMTBaseURL(tenant.mtSubdomain)
// Result: "https://studio1.marianatek.com"

const { authUrl, tokenUrl } = getMTOAuthURLs(tenant.mtSubdomain)
// Result: {
//   authUrl: "https://studio1.marianatek.com/o/authorize",
//   tokenUrl: "https://studio1.marianatek.com/o/token"
// }

const { adminApi, customerApi } = getMTApiURLs(tenant.mtSubdomain)
// Result: {
//   adminApi: "https://studio1.marianatek.com/api/admin",
//   customerApi: "https://studio1.marianatek.com/api/customer"
// }
```

## 📋 Available Helpers

### `getMTBaseURL(mtSubdomain: string): string`

Returns the base Marianatek URL for a tenant.

```typescript
const base = getMTBaseURL('studio1')
// => "https://studio1.marianatek.com"
```

### `getMTOAuthURLs(mtSubdomain: string): { authUrl: string; tokenUrl: string }`

Returns OAuth 2.0 endpoints for a tenant.

```typescript
const { authUrl, tokenUrl } = getMTOAuthURLs(tenant.mtSubdomain)

// Use for authorization code flow:
const authRedirectUrl = new URL(authUrl)
authRedirectUrl.searchParams.set('client_id', tenant.mtClientId)
authRedirectUrl.searchParams.set('response_type', 'code')
// ... other PKCE parameters

// Use for token exchange:
const tokenResponse = await fetch(tokenUrl, { /* ... */ })
```

### `getMTApiURLs(mtSubdomain: string): { adminApi: string; customerApi: string }`

Returns API base URLs for a tenant.

**URL Structure:**
- Admin API: `https://{subdomain}.marianatek.com/api/{endpoint}`
- Customer API: `https://{subdomain}.marianatek.com/api/customer/v1/{endpoint}`

```typescript
const { adminApi, customerApi } = getMTApiURLs(tenant.mtSubdomain)
// adminApi    = "https://studio1.marianatek.com/api"
// customerApi = "https://studio1.marianatek.com/api/customer/v1"

// Call admin endpoints (e.g., /api/tenants/self/)
const adminResponse = await fetch(`${adminApi}/tenants/self/`, { /* ... */ })

// Call customer endpoints (e.g., /api/customer/v1/customers/)
const customerResponse = await fetch(`${customerApi}/customers/`, { /* ... */ })
```

## 🔐 OAuth 2.0 Flow

### Step 1: Authorization Redirect

**Endpoint:** `GET /auth/mt/redirect`

```typescript
import { getMTOAuthURLs } from '../config'

const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
const { authUrl } = getMTOAuthURLs(tenant.mtSubdomain)

const authRedirectUrl = new URL(authUrl)
authRedirectUrl.searchParams.set('client_id', tenant.mtClientId)
authRedirectUrl.searchParams.set('response_type', 'code')
authRedirectUrl.searchParams.set('redirect_uri', env.OAUTH_REDIRECT_URI)
// ... add PKCE params (code_challenge, state, etc.)

res.redirect(authRedirectUrl.toString())
```

### Step 2: Token Exchange

**Endpoint:** `POST /auth/mt/callback`

```typescript
import { exchangeCodeForTokens } from '../services/oauth'

const tokens = await exchangeCodeForTokens({
  code,
  codeVerifier,
  mtSubdomain: tenant.mtSubdomain,  // ← Use tenant subdomain
  clientId: tenant.mtClientId,
  redirectUri: env.OAUTH_REDIRECT_URI,
})
```

### Step 3: API Calls

```typescript
import { proxyToMarianatek } from '../services/proxy'

// Fetch customer data
const response = await proxyToMarianatek('/customers', {
  mtSubdomain: tenant.mtSubdomain,   // ← Specify tenant
  audience: 'customer',
  accessToken: userToken,
})
```

## 📝 Database Schema

The `Tenant` model should include:

```prisma
model Tenant {
  id             String   @id @default(cuid())
  name           String
  mtSubdomain    String   @unique   // e.g., "studio1"
  mtClientId     String
  mtClientSecret String?
  // ... other fields
}
```

## 🚀 Future Enhancements

- [ ] Token refresh logic (store refresh_token in database)
- [ ] Rate limiting per tenant
- [ ] Webhook handlers for tenant events
- [ ] Admin dashboard for managing Marianatek integrations

## 🐛 Common Issues

### "Invalid Subdomain" Error

**Cause:** Using wrong `mtSubdomain` from database

**Fix:** Double-check the tenant's `mtSubdomain` value:

```typescript
const tenant = await db.tenant.findUnique({ where: { id } })
console.log('Subdomain:', tenant.mtSubdomain)
```

### "401 Unauthorized" on API Calls

**Cause:** Token expired or invalid `accessToken`

**Fix:** Ensure token is fresh and being passed correctly:

```typescript
const response = await proxyToMarianatek('/path', {
  mtSubdomain: tenant.mtSubdomain,
  accessToken: userToken,  // Must be non-empty
})
```

### "Connection Refused"

**Cause:** Using hardcoded URL or incorrect subdomain

**Fix:** Use helper functions and verify subdomain format:

```typescript
// ✓ Correct
const url = getMTBaseURL(tenant.mtSubdomain)

// ✗ Wrong
const url = 'https://example.com'
```

## 📚 Related Files

- Backend configuration: [src/config.ts](../../apps/backend/src/config.ts)
- OAuth service: [src/services/oauth.ts](../../apps/backend/src/services/oauth.ts)
- API proxy: [src/services/proxy.ts](../../apps/backend/src/services/proxy.ts)
- Auth routes: [src/routes/auth.ts](../../apps/backend/src/routes/auth.ts)
