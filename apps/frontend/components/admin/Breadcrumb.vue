<template>
  <nav class="flex items-center space-x-2 text-sm text-admin-text-secondary mb-4">
    <NuxtLink
      v-if="tenantId"
      :to="`/admin/${tenantId}`"
      class="hover:text-admin-text-primary transition-colors"
    >
      Dashboard
    </NuxtLink>
    <template v-for="(item, index) in breadcrumbs" :key="index">
      <span class="text-admin-text-muted">/</span>
      <NuxtLink
        v-if="item.to"
        :to="item.to"
        class="hover:text-admin-text-primary transition-colors"
      >
        {{ item.label }}
      </NuxtLink>
      <span v-else class="text-admin-text-primary">{{ item.label }}</span>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { useAdminCacheStore } from '~/stores/adminCache'

interface BreadcrumbItem {
  label: string
  to?: string
}

const route = useRoute()
const tenantId = computed(() => route.params.tenant as string | undefined)
const cacheStore = useAdminCacheStore()
const { getRouteState } = useAdminNavigation()

/**
 * Get product name for product edit pages
 * Checks cache and route state, returns null if not available
 * Accesses store state directly for reactivity
 */
function getProductName(): string | null {
  if (!tenantId.value) return null
  
  const path = route.path
  // Check if we're on a product edit page: /admin/[tenant]/products/edit/[id]
  const isProductEditPage = path.match(/^\/admin\/[^/]+\/products\/edit\/[^/]+$/)
  
  if (!isProductEditPage) return null
  
  const productId = route.params.id as string
  
  // Try to get from route state first (most immediate, but not reactive)
  const routeState = getRouteState<{ productName?: string }>()
  if (routeState?.productName) {
    return routeState.productName
  }
  
  // Try to get from products list cache (reactive via store state access)
  const productsCacheKey = `admin:products:${tenantId.value}`
  // Access cache state directly for reactivity
  const cachedProductsEntry = cacheStore.cache[productsCacheKey]
  if (cachedProductsEntry) {
    const cachedProducts = cachedProductsEntry.data as { products: any[] } | undefined
    if (cachedProducts?.products) {
      const cachedProduct = cachedProducts.products.find(p => p.id === productId)
      if (cachedProduct?.mtProductName) {
        return cachedProduct.mtProductName
      }
    }
  }
  
  // Try to get from individual product cache (reactive via store state access)
  const productCacheKey = `admin:product:${tenantId.value}:${productId}`
  const cachedProductEntry = cacheStore.cache[productCacheKey]
  if (cachedProductEntry) {
    const cachedProduct = cachedProductEntry.data as { product: any } | undefined
    if (cachedProduct?.product?.mtProductName) {
      return cachedProduct.product.mtProductName
    }
  }
  
  // Also check localStorage (fallback, but not reactive)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`admin-cache:${productsCacheKey}`)
      if (stored) {
        const entry = JSON.parse(stored)
        const ttl = entry.ttl || 5 * 60 * 1000
        if (Date.now() - entry.fetchedAt < ttl) {
          const cachedProducts = entry.data as { products: any[] } | undefined
          if (cachedProducts?.products) {
            const cachedProduct = cachedProducts.products.find(p => p.id === productId)
            if (cachedProduct?.mtProductName) {
              return cachedProduct.mtProductName
            }
          }
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  return null
}

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  if (!tenantId.value) return []

  const path = route.path
  const segments = path.split('/').filter(Boolean)
  
  // Remove 'admin' and tenant ID from segments
  const relevantSegments = segments.slice(2)
  
  if (relevantSegments.length === 0) return []

  const items: BreadcrumbItem[] = []
  
  // Map route segments to readable labels
  const labelMap: Record<string, string> = {
    'store-settings': 'Store Settings',
    'products': 'Products',
    'account': 'Account',
    'add': 'Add',
    'edit': 'Edit',
  }

  // Special handling for product edit pages
  const isProductEditPage = path.match(/^\/admin\/[^/]+\/products\/edit\/[^/]+$/)
  const productName = isProductEditPage ? getProductName() : null

  // Build breadcrumb items
  let currentPath = `/admin/${tenantId.value}`
  
  for (let i = 0; i < relevantSegments.length; i++) {
    const segment = relevantSegments[i]
    
    // Skip "edit" segment for product edit pages
    if (isProductEditPage && segment === 'edit') {
      // Still update path for next segments
      currentPath += `/${segment}`
      continue
    }
    
    // For product edit pages, replace the product ID (last segment) with product name
    if (isProductEditPage && i === relevantSegments.length - 1) {
      // This is the product ID segment - replace with product name
      if (productName) {
        items.push({ label: productName })
      } else {
        // Show placeholder while loading
        items.push({ label: 'Loading...' })
      }
      break
    }
    
    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    
    // Don't create link for last item (current page)
    if (i === relevantSegments.length - 1) {
      items.push({ label })
    } else {
      currentPath += `/${segment}`
      items.push({ label, to: currentPath })
    }
  }

  return items
})
</script>

