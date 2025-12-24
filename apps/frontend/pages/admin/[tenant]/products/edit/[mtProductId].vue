<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UiButton
        @click="navigateTo(`/admin/${route.params.tenant}/products`)"
        variant="ghost"
        size="icon"
        class="text-admin-text-secondary hover:text-admin-text-primary"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </UiButton>
      <div>
        <h1 class="text-3xl font-semibold text-admin-text-primary">
          <span v-if="mtProductName">Editing {{ mtProductName }}</span>
          <span v-else-if="product?.mtProductId">Editing Product #{{ product.mtProductId }}</span>
          <span v-else>Edit Product</span>
        </h1>
        <p class="text-sm text-admin-text-secondary mt-2">ID: {{ product?.mtProductId || 'N/A' }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <!-- Product Images Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <UiSkeleton class="h-6 w-40 mb-4" />
        <UiSkeleton class="h-32 w-full mb-4" />
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <UiSkeleton
            v-for="i in 4"
            :key="i"
            class="aspect-square rounded-lg"
          />
        </div>
      </div>
      
      <!-- Product Name Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <UiSkeleton class="h-6 w-40 mb-4" />
        <div class="space-y-4">
          <div>
            <UiSkeleton class="h-4 w-32 mb-2" />
            <UiSkeleton class="h-10 w-full" />
            <UiSkeleton class="h-3 w-24 mt-1" />
          </div>
        </div>
      </div>
      
      <!-- Product Description Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <UiSkeleton class="h-6 w-40 mb-4" />
        <UiSkeleton class="h-24 w-full" />
      </div>
      
      <!-- Variants Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <UiSkeleton class="h-6 w-32 mb-4" />
        <div class="space-y-4">
          <div
            v-for="i in 3"
            :key="i"
            class="bg-admin-surface-base border border-admin-border rounded-lg overflow-hidden"
          >
            <div class="p-4 border-b border-admin-border-subtle bg-admin-surface-raised">
              <UiSkeleton class="h-5 w-48 mb-1" />
              <UiSkeleton class="h-3 w-32" />
            </div>
            <div class="p-4">
              <UiSkeleton class="h-4 w-40 mb-3" />
              <div class="space-y-2">
                <UiSkeleton class="h-4 w-full" />
                <UiSkeleton class="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <UiAlert v-else-if="error" variant="error">
      {{ error }}
    </UiAlert>

    <!-- Form -->
    <form v-else @submit.prevent="saveProduct" class="space-y-6">
      <!-- Product Images -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Product Images</h2>
        
        <!-- Image Upload Area -->
        <div
          class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-admin-border border-dashed rounded-md"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="{ 'border-admin-brand-strong bg-admin-surface-hover': isDragging }"
        >
          <div class="space-y-1 text-center">
            <svg
              class="mx-auto h-12 w-12 text-admin-text-muted"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h12m-4 4v12m0 0l-4-4m4 4l4-4"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <div class="flex text-sm text-admin-text-secondary">
              <label class="relative cursor-pointer rounded-md font-medium text-admin-text-primary hover:text-admin-text-primary">
                <span>Upload images</span>
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="sr-only"
                  @change="handleFileSelect"
                />
              </label>
              <p class="pl-1">or drag and drop</p>
            </div>
            <p class="text-xs text-admin-text-secondary">PNG, JPG, GIF, WebP up to 2MB each</p>
          </div>
        </div>

        <!-- Existing Images -->
        <div v-if="existingImages.length > 0" class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            v-for="img in existingImages"
            :key="img.id"
            class="relative group"
          >
            <div class="aspect-square rounded-lg overflow-hidden border-2" :class="img.isFeatured ? 'border-admin-brand-strong' : 'border-admin-border'">
              <img
                :src="getFullImageUrl(img.imageUrl)"
                :alt="`Product image`"
                class="w-full h-full object-cover"
              />
            </div>
            <UiButton
              type="button"
              @click="markImageForDeletion(img.id)"
              variant="danger"
              size="icon"
              class="absolute top-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </UiButton>
            <UiButton
              type="button"
              @click="setFeaturedExistingImage(img.id)"
              :variant="img.isFeatured ? 'default' : 'secondary'"
              size="sm"
              class="absolute bottom-1 left-1 text-xs"
            >
              {{ img.isFeatured ? 'Featured' : 'Set Featured' }}
            </UiButton>
          </div>
        </div>

        <!-- New Image Previews -->
        <div v-if="newImages.length > 0" class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            v-for="(img, index) in newImages"
            :key="`new-${index}`"
            class="relative group"
          >
            <div class="aspect-square rounded-lg overflow-hidden border-2" :class="img.isFeatured ? 'border-admin-brand-strong' : 'border-admin-border'">
              <img
                :src="img.preview"
                :alt="`New image ${index + 1}`"
                class="w-full h-full object-cover"
              />
            </div>
            <UiButton
              type="button"
              @click="removeNewImage(index)"
              variant="danger"
              size="icon"
              class="absolute top-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </UiButton>
            <UiButton
              type="button"
              @click="setFeaturedNewImage(index)"
              :variant="img.isFeatured ? 'default' : 'secondary'"
              size="sm"
              class="absolute bottom-1 left-1 text-xs"
            >
              {{ img.isFeatured ? 'Featured' : 'Set Featured' }}
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Product Name -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Product Information</h2>
        <div class="space-y-4">
          <div>
            <UiLabel class="block mb-1">
              Product Name
            </UiLabel>
            <UiInput
              :value="mtProductName || ''"
              type="text"
              disabled
              class="w-full bg-admin-surface-raised text-admin-text-secondary cursor-not-allowed"
            />
            <p class="text-xs text-admin-text-secondary mt-1">ID: {{ product?.mtProductId || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <!-- Product Description -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Product Description</h2>
        <UiTextarea
          v-model="form.description"
          rows="4"
          placeholder="Enter product description..."
          class="w-full"
        />
      </div>

      <!-- Variants List -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Variants ({{ variants.length }})</h2>
        
        <div v-if="loadingVariants" class="text-center py-4 text-admin-text-secondary">
          Loading variants...
        </div>
        
        <div v-else class="space-y-4">
          <div
            v-for="variant in variants"
            :key="variant.id"
            class="bg-admin-surface-base border border-admin-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <!-- Variant Header -->
            <div class="p-4 border-b border-admin-border-subtle bg-admin-surface-raised">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-semibold text-admin-text-primary">{{ variant.sku || 'Untitled Variant' }}</h3>
                  <p class="text-xs text-admin-text-secondary mt-0.5">MT Variant ID: {{ variant.mtVariantId }}</p>
                </div>
                <UiButton
                  type="button"
                  @click="navigateTo(`/admin/${route.params.tenant}/products/variants/edit/${product?.id}/${variant.id}`)"
                  variant="outline"
                  size="sm"
                >
                  Edit →
                </UiButton>
              </div>
            </div>

            <!-- Pricing from MT -->
            <div v-if="variant.mtData" class="p-4">
              <div class="space-y-3">
                <!-- Base Price -->
                <div class="flex items-center justify-between py-2 border-b border-admin-border-subtle">
                  <span class="text-sm font-medium text-admin-text-primary">Base Price (All locations)</span>
                  <span class="text-lg font-semibold text-admin-text-primary">${{ variant.mtData.attributes?.price || '0.00' }}</span>
                </div>

                <!-- Location Overrides -->
                <div v-if="hasLocationOverrides(variant.mtData)" class="mt-3">
                  <button
                    type="button"
                    @click="toggleLocationDetails(variant.id)"
                    class="w-full flex items-center justify-between text-sm font-medium text-admin-text-primary hover:text-admin-text-primary py-2"
                  >
                    <span>Location-specific Pricing</span>
                    <svg
                      class="w-5 h-5 transition-transform"
                      :class="{ 'rotate-180': expandedVariants.includes(variant.id) }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div
                    v-show="expandedVariants.includes(variant.id)"
                    class="mt-2 space-y-3 pt-2 border-t border-admin-border-subtle"
                  >
                    <div
                      v-for="region in variant.mtData.attributes.region_overrides"
                      :key="region.id"
                      class="bg-admin-surface-raised rounded-lg p-3"
                    >
                      <div class="font-medium text-admin-text-primary mb-2 text-sm">{{ region.name }}</div>
                      <div class="space-y-2">
                        <div
                          v-for="location in region.location_overrides"
                          :key="location.id"
                          class="flex items-center justify-between text-sm bg-admin-surface-base rounded p-2 border border-admin-border"
                        >
                          <div class="flex-1">
                            <div class="font-medium text-admin-text-primary">{{ location.name }}</div>
                            <div class="text-xs text-admin-text-secondary mt-0.5">
                              Stock: {{ location.present_quantity ?? 'N/A' }}
                            </div>
                          </div>
                          <div class="text-right">
                            <div class="font-semibold text-admin-text-primary">${{ location.price }}</div>
                            <div
                              v-if="location.price !== variant.mtData.attributes?.price"
                              class="text-xs text-admin-state-warning-text mt-0.5"
                            >
                              Different from base
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="p-4 text-sm text-admin-text-secondary">
              Loading pricing data...
            </div>
          </div>
        </div>
      </div>

      <!-- Form Error -->
      <UiAlert v-if="formError" variant="error">
        {{ formError }}
      </UiAlert>

      <!-- Actions -->
      <div class="flex gap-3">
        <UiButton
          type="button"
          @click="navigateTo(`/admin/${route.params.tenant}/products`)"
          variant="secondary"
          class="flex-1"
        >
          Cancel
        </UiButton>
        <UiButton
          type="submit"
          :disabled="saving"
          variant="default"
          class="flex-1"
        >
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </UiButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const config = useRuntimeConfig()
const backendUrl = config.public.backendUrl
const { getRouteState } = useAdminNavigation()
const { fetchWithCache, invalidate } = useAdminCache()

const loading = ref(false) // Start as false - only show if no cache
const loadingVariants = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const formError = ref<string | null>(null)

const product = ref<any>(null)
const variants = ref<any[]>([])
const mtProductName = ref<string | null>(null)

const form = ref({
  description: '',
  visible: true,
})

const existingImages = ref<any[]>([])
const newImages = ref<Array<{ file: File; preview: string; isFeatured: boolean }>>([])
const deletedImageIds = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const featuredImageId = ref<string | null>(null)
const expandedVariants = ref<string[]>([])

// Initialize with route state or cache
const routeState = getRouteState<{
  mtProductId?: string
  productName?: string
  productDescription?: string
}>()

// Try to get product from products list cache first
const tenantId = route.params.tenant as string
const mtProductId = route.params.mtProductId as string // Changed from productId to mtProductId
const productsCacheKey = `admin:products:${tenantId}`
const cachedProducts = useAdminCache().getCached<{ products: any[]; mtSubdomain?: string }>(productsCacheKey)

if (cachedProducts?.products) {
  // Look up by MT product ID instead of database UUID
  const cachedProduct = cachedProducts.products.find(p => p.mtProductId === mtProductId)
  if (cachedProduct) {
    // Use cached product data immediately
    product.value = cachedProduct
    mtProductName.value = cachedProduct.mtProductName || null
    form.value.description = cachedProduct.description || ''
    form.value.visible = cachedProduct.visible
    existingImages.value = cachedProduct.images || []
  }
}

// Also check route state
if (routeState && !product.value) {
  product.value = {
    mtProductId: routeState.mtProductId || mtProductId,
    mtProductName: routeState.productName,
    description: routeState.productDescription,
  }
  mtProductName.value = routeState.productName || null
  form.value.description = routeState.productDescription || ''
}

// Fetch product with cache-first strategy
async function fetchProduct() {
  // Use MT product ID for cache key
  const cacheKey = `admin:product:${tenantId}:${mtProductId}`
  const ttl = 5 * 60 * 1000 // 5 minutes

  // Check cache first
  const cached = useAdminCache().getCached<{ product: any }>(cacheKey)
  if (cached?.product) {
    // Show cached data immediately
    product.value = cached.product
    mtProductName.value = cached.product.mtProductName || null
    existingImages.value = cached.product.images || []
    form.value.description = cached.product.description || ''
    form.value.visible = cached.product.visible
    loading.value = false
  } else if (!product.value) {
    // Only show loading if we don't have any data
    loading.value = true
  }

  error.value = null

  try {
    const data = await fetchWithCache(
      cacheKey,
      async () => {
        // Use new MT-based endpoint
        const response = await $fetch<{ product: any }>(`${backendUrl}/admin/${tenantId}/products/mt/${mtProductId}`, {
          credentials: 'include',
        })
        return { product: response.product }
      },
      {
        ttl,
        onBackgroundUpdate: (freshData: { product: any }) => {
          // Update UI when fresh data arrives
          product.value = freshData.product
          mtProductName.value = freshData.product.mtProductName || null
          existingImages.value = freshData.product.images || []
          form.value.description = freshData.product.description || ''
          form.value.visible = freshData.product.visible
        },
      }
    )

    // Update with fresh data
    product.value = data.product
    mtProductName.value = data.product.mtProductName || null
    existingImages.value = data.product.images || []
    form.value.description = data.product.description || ''
    form.value.visible = data.product.visible

    // Fetch variants with MT data
    await fetchVariants()
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch product'
    // If we have cached data, keep showing it even on error
    if (!cached && !product.value) {
      product.value = null
    }
  } finally {
    loading.value = false
  }
}

// Fetch variants with MT pricing/stock
async function fetchVariants() {
  const cacheKey = `admin:product-variants:${tenantId}:${mtProductId}`
  const ttl = 1 * 60 * 1000 // Shorter TTL for variants as stock/price can change

  // Check cache first
  const cached = useAdminCache().getCached<{ variants: any[] }>(cacheKey)
  if (cached?.variants) {
    variants.value = cached.variants
    loadingVariants.value = false
  } else {
    loadingVariants.value = true
  }

  try {
    const data = await fetchWithCache(
      cacheKey,
      async () => {
        // Use new MT-based variants endpoint
        const response = await $fetch<{ variants: any[] }>(`${backendUrl}/admin/${tenantId}/products/mt/${mtProductId}/variants`, {
          credentials: 'include',
        })
        return { variants: response.variants }
      },
      {
        ttl,
        onBackgroundUpdate: (freshData: { variants: any[] }) => {
          variants.value = freshData.variants || []
        },
      }
    )
    variants.value = data.variants || []
  } catch (err: any) {
    console.error('Error fetching variants:', err)
    if (!cached) {
      variants.value = []
    }
  } finally {
    loadingVariants.value = false
  }
}

// Image handling
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addImages(Array.from(target.files))
  }
}

function handleDragOver() {
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    addImages(Array.from(event.dataTransfer.files))
  }
}

function addImages(files: File[]) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    if (file.size > 2 * 1024 * 1024) {
      formError.value = `File ${file.name} exceeds 2MB limit`
      continue
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      newImages.value.push({
        file,
        preview: e.target?.result as string,
        isFeatured: false,
      })
    }
    reader.readAsDataURL(file)
  }
}

function removeNewImage(index: number) {
  newImages.value.splice(index, 1)
}

function markImageForDeletion(imageId: string) {
  if (!deletedImageIds.value.includes(imageId)) {
    deletedImageIds.value.push(imageId)
    existingImages.value = existingImages.value.filter(img => img.id !== imageId)
  }
}

function setFeaturedExistingImage(imageId: string) {
  featuredImageId.value = imageId
  existingImages.value.forEach(img => {
    img.isFeatured = img.id === imageId
  })
}

function setFeaturedNewImage(index: number) {
  newImages.value.forEach((img, i) => {
    img.isFeatured = i === index
  })
}

function getFullImageUrl(url: string) {
  if (url.startsWith('http')) return url
  return `${backendUrl}${url}`
}

function hasLocationOverrides(mtData: any): boolean {
  if (!mtData?.attributes?.region_overrides?.length) return false
  const basePrice = mtData.attributes.price
  // Check if any location has a different price than base
  return mtData.attributes.region_overrides.some((region: any) =>
    region.location_overrides?.some((loc: any) => loc.price !== basePrice)
  )
}

function toggleLocationDetails(variantId: string) {
  const index = expandedVariants.value.indexOf(variantId)
  if (index > -1) {
    expandedVariants.value.splice(index, 1)
  } else {
    expandedVariants.value.push(variantId)
  }
}

// Save product
async function saveProduct() {
  try {
    saving.value = true
    formError.value = null

    const formData = new FormData()
    formData.append('description', form.value.description || '')
    formData.append('visible', String(form.value.visible))

    // Add new images
    newImages.value.forEach((img, index) => {
      formData.append('images', img.file)
      if (img.isFeatured) {
        formData.append('featuredImageIndex', String(index))
      }
    })

    // Mark deleted images
    if (deletedImageIds.value.length > 0) {
      formData.append('deletedImageIds', JSON.stringify(deletedImageIds.value))
    }

    // Set featured image
    if (featuredImageId.value) {
      formData.append('featuredImageId', featuredImageId.value)
    } else if (newImages.value.some(img => img.isFeatured)) {
      const featuredIndex = newImages.value.findIndex(img => img.isFeatured)
      formData.append('featuredImageIndex', String(featuredIndex))
    }

    // Use new MT-based endpoint
    await $fetch(`${backendUrl}/admin/${tenantId}/products/mt/${mtProductId}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    })

    // Invalidate caches - use MT product ID
    invalidate(`admin:product:${tenantId}:${mtProductId}`)
    invalidate(`admin:products:${tenantId}`)

    // Refresh product data
    await fetchProduct()
    newImages.value = []
    deletedImageIds.value = []
    featuredImageId.value = null
  } catch (err: any) {
    formError.value = err.message || 'Failed to update product'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProduct()
})
</script>

