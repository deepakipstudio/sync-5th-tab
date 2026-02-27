<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Banner Slider -->
    <div v-if="!bannersLoading && banners.length > 0">
      <ShopBannerSlider
        :banners="[...banners]"
        :tenant-id="tenantId"
        :auto-play="true"
        :auto-play-interval="5000"
        :store-name="storeName"
        :location-name="locationName"
      />
    </div>


    <!-- Categories Section -->
    <div class="px-4 py-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>

      <div v-if="categoriesLoading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="i in 8" :key="i" class="bg-white rounded-lg aspect-square animate-pulse"></div>
      </div>

      <div v-else-if="categoriesError" class="text-center py-8">
        <p class="text-red-600">{{ categoriesError }}</p>
      </div>

      <div v-else-if="categories.length === 0" class="text-center py-8">
        <p class="text-gray-600">No categories available</p>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <ShopCategoryCard
          v-for="category in categories"
          :key="category.id"
          :category="category"
          :tenant-id="tenantId"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'shop' })

const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenant as string)

const { locationId, locationName } = useShopLocation(tenantId.value)
const { banners, loading: bannersLoading } = useShopBanners(tenantId.value)
const { storeName } = useTenantBranding(tenantId)
const { categories, loading: categoriesLoading, error: categoriesError, fetchCategories } = useShopCategories(tenantId.value)

// Check for location on mount
onMounted(() => {
  if (!locationId.value) {
    router.push(`/shop/${tenantId.value}/location`)
    return
  }

  fetchCategories()
})
</script>
