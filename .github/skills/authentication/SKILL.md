# Authentication Skills

OAuth 2.0 with PKCE for secure authentication. Session-based with HTTP-only cookies. Multi-tenant with role-based access.

## OAuth 2.0 Flow

**Files:**
- `apps/backend/src/routes/auth.ts`
- `apps/backend/src/services/oauth.ts`
- `apps/frontend/middleware/auth.global.ts`

### Phase 1: Redirect

```typescript
GET /auth/mt/redirect?tenant={id}&role={admin|customer}
```

Backend generates PKCE:
- `state`: UUID for CSRF protection
- `codeVerifier`: Random 32-byte hex
- `codeChallenge`: SHA-256 hash (Base64URL)

Stores in memory: `{ state → { codeVerifier, tenantId, role } }`

### Phase 2: Callback

```typescript
POST /auth/mt/callback
Body: { code, state }
```

Backend:
1. Retrieves PKCE data using `state`
2. Exchanges code for tokens
3. Creates session in database
4. Sets HTTP-only cookie with session ID

### Phase 3: Session Validation

```typescript
GET /me
```

Returns: `{ role, tenantId, userId, preferredLocationId }`

## Session Management

### Session Validation Steps

1. Extract cookie: `req.cookies[sync5_session]`
2. Lookup session in database
3. Check expiry: `session.expiresAt > now()`
4. Verify tenant match
5. Check role (admin routes require `role === 'admin'`)

### Cookie Configuration

```typescript
res.cookie('sync5_session', sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 86400 * 1000, // 24 hours
})
```

### Session Model

```prisma
model Session {
  id           String   @id @default(uuid(7))
  userId       String
  tenantId     String
  accessToken  String
  refreshToken String?
  expiresAt    DateTime
  role         String   // 'admin' | 'customer'
}
```

## Security Patterns

### HTTP-Only Cookies

Prevents XSS token theft. Session ID only, tokens server-side.

### Server-Side Token Storage

OAuth tokens stored in database, never exposed to client.

### Tenant Isolation

Always validate tenant from URL matches session tenant:

```typescript
if (session.tenantId !== tenantId) {
  return { error: 'Tenant mismatch', status: 403 }
}
```

### Role-Based Access

```typescript
if (session.role !== 'admin') {
  return { error: 'Admin access required', status: 403 }
}
```

### PKCE Protection

Prevents authorization code interception attacks.

## Frontend Middleware

**File:** `apps/frontend/middleware/auth.global.ts`

- Validates session on navigation
- Redirects to login if unauthenticated
- Enforces role checks for admin routes

```typescript
if (authStatus.value === 'unauthenticated') {
  return navigateTo(`/admin/${tenantParam}/auth/login`)
}
```

## File Locations

- Auth routes: `apps/backend/src/routes/auth.ts`
- OAuth service: `apps/backend/src/services/oauth.ts`
- Frontend middleware: `apps/frontend/middleware/auth.global.ts`
- Auth composable: `apps/frontend/composables/useAuth.ts`
- Documentation: `docs/authentication.md`

## Important Notes

- PKCE state stored in-memory (replace with Redis for production)
- Session ID in cookie, tokens in database
- Always validate tenant match
- Check role before admin operations
- Tokens never sent to frontend




