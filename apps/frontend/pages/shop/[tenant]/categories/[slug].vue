<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Breadcrumb -->
    <div class="px-4 py-4 bg-white border-b">
      <nav class="flex items-center space-x-2 text-sm">
        <NuxtLink
          :to="`/shop/${tenantId}`"
          class="text-gray-600 hover:text-[var(--tenant-primary)]"
        >
          Home
        </NuxtLink>
        <span class="text-gray-400">/</span>
        <span class="text-gray-900 font-medium">{{ categoryName }}</span>
      </nav>
    </div>

    <!-- Category Header -->
    <div v-if="category" class="px-4 py-8">
      <h1
        class="text-3xl font-bold mb-2"
        :style="{ color: 'var(--tenant-primary)' }"
      >
        {{ category.name }}
      </h1>
      <p v-if="category.description" class="text-gray-600">{{ category.description }}</p>
    </div>

    <!-- Products Grid -->
    <div class="px-4 pb-8">
      <div v-if="productsLoading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="i in 8" :key="i" class="bg-white rounded-lg aspect-square animate-pulse"></div>
      </div>

      <div v-else-if="productsError" class="text-center py-8">
        <p class="text-red-600">{{ productsError }}</p>
      </div>

      <div v-else-if="products.length === 0" class="text-center py-8">
        <p class="text-gray-600">No products in this category</p>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <ShopProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          :tenant-id="tenantId"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'shop' })

const route = useRoute()
const config = useRuntimeConfig()
const tenantId = computed(() => route.params.tenant as string)
const slug = computed(() => route.params.slug as string)

const category = ref<{ id: string; name: string; description: string | null; slug: string } | null>(null)
const categoryName = computed(() => category.value?.name || 'Category')
const products = ref<any[]>([])
const productsLoading = ref(false)
const productsError = ref<string | null>(null)

async function fetchCategory() {
  productsLoading.value = true
  productsError.value = null

  try {
    const data = await $fetch<{
      category: { id: string; name: string; description: string | null; slug: string }
      products: any[]
    }>(
      `/shop/${tenantId.value}/categories/${slug.value}`,
      {
        baseURL: config.public.backendUrl,
        credentials: 'include',
      }
    )
    category.value = data.category
    products.value = data.products || []
  } catch (e: any) {
    productsError.value = e.data?.error || e.message || 'Failed to fetch category'
    products.value = []
  } finally {
    productsLoading.value = false
  }
}

onMounted(() => {
  fetchCategory()
})
</script>

