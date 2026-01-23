<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UiButton
        @click="navigateTo(mtProductId ? `/admin/${route.params.tenant}/products/edit/${mtProductId}` : `/admin/${route.params.tenant}/products`)"
        variant="ghost"
        size="icon"
        class="text-admin-text-secondary hover:text-admin-text-primary"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </UiButton>
      <div>
        <h1 class="text-3xl font-semibold text-admin-text-primary">{{ variantTitle }}</h1>
        <p class="text-sm text-admin-text-secondary mt-2">SKU: {{ variant?.sku || 'N/A' }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-brand-strong"></div>
    </div>

    <!-- Error State -->
    <UiAlert v-else-if="error" variant="error">
      {{ error }}
    </UiAlert>

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

      <!-- Variant Description -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Variant Description</h2>
        <UiTextarea
          v-model="form.description"
          rows="4"
          placeholder="Enter variant description..."
          class="w-full"
        />
      </div>

      <!-- MT Data (Read-only) -->
      <UiCard variant="default" class="p-5">
        <UiCardHeader class="p-0 pb-4">
          <UiCardTitle class="mb-1">Pricing & Stock</UiCardTitle>
          <UiCardDescription>Data pulled live from Marianatek</UiCardDescription>
        </UiCardHeader>
        
        <div v-if="variant?.mtData" class="space-y-5">
          <!-- Base Price -->
          <div class="flex items-center gap-3 pb-4 border-b border-admin-border">
            <div class="flex-1">
              <div class="text-xs font-medium text-admin-text-secondary mb-1">Base Price</div>
              <div class="text-2xl font-semibold text-admin-text-primary">${{ variant.mtData.attributes?.price || '0.00' }}</div>
            </div>
            <UiBadge variant="default" class="shrink-0">All Locations</UiBadge>
          </div>

          <!-- Variant Attributes -->
          <div v-if="variant.mtData.attributes?.variant_attributes?.length > 0" class="space-y-2">
            <h3 class="text-sm font-semibold text-admin-text-primary">Attributes</h3>
            <div class="flex flex-wrap gap-2">
              <UiBadge
                v-for="attr in variant.mtData.attributes.variant_attributes"
                :key="attr.code"
                variant="info"
              >
                {{ attr.name }}: {{ attr.value || 'N/A' }}
              </UiBadge>
            </div>
          </div>

          <!-- Location Overrides -->
          <div v-if="variant.mtData.attributes?.region_overrides?.length > 0" class="space-y-2">
            <h3 class="text-sm font-semibold text-admin-text-primary">Location Pricing & Stock</h3>
            <div class="space-y-1">
              <div
                v-for="region in variant.mtData.attributes.region_overrides"
                :key="region.id"
                class="border border-admin-border rounded-md overflow-hidden"
              >
                <button
                  @click="toggleRegion(region.id)"
                  class="w-full flex items-center justify-between p-3 text-left hover:bg-admin-surface-hover transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <svg
                      class="w-4 h-4 text-admin-text-secondary transition-transform"
                      :class="{ 'rotate-90': expandedRegions.has(region.id) }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span class="text-sm font-semibold text-admin-brand-strong">{{ region.name }}</span>
                    <UiBadge variant="default" class="text-xs">
                      {{ region.location_overrides?.length || 0 }} location{{ (region.location_overrides?.length || 0) !== 1 ? 's' : '' }}
                    </UiBadge>
                  </div>
                </button>
                <div
                  v-show="expandedRegions.has(region.id)"
                  class="border-t border-admin-border bg-admin-surface-raised"
                >
                  <div class="p-2 space-y-1">
                    <div
                      v-for="location in region.location_overrides"
                      :key="location.id"
                      class="group flex items-center justify-between px-3 py-2 rounded hover:bg-admin-surface-base transition-colors"
                    >
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        <div class="font-medium text-sm text-admin-text-primary truncate">{{ location.name }}</div>
                        <div class="flex items-center gap-1.5 text-xs text-admin-text-secondary shrink-0">
                          <span>${{ location.price }}</span>
                        </div>
                      </div>
                      <UiBadge
                        :variant="(location.present_quantity ?? 0) === 0 ? 'danger' : 'success'"
                        class="shrink-0 ml-2"
                      >
                        {{ location.present_quantity ?? 'N/A' }}
                      </UiBadge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="py-4">
          <p class="text-sm text-admin-text-secondary text-center">Loading pricing data...</p>
        </div>
      </UiCard>

      <!-- Form Error -->
      <UiAlert v-if="formError" variant="error">
        {{ formError }}
      </UiAlert>

      <!-- Actions -->
      <div class="flex gap-3">
        <UiButton
          type="button"
          @click="navigateTo(mtProductId ? `/admin/${route.params.tenant}/products/edit/${mtProductId}` : `/admin/${route.params.tenant}/products`)"
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

// Collapsible regions state
const expandedRegions = ref<Set<string>>(new Set())

function toggleRegion(regionId: string) {
  if (expandedRegions.value.has(regionId)) {
    expandedRegions.value.delete(regionId)
  } else {
    expandedRegions.value.add(regionId)
  }
}

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

