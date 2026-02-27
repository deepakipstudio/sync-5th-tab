<template>
  <NuxtLink
    :to="`/shop/${tenantId}/categories/${category.slug}`"
    class="block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-[var(--tenant-primary)]"
  >
    <div class="aspect-square bg-gray-100 overflow-hidden">
      <img
        v-if="category.imageUrl"
        :src="getFullImageUrl(category.imageUrl)"
        :alt="category.name"
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
      <h3 class="font-semibold text-lg mb-1" :style="{ color: 'var(--tenant-primary)' }">
        {{ category.name }}
      </h3>
      <p class="text-sm text-gray-600">
        {{ category.productCount }} {{ category.productCount === 1 ? 'product' : 'products' }}
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Category } from '~/composables/useShopCategories'

const props = defineProps<{
  category: Category
  tenantId: string
}>()

const { getFullImageUrl } = useImageUrl()
</script>

