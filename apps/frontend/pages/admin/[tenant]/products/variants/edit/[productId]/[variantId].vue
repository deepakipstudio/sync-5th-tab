<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button
        @click="navigateTo(mtProductId ? `/admin/${route.params.tenant}/products/edit/${mtProductId}` : `/admin/${route.params.tenant}/products`)"
        class="text-admin-text-secondary hover:text-admin-text-primary"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-semibold text-admin-text-primary">{{ variantTitle }}</h1>
        <p class="text-sm text-admin-text-secondary mt-1">SKU: {{ variant?.sku || 'N/A' }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-brand-strong"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-admin-state-danger-soft border border-admin-state-danger-border rounded-lg p-4 text-admin-state-danger-text">
      {{ error }}
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="saveVariant" class="space-y-6">
      <!-- Variant Images -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Variant Images</h2>
        
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
                :alt="`Variant image`"
                class="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              @click="markImageForDeletion(img.id)"
              class="absolute top-1 right-1 bg-admin-state-danger-text text-admin-text-inverse rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              @click="setFeaturedExistingImage(img.id)"
              class="absolute bottom-1 left-1 text-xs px-2 py-1 rounded"
              :class="img.isFeatured ? 'bg-admin-brand-strong text-admin-text-inverse' : 'bg-admin-surface-base text-admin-text-primary'"
            >
              {{ img.isFeatured ? 'Featured' : 'Set Featured' }}
            </button>
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
            <button
              type="button"
              @click="removeNewImage(index)"
              class="absolute top-1 right-1 bg-admin-state-danger-text text-admin-text-inverse rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              @click="setFeaturedNewImage(index)"
              class="absolute bottom-1 left-1 text-xs px-2 py-1 rounded"
              :class="img.isFeatured ? 'bg-admin-brand-strong text-admin-text-inverse' : 'bg-admin-surface-base text-admin-text-primary'"
            >
              {{ img.isFeatured ? 'Featured' : 'Set Featured' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Variant Description -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Variant Description</h2>
        <textarea
          v-model="form.description"
          rows="4"
          placeholder="Enter variant description..."
          class="w-full border border-admin-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-admin-brand-strong focus:border-transparent outline-none"
        />
      </div>

      <!-- MT Data (Read-only) -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Pricing & Stock (from Marianatek)</h2>
        
        <div v-if="variant?.mtData" class="space-y-4">
          <!-- Base Price -->
          <div>
            <span class="text-sm font-medium text-admin-text-primary">Base Price:</span>
            <span class="text-lg text-admin-text-primary ml-2">${{ variant.mtData.attributes?.price || '0.00' }}</span>
            <span class="text-sm text-admin-text-secondary ml-1">(All locations)</span>
          </div>

          <!-- Variant Attributes -->
          <div v-if="variant.mtData.attributes?.variant_attributes?.length > 0">
            <h3 class="text-sm font-medium text-admin-text-primary mb-2">Attributes</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="attr in variant.mtData.attributes.variant_attributes"
                :key="attr.code"
                class="text-sm px-3 py-1 bg-admin-surface-raised text-admin-text-primary rounded"
              >
                {{ attr.name }}: {{ attr.value || 'N/A' }}
              </span>
            </div>
          </div>

          <!-- Location Overrides -->
          <div v-if="variant.mtData.attributes?.region_overrides?.length > 0">
            <h3 class="text-sm font-medium text-admin-text-primary mb-2">Location Pricing & Stock</h3>
            <div class="space-y-3">
              <div
                v-for="region in variant.mtData.attributes.region_overrides"
                :key="region.id"
                class="pl-4 border-l-2 border-admin-border"
              >
                <div class="font-medium text-admin-text-primary mb-2">{{ region.name }}</div>
                <div class="space-y-2">
                  <div
                    v-for="location in region.location_overrides"
                    :key="location.id"
                    class="text-sm bg-admin-surface-raised p-2 rounded"
                  >
                    <div class="font-medium text-admin-text-primary">{{ location.name }}</div>
                    <div class="text-admin-text-secondary">
                      Price: ${{ location.price }} | Stock: {{ location.present_quantity ?? 'N/A' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-sm text-admin-text-secondary">
          Loading pricing data...
        </div>
      </div>

      <!-- Form Error -->
      <div v-if="formError" class="bg-admin-state-danger-soft border border-admin-state-danger-border rounded-lg p-4 text-admin-state-danger-text">
        {{ formError }}
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          type="button"
          @click="navigateTo(mtProductId ? `/admin/${route.params.tenant}/products/edit/${mtProductId}` : `/admin/${route.params.tenant}/products`)"
          class="flex-1 bg-admin-surface-raised text-admin-text-primary px-4 py-2 rounded-lg hover:bg-admin-surface-raised transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 bg-admin-brand-strong text-admin-text-inverse px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const config = useRuntimeConfig()
const backendUrl = config.public.backendUrl
const adminCache = useAdminCache()

const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const formError = ref<string | null>(null)

const variant = ref<any>(null)
const mtProductName = ref<string | null>(null)

// Get product ID and variant ID from route params (UUIDs)
const tenantId = route.params.tenant as string
const productId = route.params.productId as string
const variantId = route.params.variantId as string

// Get MT product ID for navigation - try to get from variant's product relationship or cache
const mtProductId = computed(() => {
  // First, try to get from variant's product relationship
  if (variant.value?.product?.mtProductId) {
    return variant.value.product.mtProductId
  }
  
  // Fallback: look up in products list cache using database UUID
  const productsCacheKey = `admin:products:${tenantId}`
  const cachedProducts = adminCache.getCached<{ products: any[] }>(productsCacheKey)
  
  if (cachedProducts?.products) {
    const cachedProduct = cachedProducts.products.find(p => p.id === productId)
    if (cachedProduct?.mtProductId) {
      return cachedProduct.mtProductId
    }
  }
  
  // If we can't find it, return null (navigation will fail gracefully)
  return null
})

// Variant title: "{Product Name} Variant: {Color Size}" or "{Product Name} Variant"
const variantTitle = computed(() => {
  const productName = mtProductName.value || 'Product'
  // variant_attributes is an array like: [{name: "Color", value: null}, {name: "Size", value: "7"}]
  // Filter out null/empty values and join with space
  const attributes = variant.value?.mtData?.attributes?.variant_attributes || []
  const attrValues = attributes
    .map((attr: any) => attr.value)
    .filter((value: any) => value !== null && value !== undefined && value !== '')
    .join(' ')
  return attrValues 
    ? `${productName} Variant: ${attrValues}`
    : `${productName} Variant`
})

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

// Fetch variant
async function fetchVariant() {
  try {
    loading.value = true
    error.value = null
    
    const response = await $fetch<{ variant: any }>(`${backendUrl}/admin/${tenantId}/products/variants/${variantId}`, {
      credentials: 'include',
    })

    variant.value = response.variant
    existingImages.value = response.variant.images || []
    form.value.description = response.variant.description || ''
    form.value.visible = response.variant.visible
    
    // Update product name from variant's product relationship
    if (response.variant.product?.mtProductName) {
      mtProductName.value = response.variant.product.mtProductName
    } else if (response.variant.product?.mtProductId) {
      // Try to get product name from cache
      const productsCacheKey = `admin:products:${tenantId}`
      const cachedProducts = adminCache.getCached<{ products: any[] }>(productsCacheKey)
      if (cachedProducts?.products) {
        const cachedProduct = cachedProducts.products.find(p => p.mtProductId === response.variant.product.mtProductId)
        if (cachedProduct?.mtProductName) {
          mtProductName.value = cachedProduct.mtProductName
        }
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch variant'
  } finally {
    loading.value = false
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

// Save variant
async function saveVariant() {
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

    // Use UUID-based endpoint
    await $fetch(`${backendUrl}/admin/${tenantId}/products/variants/${variantId}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    })

    // Invalidate caches
    adminCache.invalidate(`admin:products:${tenantId}`)
    if (mtProductId.value) {
      adminCache.invalidate(`admin:product:${tenantId}:${mtProductId.value}`)
    }

    // Refresh variant data
    await fetchVariant()
    newImages.value = []
    deletedImageIds.value = []
    featuredImageId.value = null
  } catch (err: any) {
    formError.value = err.message || 'Failed to update variant'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchVariant()
})
</script>

