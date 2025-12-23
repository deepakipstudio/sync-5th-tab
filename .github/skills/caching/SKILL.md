# Admin Caching Skills

Pinia-based caching system for admin backend UI. Provides instant rendering with background data refresh, reducing perceived loading times and network requests.

## Overview

The admin caching system uses Pinia stores with memory-first caching and optional localStorage persistence. It enables optimistic UI rendering and background data refresh, making the admin interface feel fast and responsive.

**Key Features:**
- Memory-first caching with Pinia
- Optional localStorage persistence with TTL
- Cache-first fetching with background refresh
- Global feature flag for easy debugging
- Cache invalidation on mutations
- Optimistic updates

## Architecture

### Core Components

**1. Cache Configuration** (`apps/frontend/composables/useAdminCacheConfig.ts`)
- Global cache feature flag
- Environment variable: `NUXT_PUBLIC_ADMIN_CACHE_ENABLED`
- Default: enabled (`true`)

**2. Cache Store** (`apps/frontend/stores/adminCache.ts`)
- Pinia store managing cache state
- Memory storage with localStorage fallback
- TTL-based expiration

**3. Cache Composable** (`apps/frontend/composables/useAdminCache.ts`)
- High-level API for cache operations
- Cache-first fetching with background refresh
- Automatic cache invalidation helpers

## Usage

### Basic Cache Operations

```typescript
import { useAdminCache } from '~/composables/useAdminCache'

const { getCached, setCache, invalidate, fetchWithCache } = useAdminCache()

// Get cached data
const cached = getCached<MyDataType>('admin:products:tenant-123')

// Set cache entry
setCache('admin:products:tenant-123', products, 5 * 60 * 1000) // 5 min TTL

// Invalidate cache
invalidate('admin:products:tenant-123')

// Invalidate by pattern
invalidatePattern(/^admin:products:/)
```

### Cache-First Fetching

```typescript
const { fetchWithCache } = useAdminCache()

// Fetch with cache-first strategy
const data = await fetchWithCache(
  'admin:products:tenant-123',
  async () => {
    const response = await $fetch('/admin/tenant-123/products', {
      baseURL: config.public.backendUrl,
      credentials: 'include',
    })
    return response.products
  },
  {
    ttl: 5 * 60 * 1000, // 5 minutes
    onBackgroundUpdate: (freshData) => {
      // Update UI when fresh data arrives
      products.value = freshData
    },
  }
)
```

**Behavior:**
- If cache exists and is fresh: returns cached data immediately, refreshes in background
- If cache exists but is stale: returns stale data immediately, fetches fresh in background
- If no cache: fetches and waits for response

### Cache Keys

Use predictable, hierarchical cache keys:

```typescript
// Pattern: admin:{resource}:{tenantId}:{id?}
'admin:products:tenant-123'
'admin:product:tenant-123:product-456'
'admin:account:tenant-123'
'admin:store-settings:tenant-123'
'admin:tenant-name:tenant-123'
```

### Cache Configuration

**Enable/Disable Caching:**

Set in `.env`:
```bash
# Disable caching
NUXT_PUBLIC_ADMIN_CACHE_ENABLED=false

# Enable caching (default)
NUXT_PUBLIC_ADMIN_CACHE_ENABLED=true
```

**Runtime Config:**

Also available via `useRuntimeConfig()`:
```typescript
const config = useRuntimeConfig()
const cacheEnabled = config.public.adminCacheEnabled
```

**When Disabled:**
- `getCached()` always returns `null`
- `isFresh()` always returns `false`
- `setCache()` becomes a no-op
- `fetchWithCache()` always fetches fresh data
- UI behavior identical (just slower, no caching)

## Implementation Patterns

### Page Component Pattern

```typescript
<script setup lang="ts">
const route = useRoute()
const { fetchWithCache, invalidate } = useAdminCache()

const loading = ref(false) // Start as false - only show if no cache
const data = ref<DataType[]>([])

async function fetchData() {
  const tenantId = route.params.tenant as string
  const cacheKey = `admin:resource:${tenantId}`
  const ttl = 5 * 60 * 1000 // 5 minutes

  // Check cache first
  const cached = useAdminCache().getCached<DataType[]>(cacheKey)
  if (cached) {
    // Show cached data immediately
    data.value = cached
    loading.value = false
  } else {
    loading.value = true
  }

  try {
    const freshData = await fetchWithCache(
      cacheKey,
      async () => {
        const response = await $fetch(`/admin/${tenantId}/resource`, {
          baseURL: config.public.backendUrl,
          credentials: 'include',
        })
        return response.data
      },
      {
        ttl,
        onBackgroundUpdate: (freshData) => {
          // Update UI when fresh data arrives
          data.value = freshData
        },
      }
    )
    data.value = freshData
  } catch (err) {
    // Handle error
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
```

### Optimistic Updates

```typescript
async function updateItem(item: Item, newValue: string) {
  // Optimistic update - update UI immediately
  const index = items.value.findIndex(i => i.id === item.id)
  if (index !== -1) {
    items.value[index] = { ...items.value[index], value: newValue }
  }

  // Update cache optimistically
  const cacheKey = `admin:items:${tenantId}`
  const cached = useAdminCache().getCached<Item[]>(cacheKey)
  if (cached) {
    const updated = cached.map(i => 
      i.id === item.id ? { ...i, value: newValue } : i
    )
    useAdminCache().setCache(cacheKey, updated)
  }

  // Sync in background
  try {
    await $fetch(`/admin/${tenantId}/items/${item.id}`, {
      method: 'PUT',
      body: { value: newValue },
    })
    // Invalidate and refresh
    invalidate(cacheKey)
    await fetchData()
  } catch (err) {
    // Revert optimistic update on error
    if (index !== -1) {
      items.value[index] = item
    }
  }
}
```

### Cache Invalidation on Mutations

```typescript
async function createItem(itemData: ItemData) {
  await $fetch(`/admin/${tenantId}/items`, {
    method: 'POST',
    body: itemData,
  })
  
  // Invalidate cache
  invalidate(`admin:items:${tenantId}`)
  
  // Refresh data
  await fetchData()
}

async function deleteItem(itemId: string) {
  await $fetch(`/admin/${tenantId}/items/${itemId}`, {
    method: 'DELETE',
  })
  
  // Invalidate cache
  invalidate(`admin:items:${tenantId}`)
  
  // Refresh data
  await fetchData()
}
```

## Cache Store API

### Getters

**`get<T>(key: string): T | null`**
- Returns cached data or `null` if not found/expired
- Checks memory first, then localStorage
- Returns `null` if cache is disabled

**`isFresh(key: string, ttl?: number): boolean`**
- Checks if cache entry exists and is within TTL
- Returns `false` if cache is disabled

### Actions

**`set<T>(key: string, data: T, ttl?: number): void`**
- Stores data in cache with optional TTL
- Persists to localStorage (unless key contains 'sensitive')
- No-op if cache is disabled

**`clear(key: string): void`**
- Removes specific cache entry
- Clears from memory and localStorage

**`clearAll(): void`**
- Clears all cache entries

**`clearPattern(pattern: string | RegExp): void`**
- Clears cache entries matching pattern
- Useful for bulk invalidation

**`initFromStorage(): void`**
- Loads cache from localStorage on store initialization
- No-op if cache is disabled

## TTL Strategy

**Default TTL:** 5 minutes

**Recommended TTLs:**
- Frequently changing data: 1 minute
- Standard data: 5 minutes (default)
- Relatively static data: 30 minutes (e.g., tenant info)

```typescript
// Short TTL for frequently changing data
setCache('admin:products:tenant-123', data, 1 * 60 * 1000) // 1 min

// Standard TTL
setCache('admin:products:tenant-123', data, 5 * 60 * 1000) // 5 min

// Long TTL for static data
setCache('admin:tenant-name:tenant-123', name, 30 * 60 * 1000) // 30 min
```

## Best Practices

### 1. Always Use Cache Keys with Tenant ID

```typescript
// Good
const cacheKey = `admin:products:${tenantId}`

// Bad - missing tenant context
const cacheKey = 'admin:products'
```

### 2. Invalidate Cache on Mutations

```typescript
// After create/update/delete
invalidate(`admin:products:${tenantId}`)
```

### 3. Use Optimistic Updates for Better UX

```typescript
// Update UI immediately, sync in background
items.value[index] = updatedItem
// ... then sync with API
```

### 4. Show Cached Data Immediately

```typescript
// Check cache before showing loading state
const cached = getCached(key)
if (cached) {
  data.value = cached
  loading.value = false
} else {
  loading.value = true
}
```

### 5. Handle Background Updates

```typescript
fetchWithCache(key, fetcher, {
  onBackgroundUpdate: (freshData) => {
    // Silently update UI when fresh data arrives
    data.value = freshData
  },
})
```

## Debugging

### Disable Caching

Set in `.env`:
```bash
NUXT_PUBLIC_ADMIN_CACHE_ENABLED=false
```

This allows you to:
- Verify data freshness
- Debug cache-related issues
- Test without caching

### Inspect Cache State

```typescript
import { useAdminCacheStore } from '~/stores/adminCache'

const store = useAdminCacheStore()
console.log(store.cache) // View all cached entries
```

### Clear Cache Programmatically

```typescript
const { invalidate, invalidatePattern } = useAdminCache()

// Clear specific entry
invalidate('admin:products:tenant-123')

// Clear all products for a tenant
invalidatePattern(/^admin:products:tenant-123/)

// Clear all admin cache
const store = useAdminCacheStore()
store.clearAll()
```

## File Locations

- **Cache Config:** `apps/frontend/composables/useAdminCacheConfig.ts`
- **Cache Store:** `apps/frontend/stores/adminCache.ts`
- **Cache Composable:** `apps/frontend/composables/useAdminCache.ts`
- **Navigation Helper:** `apps/frontend/composables/useAdminNavigation.ts`

## Important Notes

- **Admin-only:** Caching applies only to admin backend UI
- **Customer-facing UI:** Out of scope, no caching
- **Memory-first:** Cache stored in Pinia state, persisted to localStorage
- **TTL-based expiration:** Entries expire based on `fetchedAt` timestamp
- **Safe to disable:** All functionality works without caching
- **No breaking changes:** Disabling cache doesn't require code changes

## Example: Products List Page

```typescript
<script setup lang="ts">
const route = useRoute()
const { fetchWithCache, invalidate } = useAdminCache()

const loading = ref(false)
const products = ref<any[]>([])

async function fetchProducts() {
  const tenantId = route.params.tenant as string
  const cacheKey = `admin:products:${tenantId}`
  const ttl = 5 * 60 * 1000

  // Check cache first
  const cached = useAdminCache().getCached<{ products: any[] }>(cacheKey)
  if (cached) {
    products.value = cached.products
    loading.value = false
  } else {
    loading.value = true
  }

  try {
    const data = await fetchWithCache(
      cacheKey,
      async () => {
        const response = await $fetch(`/admin/${tenantId}/products`, {
          baseURL: config.public.backendUrl,
          credentials: 'include',
        })
        return { products: response.products || [] }
      },
      {
        ttl,
        onBackgroundUpdate: (freshData) => {
          products.value = freshData.products
        },
      }
    )
    products.value = data.products
  } catch (err) {
    // Handle error
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProducts()
})
</script>
```

