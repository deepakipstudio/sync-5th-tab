<template>
  <nav class="flex items-center space-x-2 text-sm text-admin-text-secondary mb-6" aria-label="Breadcrumb">
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
      <span v-else class="text-admin-text-primary font-medium">{{ item.label }}</span>
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
 * Uses MT product ID for product edit pages, UUID for variant edit pages
 */
function getProductName(): string | null {
  if (!tenantId.value) return null
  
  const path = route.path
  // Check if we're on a product edit page (MT ID) or variant edit page (UUID)
  const isProductEditPage = path.match(/^\/admin\/[^/]+\/products\/edit\/[^/]+$/)
  const isVariantEditPage = path.match(/^\/admin\/[^/]+\/products\/variants\/edit\/[^/]+\/[^/]+$/)
  
  if (!isProductEditPage && !isVariantEditPage) return null
  
  // Try to get from route state first (most immediate, but not reactive)
  const routeState = getRouteState<{ productName?: string }>()
  if (routeState?.productName) {
    return routeState.productName
  }
  
  // For product edit pages, use MT product ID
  if (isProductEditPage) {
    const mtProductId = route.params.mtProductId as string
    
    // Try to get from products list cache
    const productsCacheKey = `admin:products:${tenantId.value}`
    const cachedProductsEntry = cacheStore.cache[productsCacheKey]
    if (cachedProductsEntry) {
      const cachedProducts = cachedProductsEntry.data as { products: any[] } | undefined
      if (cachedProducts?.products) {
        const cachedProduct = cachedProducts.products.find(p => p.mtProductId === mtProductId)
        if (cachedProduct?.mtProductName) {
          return cachedProduct.mtProductName
        }
      }
    }
    
    // Try to get from individual product cache
    const productCacheKey = `admin:product:${tenantId.value}:${mtProductId}`
    const cachedProductEntry = cacheStore.cache[productCacheKey]
    if (cachedProductEntry) {
      const cachedProduct = cachedProductEntry.data as { product: any } | undefined
      if (cachedProduct?.product?.mtProductName) {
        return cachedProduct.product.mtProductName
      }
    }
  }
  
  // For variant edit pages, use product UUID to find product
  if (isVariantEditPage) {
    const productId = route.params.productId as string
    
    // Try to get from products list cache using UUID
    const productsCacheKey = `admin:products:${tenantId.value}`
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
  }
  
  return null
}

/**
 * Get variant breadcrumb label for variant edit pages
 * Returns format: "Variant: Color Size" or "Variant" if no attributes
 */
function getVariantBreadcrumbLabel(): string | null {
  if (!tenantId.value) return null
  
  const path = route.path
  // Check if we're on a variant edit page: /admin/[tenant]/products/variants/edit/[productId]/[variantId]
  const isVariantEditPage = path.match(/^\/admin\/[^/]+\/products\/variants\/edit\/[^/]+\/[^/]+$/)
  
  if (!isVariantEditPage) return null
  
  const productId = route.params.productId as string
  const variantId = route.params.variantId as string
  
  // Try to get variant data from products list cache
  const productsCacheKey = `admin:products:${tenantId.value}`
  const cachedProductsEntry = cacheStore.cache[productsCacheKey]
  
  let variantAttributes: string = ''
  
  if (cachedProductsEntry) {
    const cachedProducts = cachedProductsEntry.data as { products: any[] } | undefined
    if (cachedProducts?.products) {
      const cachedProduct = cachedProducts.products.find(p => p.id === productId)
      if (cachedProduct?.variants) {
        const cachedVariant = cachedProduct.variants.find((v: any) => v.id === variantId)
        if (cachedVariant) {
          // Get variant attributes from mtData if available
          // variant_attributes is an array like: [{name: "Color", value: null}, {name: "Size", value: "7"}]
          // Filter out null/empty values and join with space
          const attributes = cachedVariant.mtData?.attributes?.variant_attributes || []
          const attrValues = attributes
            .map((attr: any) => attr.value)
            .filter((value: any) => value !== null && value !== undefined && value !== '')
          variantAttributes = attrValues.length > 0 ? attrValues.join(' ') : ''
        }
      }
    }
  }
  
  // Format: "Variant: Color Size" or just "Variant" if no attributes
  return variantAttributes ? `Variant: ${variantAttributes}` : 'Variant'
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

  // Special handling for product edit pages and variant edit pages
  const isProductEditPage = path.match(/^\/admin\/[^/]+\/products\/edit\/[^/]+$/)
  const isVariantEditPage = path.match(/^\/admin\/[^/]+\/products\/variants\/edit\/[^/]+\/[^/]+$/)
  const productName = (isProductEditPage || isVariantEditPage) ? getProductName() : null
  const variantBreadcrumbLabel = isVariantEditPage ? getVariantBreadcrumbLabel() : null

  // Build breadcrumb items
  let currentPath = `/admin/${tenantId.value}`
  
  for (let i = 0; i < relevantSegments.length; i++) {
    const segment = relevantSegments[i]
    
    // Skip "edit" and "variants" segments for variant edit pages
    if (isVariantEditPage && (segment === 'edit' || segment === 'variants')) {
      currentPath += `/${segment}`
      continue
    }
    // Skip "edit" segment for product edit pages
    if (isProductEditPage && segment === 'edit') {
      currentPath += `/${segment}`
      continue
    }
    
    // For variant edit pages, handle product name and variant attributes
    if (isVariantEditPage && i === relevantSegments.length - 2) {
      // This is the product ID segment (UUID) - replace with product name
      // Need to get MT product ID for the link
      const productId = segment
      const productsCacheKey = `admin:products:${tenantId.value}`
      const cachedProductsEntry = cacheStore.cache[productsCacheKey]
      let mtProductIdForLink: string | null = null
      if (cachedProductsEntry) {
        const cachedProducts = cachedProductsEntry.data as { products: any[] } | undefined
        if (cachedProducts?.products) {
          const cachedProduct = cachedProducts.products.find(p => p.id === productId)
          mtProductIdForLink = cachedProduct?.mtProductId || null
        }
      }
      
      if (productName) {
        const linkTo = mtProductIdForLink ? `/admin/${tenantId.value}/products/edit/${mtProductIdForLink}` : undefined
        items.push({ label: productName, to: linkTo })
      } else {
        const linkTo = mtProductIdForLink ? `/admin/${tenantId.value}/products/edit/${mtProductIdForLink}` : undefined
        items.push({ label: 'Loading...', to: linkTo })
      }
      continue
    }
    
    // For variant edit pages, replace the variant ID (last segment) with formatted label
    if (isVariantEditPage && i === relevantSegments.length - 1) {
      // This is the variant ID segment - replace with formatted label
      if (variantBreadcrumbLabel) {
        items.push({ label: variantBreadcrumbLabel })
      } else {
        // Show placeholder while loading
        items.push({ label: 'Loading...' })
      }
      break
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
    
    const label = segment ? (labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)) : ''
    
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

