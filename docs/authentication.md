# Authentication System

> **Last Updated:** December 18, 2025  
> **Status:** ✅ Implemented and Working

## Overview

The Sync 5th Tab application uses **OAuth 2.0 with PKCE** (Proof Key for Code Exchange) for secure authentication. Each tenant has their own Marianatek OAuth credentials, allowing users to authenticate directly with their studio's Marianatek account.

### Key Characteristics

- **Multi-tenant OAuth:** Each tenant has unique OAuth credentials (Client ID, Client Secret)
- **Role-based access:** Users can authenticate as either `customer` or `admin`
- **Secure flow:** PKCE prevents authorization code interception attacks
- **Session-based:** Uses HTTP-only cookies to store session IDs
- **Server-side tokens:** OAuth tokens stored securely in database, never exposed to client

---

## Architecture Components

### Backend (Express + Prisma)
- **Auth Routes:** `/auth/mt/redirect`, `/auth/mt/callback`, `/auth/logout`
- **Session Storage:** PostgreSQL via Prisma (Session model)
- **PKCE Store:** In-memory Map (temporary; will move to Redis for production)

### Frontend (Nuxt 4)
- **Login Pages:**
  - Customer: `/shop/[tenant]/auth/login`
  - Admin: `/admin/[tenant]/auth/login`
- **Callback Handler:** `/auth/callback` (universal for both roles)
- **Protected Routes:** Middleware validates session on all `/shop/` and `/admin/` routes

### External
- **OAuth Provider:** Marianatek (per-tenant subdomain, e.g., `ipstudio.sandbox.marianatek.com`)

---

## Authentication Flow

### Phase 1: Login Initiation

**User Action:** Navigate to login page
- Customer: `http://localhost:3000/shop/{tenantId}/auth/login`
- Admin: `http://localhost:3000/admin/{tenantId}/auth/login`

**What Happens:**

1. **Frontend** extracts `tenantId` from URL parameter
2. **Frontend** calls backend redirect endpoint:
   ```typescript
   GET /auth/mt/redirect?tenant={tenantId}&role={customer|admin}
   ```
3. **Backend** performs:
   - Validates tenant exists in database
   - Generates PKCE parameters:
     - `state`: Random UUID for CSRF protection
     - `codeVerifier`: Random 32-byte hex string
     - `codeChallenge`: SHA-256 hash of codeVerifier (Base64URL encoded)
   - Stores in memory: `{ state → { codeVerifier, tenantId, role } }`
   - Builds Marianatek OAuth URL:
     ```
     https://{mtSubdomain}.marianatek.com/oauth2/authorize?
       response_type=code
       &client_id={clientId}
       &redirect_uri=http://localhost:3000/auth/callback
       &code_challenge={codeChallenge}
       &code_challenge_method=S256
       &state={state}
     ```
4. **Frontend** redirects user to Marianatek OAuth URL

**Files Involved:**
- [apps/frontend/pages/shop/[tenant]/auth/login.vue](../apps/frontend/pages/shop/[tenant]/auth/login.vue)
- [apps/frontend/pages/admin/[tenant]/auth/login.vue](../apps/frontend/pages/admin/[tenant]/auth/login.vue)
- [apps/backend/src/routes/auth.ts](../apps/backend/src/routes/auth.ts) → `authRedirect()`

---

### Phase 2: User Authentication at Marianatek

**User Action:** Enters credentials on Marianatek login page

**What Happens:**

1. User authenticates with their Marianatek account
2. User authorizes the application
3. **Marianatek** redirects back to app:
   ```
   http://localhost:3000/auth/callback?code={authCode}&state={state}
   ```

**Note:** The `state` parameter is the same one generated in Phase 1, allowing us to retrieve the stored PKCE data.

---

### Phase 3: OAuth Callback & Token Exchange

**User Action:** Automatic (triggered by redirect)

**What Happens:**

1. **Frontend** `/auth/callback` page loads
2. **Frontend** extracts query parameters:
   - `code`: Authorization code from Marianatek
   - `state`: CSRF token from Phase 1
3. **Frontend** calls backend callback endpoint:
   ```typescript
   POST /auth/mt/callback
   Body: { code, state }
   ```
4. **Backend** performs:
   - Retrieves PKCE data from memory using `state`
   - Validates `state` exists (prevents CSRF)
   - Retrieves `{ codeVerifier, tenantId, role }` from stored data
   - Loads tenant from database to get OAuth credentials
   - Exchanges authorization code for tokens:
     ```
     POST https://{mtSubdomain}.marianatek.com/oauth2/token
     Body:
       grant_type=authorization_code
       code={code}
       redirect_uri=http://localhost:3000/auth/callback
       client_id={clientId}
       client_secret={clientSecret}
       code_verifier={codeVerifier}
     ```
   - Marianatek responds with:
     ```json
     {
       "access_token": "...",
       "refresh_token": "...",
       "expires_in": 3600
     }
     ```
   - Creates session in database:
     ```typescript
     Session {
       id: uuid_v7(),
       userId: 'oauth-user', // Placeholder; will extract from token later
       tenantId: tenant.id,
       role: 'customer' | 'admin',
       accessToken: '...', // Encrypted in production
       refreshToken: '...',
       expiresAt: new Date(...)
     }
     ```
   - Sets HTTP-only cookie:
     ```
     sync5_session={sessionId}
     HttpOnly; Secure (in prod); SameSite=Lax; MaxAge=86400s
     ```
   - Returns response:
     ```json
     {
       "ok": true,
       "role": "customer",
       "tenantId": "019b2e39-e527-7111-b41d-779d8a5806bf",
       "tenant": "ipstudio.sandbox"
     }
     ```
5. **Frontend** redirects user based on role:
   - Customer → `/shop/{tenantId}`
   - Admin → `/admin/{tenantId}`

**Files Involved:**
- [apps/frontend/pages/auth/callback.vue](../apps/frontend/pages/auth/callback.vue)
- [apps/backend/src/routes/auth.ts](../apps/backend/src/routes/auth.ts) → `authCallback()`
- [apps/backend/src/services/oauth.ts](../apps/backend/src/services/oauth.ts) → `exchangeCodeForTokens()`

---

### Phase 4: Authenticated Session

**User Action:** Navigate anywhere in the app

**What Happens:**

1. **Frontend** middleware runs on every navigation
2. **Middleware** checks if route requires authentication
3. **Middleware** validates session cookie exists
4. **Backend** (future implementation) will validate session and return user data
5. Protected routes render for authenticated users
6. Unauthenticated users redirect to login

**Files Involved:**
- [apps/frontend/middleware/auth.global.ts](../apps/frontend/middleware/auth.global.ts)

---

## Security Features

### PKCE (Proof Key for Code Exchange)
- **Problem:** Authorization code interception attacks
- **Solution:** Generate random `codeVerifier`, send SHA-256 hash (`codeChallenge`) to OAuth provider
- **Result:** Only the client with the original `codeVerifier` can exchange the code for tokens

### State Parameter
- **Problem:** CSRF attacks on OAuth callback
- **Solution:** Generate random UUID, store server-side, validate on callback
- **Result:** Prevents attackers from injecting malicious authorization codes

### HTTP-Only Cookies
- **Problem:** XSS attacks stealing session tokens
- **Solution:** Session ID stored in HTTP-only cookie, inaccessible to JavaScript
- **Result:** Even if XSS exists, attacker cannot steal session

### Server-Side Token Storage
- **Problem:** OAuth tokens exposed to client-side code
- **Solution:** Tokens stored in database, never sent to frontend
- **Result:** Client cannot access or leak OAuth tokens

---

## Database Schema

### Session Model
```prisma
model Session {
  id           String   @id @default(uuid(7))
  userId       String
  tenantId     String
  accessToken  String
  refreshToken String?
  expiresAt    DateTime
  role         String   // 'customer' | 'admin'
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}
```

### Tenant Model (OAuth Config)
```prisma
model Tenant {
  id           String  @id @default(uuid(7))
  name         String
  slug         String  @unique
  mtSubdomain  String  // e.g., 'ipstudio.sandbox'
  clientId     String  // OAuth Client ID
  clientSecret String? // OAuth Client Secret (encrypted)
  // ... other fields
}
```

---

## Configuration

### Environment Variables

**Backend (.env)**
```bash
# OAuth
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
OAUTH_TOKEN_ENDPOINT_PATH=/oauth2/token
OAUTH_AUTHORIZE_ENDPOINT_PATH=/oauth2/authorize

# Session
COOKIE_NAME=sync5_session
SESSION_MAX_AGE_SECONDS=86400  # 24 hours
```

**Frontend (.env)**
```bash
NUXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

---

## Testing the Flow

### Test Tenant: IPSTUDIO Sandbox
```
UUID: 019b2e39-e527-7111-b41d-779d8a5806bf
Subdomain: ipstudio.sandbox
OAuth URL: https://ipstudio.sandbox.marianatek.com
```

### Test as Customer
1. Visit: `http://localhost:3000/shop/019b2e39-e527-7111-b41d-779d8a5806bf/auth/login`
2. Redirected to Marianatek login
3. Enter credentials
4. Redirected back to: `http://localhost:3000/shop/019b2e39-e527-7111-b41d-779d8a5806bf`

### Test as Admin
1. Visit: `http://localhost:3000/admin/019b2e39-e527-7111-b41d-779d8a5806bf/auth/login`
2. Redirected to Marianatek login
3. Enter credentials
4. Redirected back to: `http://localhost:3000/admin/019b2e39-e527-7111-b41d-779d8a5806bf`

### Manual Testing (curl)
```bash
# Step 1: Get OAuth URL
curl "http://localhost:4000/auth/mt/redirect?tenant=019b2e39-e527-7111-b41d-779d8a5806bf&role=customer"

# Step 2: Visit returned URL in browser, authenticate
# Step 3: Extract code & state from callback URL
# Step 4: Exchange for session
curl -X POST "http://localhost:4000/auth/mt/callback" \
  -H "Content-Type: application/json" \
  -d '{"code":"AUTH_CODE","state":"STATE_UUID"}'
```

---

## Future Enhancements

### Planned Improvements

1. **User ID Extraction**
   - Extract actual user ID from Marianatek token
   - Store user profile data (name, email, etc.)
   - Link sessions to real user records

2. **Redis for PKCE Storage**
   - Replace in-memory Map with Redis
   - Add TTL for PKCE entries (5 minutes)
   - Enable horizontal scaling

3. **Token Encryption**
   - Encrypt OAuth tokens before storing in database
   - Use AES-256-GCM with key rotation

4. **Token Refresh**
   - Implement automatic token refresh before expiry
   - Background job to refresh expiring tokens
   - Graceful handling of refresh failures

5. **Session Management**
   - User can view active sessions
   - Revoke sessions remotely
   - Automatic cleanup of expired sessions

6. **Multi-factor Authentication**
   - Optional MFA for admin accounts
   - TOTP-based verification

7. **Audit Logging**
   - Log all authentication attempts
   - Track session creation/deletion
   - Alert on suspicious activity

---

## Troubleshooting

### Common Issues

**Problem: "Failed to get login URL"**
- **Cause:** Backend not running or tenant not found
- **Solution:** Verify backend is running on port 4000, check tenant UUID

**Problem: 404 at `/auth/callback`**
- **Cause:** OAuth redirect URI mismatch
- **Solution:** Ensure `OAUTH_REDIRECT_URI` matches Marianatek config

**Problem: "Invalid state" error**
- **Cause:** PKCE state expired or server restarted
- **Solution:** Restart login flow; implement Redis for production

**Problem: Session cookie not set**
- **Cause:** CORS or SameSite cookie restrictions
- **Solution:** Ensure backend and frontend on same domain in production

---

## Related Documentation

- [Environment Setup](./environment-setup.md) - Required environment variables
- [Secrets Management](./secrets-management.md) - Managing OAuth credentials
- [Production Checklist](./production-checklist.md) - Pre-deployment security review

---

**Maintainers:** Update this document when authentication flow changes.  
**Questions?** Check the code comments in `apps/backend/src/routes/auth.ts` for implementation details.
