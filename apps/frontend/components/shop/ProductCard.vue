<template>
  <NuxtLink
    :to="`/shop/${tenantId}/products/${product.id}`"
    class="block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
  >
    <div class="aspect-square bg-gray-100 overflow-hidden">
      <img
        v-if="featuredImage"
        :src="featuredImage"
        :alt="productName"
        class="w-full h-full object-cover"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center"
        :style="{ backgroundColor: 'var(--tenant-primary)', opacity: 0.1 }"
      >
        <svg class="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
    <div class="p-4">
      <h3 class="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">{{ displayName }}</h3>
      <p v-if="priceRange" class="text-lg font-bold" :style="{ color: 'var(--tenant-primary)' }">
        {{ priceRange }}
      </p>
      <button
        class="mt-3 w-full py-2 px-4 rounded-md text-sm font-medium transition-colors"
        :style="{
          backgroundColor: 'var(--tenant-secondary)',
          color: 'var(--tenant-secondary-foreground)'
        }"
        @click.prevent="$router.push(`/shop/${tenantId}/products/${product.id}`)"
      >
        View Details
      </button>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useShopProducts'

const props = defineProps<{
  product: Product
  tenantId: string
  productName?: string
}>()

const { getFullImageUrl } = useImageUrl()

const displayName = computed(() =>
  props.productName || props.product.mtTitle || props.product.description || props.product.mtProductId || 'Product'
)

const featuredImage = computed(() => {
  const featured = props.product.images.find(img => img.isFeatured)
  const imageUrl = featured?.imageUrl || props.product.images[0]?.imageUrl || null
  return getFullImageUrl(imageUrl)
})

const priceRange = computed(() => {
  const prices = props.product.variants
    .map(v => v.mtPrice)
    .filter((p): p is number => p != null && !isNaN(p))

  if (prices.length === 0) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return `$${min.toFixed(2)}`
  return `$${min.toFixed(2)} – $${max.toFixed(2)}`
})
</script>

