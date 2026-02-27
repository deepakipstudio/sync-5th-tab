# API Skills

RESTful API with multi-tenant routing and Marianatek integration. Session-based authentication via HTTP-only cookies.

## Internal API Patterns

### Endpoint Structure

- Admin routes: `/admin/:tenant/*`
- Customer routes: `/:tenant/*`
- Auth routes: `/auth/*` (no tenant)
- Public routes: `/health`, `/me`

### Examples

```typescript
GET  /admin/:tenant/products
POST /admin/:tenant/products
GET  /:tenant/products
GET  /auth/mt/redirect?tenant=xxx&role=admin
POST /auth/mt/callback
GET  /me
```

### CORS Configuration

```typescript
app.use(cors({ origin: true, credentials: true }))
```

## Marianatek Integration

**NEVER hardcode Marianatek URLs. Always use helper functions.**

### Helper Functions

**File:** `apps/backend/src/config.ts`

```typescript
import { getMTBaseURL, getMTOAuthURLs, getMTApiURLs } from '../config'

// Base URL
const base = getMTBaseURL(tenant.mtSubdomain)
// => "https://studio1.marianatek.com"

// OAuth URLs
const { authUrl, tokenUrl } = getMTOAuthURLs(tenant.mtSubdomain)
// authUrl: "https://studio1.marianatek.com/o/authorize"
// tokenUrl: "https://studio1.marianatek.com/o/token"

// API URLs
const { adminApi, customerApi } = getMTApiURLs(tenant.mtSubdomain)
// adminApi: "https://studio1.marianatek.com/api"
// customerApi: "https://studio1.marianatek.com/api/customer/v1"
```

### Proxy Service

**File:** `apps/backend/src/services/proxy.ts`

```typescript
import { proxyToMarianatek } from '../services/proxy'

// Admin API call
const response = await proxyToMarianatek('products/123', {
  mtSubdomain: tenant.mtSubdomain,
  audience: 'admin',
  accessToken: session.accessToken,
})

// Customer API call
const response = await proxyToMarianatek('customers/', {
  mtSubdomain: tenant.mtSubdomain,
  audience: 'customer',
  accessToken: session.accessToken,
})
```

### API Paths

- **Admin API:** `https://{subdomain}.marianatek.com/api/{endpoint}`
- **Customer API:** `https://{subdomain}.marianatek.com/api/customer/v1/{endpoint}`

**Always pass:**
- `mtSubdomain` from tenant record
- `audience: 'admin'` or `'customer'`
- `accessToken` from session

## Response Format

Marianatek uses JSON:API format:

```json
{
  "data": {
    "id": "123",
    "type": "products",
    "attributes": {
      "title": "Product Name",
      "description": "..."
    }
  }
}
```

**Access attributes:**

```typescript
const mtData = await response.json()
const product = mtData.data?.attributes || null
```

## Marianatek API Documentation

**Location:** `docs/marianatek/API Docs/`

- **Admin API:** `docs/marianatek/API Docs/Admin API.yaml`
- **Customer API:** `docs/marianatek/API Docs/Customer API.yaml`
- **Integration Guide:** `docs/marianatek/README.md`

### Using the API Docs

The YAML files are OpenAPI 3.0 specifications:
- Endpoint paths under `paths:`
- Request/response schemas
- Authentication requirements
- Query parameters

**Example endpoint lookup:**

```yaml
paths:
  /products/:
    get:
      operationId: products_list
      parameters:
        - name: page
          schema:
            type: integer
```

**Reference files:**
- `docs/marianatek/API Docs/Admin API.yaml` - All admin endpoints
- `docs/marianatek/API Docs/Customer API.yaml` - All customer endpoints
- `docs/marianatek/README.md` - Integration patterns and best practices

## File Locations

- Proxy service: `apps/backend/src/services/proxy.ts`
- Config helpers: `apps/backend/src/config.ts`
- Routes: `apps/backend/src/routes/`
- API docs: `docs/marianatek/API Docs/`
- Integration guide: `docs/marianatek/README.md`

## Important Notes

- NEVER hardcode Marianatek URLs - always use helpers
- Always pass `mtSubdomain` from tenant record
- Use `audience: 'admin'` or `'customer'` appropriately
- Include `accessToken` from session for authenticated requests
- Check API docs for endpoint details and parameters
- JSON:API format - access data via `data.attributes`












