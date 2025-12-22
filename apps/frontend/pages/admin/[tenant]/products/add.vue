<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button
        @click="navigateTo(`/admin/${route.params.tenant}/products`)"
        class="text-admin-text-secondary hover:text-admin-text-primary"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-semibold text-admin-text-primary">
          <span v-if="mtProduct?.attributes?.title">Adding {{ mtProduct.attributes.title }}</span>
          <span v-else>Add Product</span>
        </h1>
        <p class="text-sm text-admin-text-secondary mt-1">
          <span v-if="mtProduct">ID: {{ mtProduct.id }}</span>
          <span v-else>Add a new product from Marianatek</span>
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-6 animate-pulse">
      <!-- Product Images Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <div class="h-6 bg-admin-surface-raised rounded w-40 mb-4"></div>
        <div class="h-32 bg-admin-surface-raised rounded"></div>
      </div>
      
      <!-- Product Name Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <div class="h-6 bg-admin-surface-raised rounded w-40 mb-4"></div>
        <div class="space-y-4">
          <div>
            <div class="h-4 bg-admin-surface-raised rounded w-32 mb-2"></div>
            <div class="h-10 bg-admin-surface-raised rounded"></div>
            <div class="h-3 bg-admin-surface-raised rounded w-24 mt-1"></div>
          </div>
        </div>
      </div>
      
      <!-- Product Description Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <div class="h-6 bg-admin-surface-raised rounded w-40 mb-4"></div>
        <div class="h-24 bg-admin-surface-raised rounded"></div>
      </div>
      
      <!-- Variants Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <div class="h-6 bg-admin-surface-raised rounded w-32 mb-4"></div>
        <div class="space-y-4">
          <div
            v-for="i in 3"
            :key="i"
            class="border border-admin-border rounded-lg p-4"
          >
            <div class="h-5 bg-admin-surface-raised rounded w-48 mb-2"></div>
            <div class="h-4 bg-admin-surface-raised rounded w-32 mb-3"></div>
            <div class="space-y-2">
              <div class="h-4 bg-admin-surface-raised rounded w-40"></div>
              <div class="h-4 bg-admin-surface-raised rounded w-56"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-admin-state-danger-soft border border-admin-state-danger-border rounded-lg p-4 text-admin-state-danger-text">
      {{ error }}
    </div>

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
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h12m-4 4v12m0 0l-4-4m4 4l4-4"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <div class="flex text-sm text-admin-text-secondary">
              <label class="relative cursor-pointer rounded-md font-medium text-admin-text-primary hover:text-admin-brand-strong">
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

        <!-- Image Previews -->
        <div v-if="productImages.length > 0" class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            v-for="(img, index) in productImages"
            :key="index"
            class="relative group"
          >
            <div class="aspect-square rounded-lg overflow-hidden border-2" :class="img.isFeatured ? 'border-admin-brand-strong' : 'border-admin-border'">
              <img
                :src="img.preview"
                :alt="`Product image ${index + 1}`"
                class="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              @click="removeProductImage(index)"
              class="absolute top-1 right-1 bg-admin-state-danger-text text-admin-text-inverse rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              @click="setFeaturedImage(index)"
              class="absolute bottom-1 left-1 text-xs px-2 py-1 rounded"
              :class="img.isFeatured ? 'bg-admin-brand-strong text-admin-text-inverse' : 'bg-admin-surface-base text-admin-text-primary'"
            >
              {{ img.isFeatured ? 'Featured' : 'Set Featured' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Product Name -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Product Information</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-admin-text-primary mb-1">
              Product Name
            </label>
            <input
              :value="mtProduct?.attributes?.title || ''"
              type="text"
              disabled
              class="w-full border border-admin-border rounded-lg px-3 py-2 bg-admin-surface-raised text-admin-text-secondary cursor-not-allowed"
            />
            <p class="text-xs text-admin-text-secondary mt-1">ID: {{ mtProduct?.id || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <!-- Product Description -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Product Description</h2>
        <textarea
          v-model="form.description"
          rows="4"
          placeholder="Enter product description..."
          class="w-full border border-admin-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-admin-brand-strong focus:border-admin-border-focus outline-none"
        />
      </div>

      <!-- Variants List -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Variants ({{ variants.length }})</h2>
        <p class="text-sm text-admin-text-secondary mb-4">These variants will be added to your product. You can edit them after creation.</p>
        
        <div class="space-y-4">
          <div
            v-for="(variant, index) in variants"
            :key="variant.id"
            class="border border-admin-border rounded-lg p-4"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="font-medium text-admin-text-primary">{{ variant.attributes?.title || 'Untitled Variant' }}</h3>
                <p class="text-sm text-admin-text-secondary">SKU: {{ variant.attributes?.sku || 'N/A' }}</p>
              </div>
            </div>

            <!-- Variant Attributes -->
            <div v-if="variant.attributes?.variant_attributes?.length > 0" class="mb-3">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="attr in variant.attributes.variant_attributes"
                  :key="attr.code"
                  class="text-xs px-2 py-1 bg-admin-surface-raised text-admin-text-primary rounded"
                >
                  {{ attr.name }}: {{ attr.value || 'N/A' }}
                </span>
              </div>
            </div>

            <!-- Pricing Structure -->
            <div class="space-y-2">
              <div class="text-sm">
                <span class="font-medium text-admin-text-primary">Base Price:</span>
                <span class="text-admin-text-primary ml-2">${{ variant.attributes?.price || '0.00' }}</span>
                <span class="text-admin-text-secondary ml-1">(All locations)</span>
              </div>

              <!-- Location Overrides -->
              <div v-if="variant.attributes?.region_overrides?.length > 0" class="mt-2 space-y-2">
                <div
                  v-for="region in variant.attributes.region_overrides"
                  :key="region.id"
                  class="pl-4 border-l-2 border-admin-border"
                >
                  <div class="text-sm font-medium text-admin-text-primary mb-1">{{ region.name }}</div>
                  <div class="space-y-1">
                    <div
                      v-for="location in region.location_overrides"
                      :key="location.id"
                      class="text-xs text-admin-text-secondary"
                    >
                      {{ location.name }}: ${{ location.price }} (Stock: {{ location.present_quantity ?? 'N/A' }})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
          @click="navigateTo(`/admin/${route.params.tenant}/products`)"
          class="flex-1 bg-admin-surface-raised text-admin-text-primary px-4 py-2 rounded-lg hover:bg-admin-surface-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 bg-admin-brand-strong text-admin-text-inverse px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? 'Creating...' : 'Create Product' }}
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
const error = ref<string | null>(null)
const saving = ref(false)
const formError = ref<string | null>(null)

const mtProductId = computed(() => route.query.mtProductId as string)
const mtProduct = ref<any>(null)
const variants = ref<any[]>([])

const form = ref({
  description: '',
  visible: true,
})

const productImages = ref<Array<{ file: File; preview: string; isFeatured: boolean }>>([])
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

// Fetch MT product data
async function fetchMTProduct() {
  if (!mtProductId.value) {
    error.value = 'Product ID is required'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null
    
    const response = await $fetch<{ product: any; variants: any[] }>(`${backendUrl}/admin/${route.params.tenant}/products/add`, {
      credentials: 'include',
      query: {
        mtProductId: mtProductId.value,
      },
    })

    mtProduct.value = response.product
    variants.value = response.variants || []
    
    // Pre-fill description from MT
    if (mtProduct.value && mtProduct.value.attributes?.description) {
      form.value.description = mtProduct.value.attributes.description
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch product details'
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
      productImages.value.push({
        file,
        preview: e.target?.result as string,
        isFeatured: productImages.value.length === 0, // First image is featured by default
      })
    }
    reader.readAsDataURL(file)
  }
}

function removeProductImage(index: number) {
  productImages.value.splice(index, 1)
  // If we removed the featured image, make the first one featured
  if (productImages.value.length > 0 && !productImages.value.some(img => img.isFeatured)) {
    const firstImage = productImages.value[0]
    if (firstImage) {
      firstImage.isFeatured = true
    }
  }
}

function setFeaturedImage(index: number) {
  productImages.value.forEach((img, i) => {
    img.isFeatured = i === index
  })
}

// Save product
async function saveProduct() {
  try {
    saving.value = true
    formError.value = null

    const formData = new FormData()
    formData.append('mtProductId', mtProductId.value)
    formData.append('description', form.value.description || '')
    formData.append('visible', String(form.value.visible))

    // Add images
    productImages.value.forEach((img, index) => {
      formData.append('images', img.file)
      if (img.isFeatured) {
        formData.append('featuredImageIndex', String(index))
      }
    })

    await $fetch(`${backendUrl}/admin/${route.params.tenant}/products`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    // Navigate to products list
    navigateTo(`/admin/${route.params.tenant}/products`)
  } catch (err: any) {
    formError.value = err.message || 'Failed to create product'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchMTProduct()
})
</script>

