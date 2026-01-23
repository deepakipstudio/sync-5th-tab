<template>
  <div class="border-b border-admin-border last:border-b-0">
    <!-- Product Row -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-admin-surface-hover transition-colors">
      <!-- Product Image -->
      <div 
        class="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-admin-surface-raised rounded-lg overflow-hidden cursor-pointer" 
        @click="toggleExpanded"
        :title="`Click to ${expanded ? 'collapse' : 'expand'} variants`"
        aria-label="Product image, click to toggle variants"
      >
        <img
          v-if="productImage"
          :src="productImage"
          :alt="`${productName} product image`"
          class="w-full h-full object-cover"
          @error="handleImageError"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <svg class="w-6 h-6 sm:w-8 sm:h-8 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      </div>

      <!-- Product Info -->
      <div class="flex-1 min-w-0 w-full sm:w-auto cursor-pointer" @click="toggleExpanded">
        <h3 class="font-medium text-admin-text-primary mb-1 truncate" :title="productName">
          {{ productName }}
        </h3>
        <p 
          v-if="productDescription" 
          class="text-sm text-admin-text-secondary line-clamp-1 sm:line-clamp-2 mb-2"
          :title="productDescription"
        >
          {{ productDescription }}
        </p>
        <div class="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-admin-text-secondary">
          <span 
            v-if="categoryName" 
            class="inline-flex items-center gap-1"
            :title="`Category: ${categoryName}`"
            aria-label="Product category"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>{{ categoryName }}</span>
          </span>
          <span 
            class="inline-flex items-center gap-1"
            :title="`Price range: ${priceRange}`"
            aria-label="Product price range"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ priceRange }}</span>
          </span>
          <span 
            class="inline-flex items-center gap-1"
            :title="`Stock: ${stockDisplay}`"
            aria-label="Product stock availability"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>{{ stockDisplay }}</span>
          </span>
        </div>
      </div>

      <!-- Status Badge and Actions -->
      <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
        <UiBadge 
          :variant="product.visible ? 'success' : 'default'"
          :title="`Product is ${product.visible ? 'visible' : 'hidden'} on storefront`"
          :aria-label="`Product status: ${product.visible ? 'Active' : 'Draft'}`"
        >
          {{ product.visible ? 'Active' : 'Draft' }}
        </UiBadge>
        
        <!-- Edit Button -->
        <UiButton
          variant="ghost"
          size="sm"
          @click.stop="handleEdit"
          class="text-xs sm:text-sm"
          :title="`Edit ${productName}`"
          aria-label="Edit product"
        >
          <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span class="hidden sm:inline ml-1">Edit</span>
        </UiButton>
        
        <!-- Expand/Collapse Icon -->
        <button
          class="cursor-pointer p-1 rounded hover:bg-admin-surface-raised transition-colors"
          @click.stop="toggleExpanded"
          :title="`${expanded ? 'Collapse' : 'Expand'} variants`"
          :aria-label="`${expanded ? 'Collapse' : 'Expand'} product variants`"
          :aria-expanded="expanded"
        >
          <svg
            class="w-5 h-5 text-admin-text-secondary transition-transform"
            :class="{ 'rotate-180': expanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <!-- Three-dot Menu -->
        <div class="relative z-10" @click.stop>
          <UiDropdownMenu
            :open="menuOpen"
            @update:open="(value) => { menuOpen = value }"
          >
            <template #trigger>
              <UiButton
                variant="ghost"
                size="icon"
                class="p-1.5 bg-admin-surface-base/90 backdrop-blur-sm rounded-full hover:bg-admin-surface-base shadow-sm"
                @click.stop
                :title="`More options for ${productName}`"
                aria-label="Product options menu"
              >
                <svg class="w-5 h-5 text-admin-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </UiButton>
            </template>
            <UiDropdownMenuItem @click.stop="handleEditOnMT" :title="`Edit ${productName} on Marianatek`">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit on Mariana Tek
            </UiDropdownMenuItem>
            <UiDropdownMenuItem @click.stop="handleViewOnStore" :title="`View ${productName} on storefront`">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View on store
            </UiDropdownMenuItem>
            <UiDropdownMenuItem @click.stop="handleToggleVisibility" :title="`${product.visible ? 'Hide' : 'Show'} ${productName} on storefront`">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              {{ product.visible ? 'Disable' : 'Enable' }}
            </UiDropdownMenuItem>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem @click.stop="handleDelete" class="text-admin-state-danger-text hover:bg-admin-state-danger-soft" :title="`Delete ${productName} from Sync`">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete from Sync
            </UiDropdownMenuItem>
          </UiDropdownMenu>
        </div>
      </div>
    </div>

    <!-- Variants Section (Expanded) -->
    <div v-if="expanded" class="bg-admin-surface-raised border-t border-admin-border">
      <!-- Indented container for hierarchy -->
      <div class="ml-4 sm:ml-6 mr-4 sm:mr-6 pl-4 sm:pl-6 pr-4 sm:pr-6 py-4 sm:py-5">
        <div v-if="loadingVariants" class="text-center text-admin-text-secondary">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-admin-brand-strong mx-auto"></div>
          <p class="mt-2 text-sm">Loading variants...</p>
        </div>
        <div v-else-if="variants.length === 0" class="text-center text-admin-text-secondary text-sm">
          No variants found
        </div>
        <div v-else class="overflow-x-auto rounded-lg border border-admin-border-subtle bg-admin-surface-base">
          <table class="w-full" role="table" aria-label="Product variants">
            <thead class="bg-admin-surface-raised border-b border-admin-border-subtle">
              <tr>
                <th class="px-3 sm:px-4 py-2.5 text-left text-xs font-medium text-admin-text-secondary" :title="`Stock Keeping Unit identifier`" aria-label="SKU column">SKU</th>
                <th class="px-3 sm:px-4 py-2.5 text-right text-xs font-medium text-admin-text-secondary" :title="`Variant price`" aria-label="Price column">Price</th>
                <th class="px-3 sm:px-4 py-2.5 text-right text-xs font-medium text-admin-text-secondary" :title="`Available stock quantity`" aria-label="Stock column">Stock</th>
                <th class="px-3 sm:px-4 py-2.5 text-right text-xs font-medium text-admin-text-secondary" :title="`Edit variant details`" aria-label="Actions column">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="variant in variants"
                :key="variant.id"
                class="border-b border-admin-border-subtle last:border-b-0 hover:bg-admin-surface-hover transition-colors"
              >
                <td 
                  class="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-admin-text-primary"
                  :title="`Variant SKU: ${variant.sku || 'Not set'}`"
                  aria-label="Variant SKU"
                >
                  {{ variant.sku || 'N/A' }}
                </td>
                <td 
                  class="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-admin-text-primary text-right"
                  :title="`Variant price: ${getVariantPrice(variant)}`"
                  aria-label="Variant price"
                >
                  {{ getVariantPrice(variant) }}
                </td>
                <td 
                  class="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-admin-text-primary text-right"
                  :title="`Available stock: ${getVariantStock(variant)}`"
                  aria-label="Variant stock quantity"
                >
                  {{ getVariantStock(variant) }}
                </td>
                <td class="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                  <UiButton
                    variant="ghost"
                    size="sm"
                    @click.stop="handleEditVariant(variant)"
                    class="text-xs"
                    :title="`Edit variant ${variant.sku || variant.id}`"
                    aria-label="Edit variant"
                  >
                    <svg class="w-4 h-4 inline sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span class="hidden sm:inline">Edit</span>
                  </UiButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRuntimeConfig } from '#app'
import { useAdminCache } from '~/composables/useAdminCache'

interface Props {
  product: any
  expanded?: boolean
  selectedLocationId?: string | null
  mtSubdomain?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
  selectedLocationId: null,
  mtSubdomain: null,
})

const emit = defineEmits<{
  'update:expanded': [value: boolean]
  'edit': [product: any]
  'delete': [product: any]
  'edit-on-mt': [product: any]
  'view-on-store': [product: any]
  'toggle-visibility': [product: any]
  'close-menu': []
}>()

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const backendUrl = config.public.backendUrl
const { fetchWithCache } = useAdminCache()

const expanded = ref(props.expanded)
const variants = ref<any[]>([])
const loadingVariants = ref(false)
const imageError = ref(false)
const menuOpen = ref(false)

// Computed properties
const productName = computed(() => props.product.mtProductName || `Product #${props.product.mtProductId}`)
const productDescription = computed(() => props.product.description || null)
const categoryName = computed(() => {
  if (!props.product.categories || props.product.categories.length === 0) return null
  return props.product.categories[0].name
})

const productImage = computed(() => {
  if (imageError.value) return null
  const featured = props.product.images?.find((img: any) => img.isFeatured)
  const first = props.product.images?.[0]
  const image = featured || first
  if (!image) return null
  const url = image.imageUrl
  if (url?.startsWith('http')) return url
  return `${backendUrl}${url}`
})

const priceRange = computed(() => {
  if (variants.value.length === 0) {
    // If variants not loaded yet, check if product has variants
    if (props.product.variants && props.product.variants.length > 0) {
      // If expanded but still loading, show loading
      if (expanded.value && loadingVariants.value) {
        return 'Loading...'
      }
      // If not expanded, show placeholder
      return 'Click to view'
    }
    return 'N/A'
  }
  const range = getPriceRange(variants.value)
  return range
})

const stockDisplay = computed(() => {
  if (variants.value.length === 0) {
    // If variants not loaded yet, check if product has variants
    if (props.product.variants && props.product.variants.length > 0) {
      // If expanded but still loading, show loading
      if (expanded.value && loadingVariants.value) {
        return 'Loading...'
      }
      // If not expanded, show placeholder
      return 'Click to view'
    }
    return 'N/A'
  }
  const total = getTotalStock(variants.value)
  if (total === null) return 'N/A'
  return total > 0 ? `${total} in stock` : 'Out of stock'
})

// Watch for expanded prop changes
watch(() => props.expanded, (newVal) => {
  expanded.value = newVal
})

// Watch for expansion to load variants
watch(expanded, async (newVal) => {
  emit('update:expanded', newVal)
  if (newVal && variants.value.length === 0) {
    await loadVariants()
  }
})

// Functions
function toggleExpanded() {
  expanded.value = !expanded.value
}

function handleImageError() {
  imageError.value = true
}

function getPriceRange(variants: any[]): string {
  if (!variants || variants.length === 0) return 'N/A'
  const prices = variants
    .map(v => getVariantPriceValue(v))
    .filter(p => p != null)
  if (prices.length === 0) return 'N/A'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`
}

function getTotalStock(variants: any[]): number | null {
  if (!variants || variants.length === 0) return null
  const stocks = variants
    .map(v => getVariantStockValue(v))
    .filter(s => s != null)
  if (stocks.length === 0) return null
  return stocks.reduce((sum, stock) => sum + stock, 0)
}

function getVariantPriceValue(variant: any): number | null {
  if (!variant.mtData?.attributes) return null
  const price = variant.mtData.attributes.price
  if (price == null) return null
  return parseFloat(price)
}

function getVariantPrice(variant: any): string {
  const price = getVariantPriceValue(variant)
  if (price === null) return 'N/A'
  return `$${price.toFixed(2)}`
}

function getVariantStockValue(variant: any): number | null {
  if (!variant.mtData?.attributes) return null
  const stock = variant.mtData.attributes.present_quantity
  if (stock == null) return null
  return parseInt(stock)
}

function getVariantStock(variant: any): string {
  const stock = getVariantStockValue(variant)
  if (stock === null) return 'N/A'
  return String(stock)
}

async function loadVariants() {
  if (!props.product.mtProductId) return
  
  loadingVariants.value = true
  const tenantId = route.params.tenant as string
  const cacheKey = `admin:product-variants:${tenantId}:${props.product.mtProductId}`
  const ttl = 1 * 60 * 1000 // 1 minute

  try {
    const queryParams: any = {}
    if (props.selectedLocationId) {
      queryParams.inventory_location = props.selectedLocationId
    }

    const data = await fetchWithCache(
      cacheKey,
      async () => {
        const response = await $fetch<{ variants: any[] }>(
          `${backendUrl}/admin/${tenantId}/products/mt/${props.product.mtProductId}/variants`,
          {
            credentials: 'include',
            query: queryParams,
          }
        )
        return { variants: response.variants || [] }
      },
      { ttl }
    )

    variants.value = data.variants || []
  } catch (err: any) {
    console.error('Error loading variants:', err)
    variants.value = []
  } finally {
    loadingVariants.value = false
  }
}

function handleEditVariant(variant: any) {
  const tenantId = route.params.tenant as string
  router.push(`/admin/${tenantId}/products/variants/edit/${props.product.id}/${variant.id}`)
}

function handleEditOnMT() {
  menuOpen.value = false
  emit('edit-on-mt', props.product)
}

function handleViewOnStore() {
  menuOpen.value = false
  emit('view-on-store', props.product)
}

function handleToggleVisibility() {
  menuOpen.value = false
  emit('toggle-visibility', props.product)
}

function handleDelete() {
  menuOpen.value = false
  emit('delete', props.product)
}

function handleEdit() {
  emit('edit', props.product)
}
</script>

