<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button
        @click="navigateTo(`/admin/${route.params.tenant}/products`)"
        class="text-gray-600 hover:text-gray-900"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">
          <span v-if="mtProductName">Editing {{ mtProductName }}</span>
          <span v-else-if="product?.mtProductId">Editing Product #{{ product.mtProductId }}</span>
          <span v-else>Edit Product</span>
        </h1>
        <p class="text-sm text-gray-500 mt-1">ID: {{ product?.mtProductId || 'N/A' }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-6 animate-pulse">
      <!-- Product Images Skeleton -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="h-6 bg-gray-200 rounded w-40 mb-4"></div>
        <div class="h-32 bg-gray-200 rounded mb-4"></div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            v-for="i in 4"
            :key="i"
            class="aspect-square bg-gray-200 rounded-lg"
          ></div>
        </div>
      </div>
      
      <!-- Product Name Skeleton -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="h-6 bg-gray-200 rounded w-40 mb-4"></div>
        <div class="space-y-4">
          <div>
            <div class="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div class="h-10 bg-gray-200 rounded"></div>
            <div class="h-3 bg-gray-200 rounded w-24 mt-1"></div>
          </div>
        </div>
      </div>
      
      <!-- Product Description Skeleton -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="h-6 bg-gray-200 rounded w-40 mb-4"></div>
        <div class="h-24 bg-gray-200 rounded"></div>
      </div>
      
      <!-- Variants Skeleton -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div class="space-y-4">
          <div
            v-for="i in 3"
            :key="i"
            class="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div class="p-4 border-b border-gray-100 bg-gray-50">
              <div class="h-5 bg-gray-200 rounded w-48 mb-1"></div>
              <div class="h-3 bg-gray-200 rounded w-32"></div>
            </div>
            <div class="p-4">
              <div class="h-4 bg-gray-200 rounded w-40 mb-3"></div>
              <div class="space-y-2">
                <div class="h-4 bg-gray-200 rounded w-full"></div>
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {{ error }}
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="saveProduct" class="space-y-6">
      <!-- Product Images -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
        
        <!-- Image Upload Area -->
        <div
          class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="{ 'border-gray-900 bg-gray-50': isDragging }"
        >
          <div class="space-y-1 text-center">
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
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
            <div class="flex text-sm text-gray-600">
              <label class="relative cursor-pointer rounded-md font-medium text-gray-900 hover:text-gray-700">
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
            <p class="text-xs text-gray-500">PNG, JPG, GIF, WebP up to 2MB each</p>
          </div>
        </div>

        <!-- Existing Images -->
        <div v-if="existingImages.length > 0" class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            v-for="img in existingImages"
            :key="img.id"
            class="relative group"
          >
            <div class="aspect-square rounded-lg overflow-hidden border-2" :class="img.isFeatured ? 'border-gray-900' : 'border-gray-200'">
              <img
                :src="getFullImageUrl(img.imageUrl)"
                :alt="`Product image`"
                class="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              @click="markImageForDeletion(img.id)"
              class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              @click="setFeaturedExistingImage(img.id)"
              class="absolute bottom-1 left-1 text-xs px-2 py-1 rounded"
              :class="img.isFeatured ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'"
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
            <div class="aspect-square rounded-lg overflow-hidden border-2" :class="img.isFeatured ? 'border-gray-900' : 'border-gray-200'">
              <img
                :src="img.preview"
                :alt="`New image ${index + 1}`"
                class="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              @click="removeNewImage(index)"
              class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              @click="setFeaturedNewImage(index)"
              class="absolute bottom-1 left-1 text-xs px-2 py-1 rounded"
              :class="img.isFeatured ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'"
            >
              {{ img.isFeatured ? 'Featured' : 'Set Featured' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Product Name -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              :value="mtProductName || ''"
              type="text"
              disabled
              class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p class="text-xs text-gray-500 mt-1">ID: {{ product?.mtProductId || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <!-- Product Description -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Product Description</h2>
        <textarea
          v-model="form.description"
          rows="4"
          placeholder="Enter product description..."
          class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
        />
      </div>

      <!-- Variants List -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Variants ({{ variants.length }})</h2>
        
        <div v-if="loadingVariants" class="text-center py-4 text-gray-500">
          Loading variants...
        </div>
        
        <div v-else class="space-y-4">
          <div
            v-for="variant in variants"
            :key="variant.id"
            class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <!-- Variant Header -->
            <div class="p-4 border-b border-gray-100 bg-gray-50">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900">{{ variant.sku || 'Untitled Variant' }}</h3>
                  <p class="text-xs text-gray-500 mt-0.5">MT Variant ID: {{ variant.mtVariantId }}</p>
                </div>
                <button
                  type="button"
                  @click="navigateTo(`/admin/${route.params.tenant}/products/variants/edit/${product?.id}/${variant.id}`)"
                  class="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit →
                </button>
              </div>
            </div>

            <!-- Pricing from MT -->
            <div v-if="variant.mtData" class="p-4">
              <div class="space-y-3">
                <!-- Base Price -->
                <div class="flex items-center justify-between py-2 border-b border-gray-100">
                  <span class="text-sm font-medium text-gray-700">Base Price (All locations)</span>
                  <span class="text-lg font-semibold text-gray-900">${{ variant.mtData.attributes?.price || '0.00' }}</span>
                </div>

                <!-- Location Overrides -->
                <div v-if="hasLocationOverrides(variant.mtData)" class="mt-3">
                  <button
                    type="button"
                    @click="toggleLocationDetails(variant.id)"
                    class="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
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
                    class="mt-2 space-y-3 pt-2 border-t border-gray-100"
                  >
                    <div
                      v-for="region in variant.mtData.attributes.region_overrides"
                      :key="region.id"
                      class="bg-gray-50 rounded-lg p-3"
                    >
                      <div class="font-medium text-gray-900 mb-2 text-sm">{{ region.name }}</div>
                      <div class="space-y-2">
                        <div
                          v-for="location in region.location_overrides"
                          :key="location.id"
                          class="flex items-center justify-between text-sm bg-white rounded p-2 border border-gray-200"
                        >
                          <div class="flex-1">
                            <div class="font-medium text-gray-900">{{ location.name }}</div>
                            <div class="text-xs text-gray-500 mt-0.5">
                              Stock: {{ location.present_quantity ?? 'N/A' }}
                            </div>
                          </div>
                          <div class="text-right">
                            <div class="font-semibold text-gray-900">${{ location.price }}</div>
                            <div
                              v-if="location.price !== variant.mtData.attributes?.price"
                              class="text-xs text-amber-600 mt-0.5"
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
            <div v-else class="p-4 text-sm text-gray-500">
              Loading pricing data...
            </div>
          </div>
        </div>
      </div>

      <!-- Form Error -->
      <div v-if="formError" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {{ formError }}
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          type="button"
          @click="navigateTo(`/admin/${route.params.tenant}/products`)"
          class="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

const loading = ref(true)
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

// Fetch product
async function fetchProduct() {
  try {
    loading.value = true
    error.value = null
    
    const response = await $fetch<{ product: any }>(`${backendUrl}/admin/${route.params.tenant}/products/${route.params.id}`, {
      credentials: 'include',
    })

    product.value = response.product
    mtProductName.value = response.product.mtProductName || null
    existingImages.value = response.product.images || []
    form.value.description = response.product.description || ''
    form.value.visible = response.product.visible

    // Fetch variants with MT data
    await fetchVariants()
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch product'
  } finally {
    loading.value = false
  }
}

// Fetch variants with MT pricing/stock
async function fetchVariants() {
  try {
    loadingVariants.value = true
    const response = await $fetch<{ variants: any[] }>(`${backendUrl}/admin/${route.params.tenant}/products/${route.params.id}/variants`, {
      credentials: 'include',
    })
    variants.value = response.variants || []
  } catch (err: any) {
    console.error('Error fetching variants:', err)
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

    await $fetch(`${backendUrl}/admin/${route.params.tenant}/products/${route.params.id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    })

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

