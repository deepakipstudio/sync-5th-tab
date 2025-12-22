# Frontend Skills

Nuxt 4 SPA application using Vue 3 Composition API. Admin interface with multi-tenant routing and session-based authentication.

## Technologies

- Nuxt 4 (SPA mode, SSR disabled)
- Vue 3 Composition API with `<script setup>`
- Tailwind CSS
- TypeScript
- `$fetch` for API calls (not `useFetch`)

## Configuration

**File:** `apps/frontend/nuxt.config.ts`

- SPA mode: `ssr: false` (required for cookie-based auth)
- Runtime config: `config.public.backendUrl` for API calls
- Tailwind module: `@nuxtjs/tailwindcss`

```typescript
const config = useRuntimeConfig()
const backendUrl = config.public.backendUrl // http://localhost:4000
```

## Composables

**Location:** `apps/frontend/composables/`

### useAuth()

Reactive auth state management using `useState()`.

```typescript
const { role, tenantId, userId, authStatus, ensureAuthLoaded } = useAuth()

// Check auth status
if (authStatus.value === 'unknown') {
  await ensureAuthLoaded()
}
```

**State:**
- `role`: `'admin' | 'customer' | null`
- `tenantId`: `string | null`
- `userId`: `string | null`
- `authStatus`: `'unknown' | 'authenticated' | 'unauthenticated'`

### useTenant()

Simple tenant state.

```typescript
const { tenant } = useTenant()
```

## Routing

**Location:** `apps/frontend/pages/`

### Route Structure

- Admin: `/admin/[tenant]/*`
- Shop: `/shop/[tenant]/*`
- Auth: `/auth/callback` (universal)

### Dynamic Routes

```typescript
const route = useRoute()
const tenantId = route.params.tenant as string
```

### Navigation

```typescript
await navigateTo(`/admin/${tenantId}/products`)
```

## Middleware

**File:** `apps/frontend/middleware/auth.global.ts`

- Runs on every navigation
- Validates session via `/me` endpoint
- Redirects to login if unauthenticated
- Enforces role-based access (admin routes require `role === 'admin'`)

**Skip auth for:**
- `/auth/login`
- `/auth/callback`
- `/` (home page)

## API Communication

**Always use `$fetch` (not `useFetch`) to avoid SSR caching issues.**

```typescript
const config = useRuntimeConfig()

// GET request
const data = await $fetch('/admin/tenant-id/products', {
  baseURL: config.public.backendUrl,
  credentials: 'include', // Required for cookies
})

// POST request
await $fetch('/admin/tenant-id/products', {
  method: 'POST',
  baseURL: config.public.backendUrl,
  credentials: 'include',
  body: { mtProductId: '123' },
})
```

**Error Handling:**

```typescript
try {
  const response = await $fetch(...)
} catch (err: any) {
  error.value = err.data?.error || err.message || 'Request failed'
}
```

## State Management

Use Nuxt's `useState()` for reactive state (not Pinia/Vuex).

```typescript
const loading = useState<boolean>('loading', () => false)
const products = useState<any[]>('products', () => [])

loading.value = true
products.value = data
```

## File Locations

- Pages: `apps/frontend/pages/`
- Composables: `apps/frontend/composables/`
- Middleware: `apps/frontend/middleware/`
- Layouts: `apps/frontend/layouts/`
- Config: `apps/frontend/nuxt.config.ts`
- Tailwind: `apps/frontend/tailwind.config.ts`

## Important Notes

- Always check `authStatus` before accessing protected routes
- Tenant ID comes from URL: `route.params.tenant`
- Use `credentials: 'include'` for all API calls
- Handle loading/error states in all API calls
- Admin pages only: `apps/frontend/pages/admin/`

