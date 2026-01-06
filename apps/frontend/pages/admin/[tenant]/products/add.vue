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
          <span v-if="mtProduct?.attributes?.title">Adding {{ mtProduct.attributes.title }}</span>
          <span v-else>Add Product</span>
        </h1>
        <p class="text-sm text-admin-text-secondary mt-2">
          <span v-if="mtProduct">ID: {{ mtProduct.id }}</span>
          <span v-else>Add a new product from Marianatek</span>
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <!-- Product Images Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <UiSkeleton class="h-6 w-40 mb-4" />
        <UiSkeleton class="h-32 w-full" />
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
            class="border border-admin-border rounded-lg p-4"
          >
            <UiSkeleton class="h-5 w-48 mb-2" />
            <UiSkeleton class="h-4 w-32 mb-3" />
            <div class="space-y-2">
              <UiSkeleton class="h-4 w-40" />
              <UiSkeleton class="h-4 w-56" />
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
            <UiButton
              type="button"
              @click="removeProductImage(index)"
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
              @click="setFeaturedImage(index)"
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
              :value="mtProduct?.attributes?.title || ''"
              type="text"
              disabled
              class="w-full bg-admin-surface-raised text-admin-text-secondary cursor-not-allowed"
            />
            <p class="text-xs text-admin-text-secondary mt-1">ID: {{ mtProduct?.id || 'N/A' }}</p>
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

      <!-- Categories -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold text-admin-text-primary mb-4">Categories</h2>
        <div v-if="loadingCategories" class="text-sm text-admin-text-secondary">
          Loading categories...
        </div>
        <div v-else-if="availableCategories.length === 0" class="text-sm text-admin-text-secondary">
          No categories available. <NuxtLink :to="`/admin/${route.params.tenant}/products`" class="text-admin-brand-strong hover:underline">Create a category</NuxtLink> first.
        </div>
        <div v-else class="space-y-3">
          <!-- Recently Used Categories -->
          <div v-if="recentlyUsedCategories.length > 0" class="space-y-2">
            <UiLabel class="text-sm font-medium text-admin-text-secondary">Recently Used</UiLabel>
            <div class="flex flex-wrap gap-2">
              <UiButton
                v-for="category in recentlyUsedCategories"
                :key="category.id"
                type="button"
                @click="toggleCategory(category.id)"
                :variant="selectedCategoryIds.includes(category.id) ? 'default' : 'outline'"
                size="sm"
                class="text-xs"
              >
                {{ category.name }}
                <svg v-if="selectedCategoryIds.includes(category.id)" class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </UiButton>
            </div>
          </div>

          <!-- All Categories -->
          <div class="space-y-2">
            <UiLabel class="text-sm font-medium text-admin-text-secondary">All Categories</UiLabel>
            <div class="border border-admin-border rounded-lg p-3 max-h-48 overflow-y-auto">
              <div class="space-y-2">
                <div
                  v-for="category in availableCategories"
                  :key="category.id"
                  class="flex items-center gap-2"
                >
                  <UiCheckbox
                    :checked="selectedCategoryIds.includes(category.id)"
                    @update:checked="(checked) => toggleCategory(category.id, checked)"
                  />
                  <UiLabel class="text-sm cursor-pointer flex-1">
                    {{ category.name }}
                  </UiLabel>
                </div>
              </div>
            </div>
          </div>
        </div>
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
          {{ saving ? 'Creating...' : 'Create Product' }}
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
const { fetchWithCache } = useAdminCache()

const loading = ref(false) // Start as false - only show if no data available
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

// Category management
const { fetchCategories } = useCategory()
const availableCategories = ref<any[]>([])
const selectedCategoryIds = ref<string[]>([])
const loadingCategories = ref(false)
const recentlyUsedCategories = ref<any[]>([])

// Initialize with route state data if available
const routeState = getRouteState<{
  mtProductId?: string
  productName?: string
  productDescription?: string
}>()

// Set initial product data from route state
if (routeState) {
  mtProduct.value = {
    id: routeState.mtProductId || mtProductId.value,
    attributes: {
      title: routeState.productName || '',
      description: routeState.productDescription || '',
    },
  }
  if (routeState.productDescription) {
    form.value.description = routeState.productDescription
  }
}

// Fetch MT product data with cache-first strategy
async function fetchMTProduct() {
  if (!mtProductId.value) {
    error.value = 'Product ID is required'
    loading.value = false
    return
  }

  const tenantId = route.params.tenant as string
  const cacheKey = `admin:mt-product:${tenantId}:${mtProductId.value}`
  const ttl = 5 * 60 * 1000 // 5 minutes

  // Check cache first
  const cached = useAdminCache().getCached<{ product: any; variants: any[] }>(cacheKey)
  if (cached) {
    // Show cached data immediately
    mtProduct.value = cached.product
    variants.value = cached.variants || []
    if (mtProduct.value?.attributes?.description) {
      form.value.description = mtProduct.value.attributes.description
    }
    loading.value = false
  } else if (!mtProduct.value) {
    // Only show loading if we don't have route state data
    loading.value = true
  }

  error.value = null

  try {
    const data = await fetchWithCache(
      cacheKey,
      async () => {
        const response = await $fetch<{ product: any; variants: any[] }>(`${backendUrl}/admin/${tenantId}/products/add`, {
          credentials: 'include',
          query: {
            mtProductId: mtProductId.value,
          },
        })
        return {
          product: response.product,
          variants: response.variants || [],
        }
      },
      {
        ttl,
        onBackgroundUpdate: (freshData: { product: any; variants: any[] }) => {
          // Update UI when fresh data arrives
          mtProduct.value = freshData.product
          variants.value = freshData.variants || []
          if (mtProduct.value?.attributes?.description && !form.value.description) {
            form.value.description = mtProduct.value.attributes.description
          }
        },
      }
    )

    // Update with fresh data
    mtProduct.value = data.product
    variants.value = data.variants || []
    
    // Pre-fill description from MT if not already set
    if (mtProduct.value?.attributes?.description && !form.value.description) {
      form.value.description = mtProduct.value.attributes.description
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch product details'
    // If we have route state data, keep showing it even on error
    if (!routeState) {
      mtProduct.value = null
      variants.value = []
    }
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

// Category functions
async function loadCategories() {
  loadingCategories.value = true
  try {
    const tenantId = route.params.tenant as string
    availableCategories.value = await fetchCategories(tenantId)
    loadRecentlyUsedCategories()
  } catch (err: any) {
    console.error('Error loading categories:', err)
    availableCategories.value = []
  } finally {
    loadingCategories.value = false
  }
}

function loadRecentlyUsedCategories() {
  try {
    const stored = localStorage.getItem(`recently-used-categories:${route.params.tenant}`)
    if (stored) {
      const recentIds = JSON.parse(stored) as string[]
      recentlyUsedCategories.value = availableCategories.value
        .filter(cat => recentIds.includes(cat.id))
        .slice(0, 5)
    }
  } catch (e) {
    console.error('Error loading recently used categories:', e)
  }
}

function toggleCategory(categoryId: string, checked?: boolean) {
  const index = selectedCategoryIds.value.indexOf(categoryId)
  const isChecked = checked !== undefined ? checked : index === -1

  if (isChecked && index === -1) {
    selectedCategoryIds.value.push(categoryId)
    // Update recently used
    updateRecentlyUsedCategories(categoryId)
  } else if (!isChecked && index > -1) {
    selectedCategoryIds.value.splice(index, 1)
  }
}

function updateRecentlyUsedCategories(categoryId: string) {
  try {
    const key = `recently-used-categories:${route.params.tenant}`
    const stored = localStorage.getItem(key)
    const recentIds = stored ? JSON.parse(stored) as string[] : []
    
    // Remove if already exists
    const filtered = recentIds.filter(id => id !== categoryId)
    // Add to front
    filtered.unshift(categoryId)
    // Keep only last 5
    const updated = filtered.slice(0, 5)
    
    localStorage.setItem(key, JSON.stringify(updated))
    loadRecentlyUsedCategories()
  } catch (e) {
    console.error('Error updating recently used categories:', e)
  }
}

// Save product
async function saveProduct() {
  try {
    saving.value = true
    formError.value = null

    const tenantId = route.params.tenant as string
    const formData = new FormData()
    formData.append('mtProductId', mtProductId.value)
    formData.append('description', form.value.description || '')
    formData.append('visible', String(form.value.visible))

    // Add category IDs
    if (selectedCategoryIds.value.length > 0) {
      selectedCategoryIds.value.forEach(categoryId => {
        formData.append('categoryIds[]', categoryId)
      })
    }

    // Add images
    productImages.value.forEach((img, index) => {
      formData.append('images', img.file)
      if (img.isFeatured) {
        formData.append('featuredImageIndex', String(index))
      }
    })

    await $fetch(`${backendUrl}/admin/${tenantId}/products`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    // Invalidate products list cache
    const { invalidate } = useAdminCache()
    invalidate(`admin:products:${tenantId}`)
    invalidate(`admin:mt-product:${tenantId}:${mtProductId.value}`)

    // Navigate to products list
    navigateTo(`/admin/${tenantId}/products`)
  } catch (err: any) {
    formError.value = err.message || 'Failed to create product'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  // Only fetch if we don't have route state data
  if (!routeState || !mtProduct.value) {
    fetchMTProduct()
  } else {
    // We have route state data, but still fetch full details in background
    fetchMTProduct()
  }
  loadCategories()
})
</script>

