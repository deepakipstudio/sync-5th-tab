<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold text-admin-text-primary">Products</h1>
        <p class="text-sm text-admin-text-secondary mt-2">Manage your product catalog</p>
      </div>
      <div class="flex gap-2">
        <UiButton
          @click="navigateTo(`/admin/${route.params.tenant}/categories`)"
          variant="secondary"
          class="inline-flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Manage Categories
        </UiButton>
        <UiButton
          @click="openAddModal"
          variant="default"
          class="inline-flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </UiButton>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-admin-surface-base rounded-lg border border-admin-border p-4 space-y-4">
      <!-- Search Bar -->
      <div>
        <UiInput
          v-model="searchQuery"
          type="text"
          placeholder="Search products by name or description..."
          class="w-full"
        />
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-4">
        <!-- Category Filter -->
        <div class="flex items-center gap-2">
          <label class="text-sm text-admin-text-secondary">Category:</label>
          <select
            v-model="selectedCategory"
            class="px-3 py-1.5 text-sm rounded-lg border border-admin-border bg-admin-surface-base text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-brand-strong"
          >
            <option value="">All Categories</option>
            <option v-for="category in availableCategories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>

        <!-- Stock Filter -->
        <div class="flex items-center gap-2">
          <label class="text-sm text-admin-text-secondary">Stock:</label>
          <select
            v-model="stockFilter"
            class="px-3 py-1.5 text-sm rounded-lg border border-admin-border bg-admin-surface-base text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-brand-strong"
          >
            <option value="all">All</option>
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <label class="text-sm text-admin-text-secondary">Status:</label>
          <select
            v-model="statusFilter"
            class="px-3 py-1.5 text-sm rounded-lg border border-admin-border bg-admin-surface-base text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-brand-strong"
          >
            <option value="all">All</option>
            <option value="visible">Active</option>
            <option value="hidden">Draft</option>
          </select>
        </div>

        <!-- Clear Filters -->
        <UiButton
          v-if="hasActiveFilters"
          @click="clearFilters"
          variant="ghost"
          size="sm"
          class="ml-auto"
        >
          Clear Filters
        </UiButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-admin-surface-base rounded-lg border border-admin-border">
      <div v-for="i in 5" :key="i" class="border-b border-admin-border last:border-b-0">
        <div class="flex items-center gap-4 p-4">
          <UiSkeleton class="w-20 h-20 rounded-lg" />
          <div class="flex-1 space-y-2">
            <UiSkeleton class="h-5 w-1/3" />
            <UiSkeleton class="h-4 w-2/3" />
            <UiSkeleton class="h-3 w-1/4" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <UiAlert v-else-if="error" variant="error">
      {{ error }}
    </UiAlert>

    <!-- Empty State -->
    <div v-else-if="filteredProducts.length === 0" class="bg-admin-surface-base rounded-lg border border-admin-border p-12 text-center">
      <div class="mx-auto w-16 h-16 bg-admin-surface-raised rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-admin-text-primary mb-1">
        {{ hasActiveFilters ? 'No products match your filters' : 'No products yet' }}
      </h3>
      <p class="text-admin-text-secondary mb-4">
        {{ hasActiveFilters ? 'Try adjusting your search or filters.' : 'Get started by adding your first product from Marianatek.' }}
      </p>
      <UiButton
        v-if="!hasActiveFilters"
        @click="openAddModal"
        variant="default"
        class="inline-flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Product
      </UiButton>
    </div>

    <!-- Products List -->
    <div v-else class="bg-admin-surface-base rounded-lg border border-admin-border">
      <div class="space-y-0">
        <AdminProductListItem
          v-for="product in paginatedProducts"
          :key="product.id"
          :product="product"
          :expanded="expandedProducts.has(product.id)"
          :selected-location-id="selectedLocationId"
          :mt-subdomain="mtSubdomain"
          @update:expanded="(value) => toggleProductExpanded(product.id, value)"
          @edit="handleEditProduct"
          @edit-on-mt="editOnMT"
          @view-on-store="viewOnStore"
          @toggle-visibility="toggleProductVisibility"
          @delete="openDeleteModal"
        />
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="border-t border-admin-border p-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-sm text-admin-text-secondary">
            Showing {{ startIndex + 1 }}-{{ endIndex }} of {{ filteredProducts.length }} products
          </span>
          <div class="flex items-center gap-2">
            <label class="text-sm text-admin-text-secondary">Items per page:</label>
            <select
              v-model="itemsPerPage"
              class="px-2 py-1 text-sm rounded border border-admin-border bg-admin-surface-base text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-brand-strong"
            >
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UiButton
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            variant="outline"
            size="sm"
          >
            Previous
          </UiButton>
          <span class="text-sm text-admin-text-primary px-2">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <UiButton
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            variant="outline"
            size="sm"
          >
            Next
          </UiButton>
        </div>
      </div>
    </div>

    <!-- MT Product Search Modal -->
    <UiDialog :open="showAddModal" @update:open="(value) => { if (!value) closeAddModal() }" class="max-w-4xl max-h-[90vh]">
      <UiDialogTitle class="sr-only">Select Product from Marianatek</UiDialogTitle>
      <div class="flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-admin-border flex items-center justify-between">
          <h2 class="text-lg font-semibold text-admin-text-primary">Select Product from Marianatek</h2>
          <UiDialogClose as-child>
            <UiButton variant="ghost" size="icon" class="text-admin-text-muted hover:text-admin-text-secondary">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </UiButton>
          </UiDialogClose>
        </div>

        <div class="p-6 flex-1 overflow-y-auto">
          <!-- Search -->
          <div class="mb-4">
            <UiInput
              v-model="searchQuery"
              @input="() => searchMTProducts(1)"
              type="text"
              placeholder="Search products..."
              class="w-full"
            />
          </div>

            <!-- Count and Pagination Info -->
            <div v-if="mtProductsTotal > 0" class="mb-4 flex items-center justify-between text-sm text-admin-text-secondary">
              <span>
                Showing {{ mtProducts.length }} out of {{ mtProductsTotal }} product{{ mtProductsTotal !== 1 ? 's' : '' }}
              </span>
              <div v-if="mtProductsTotal > mtProductsPageSize" class="flex items-center gap-2">
                <UiButton
                  @click="searchMTProducts(mtProductsPage - 1)"
                  :disabled="mtProductsPage <= 1 || searching"
                  variant="outline"
                  size="sm"
                >
                  Previous
                </UiButton>
                <span class="text-admin-text-primary">
                  Page {{ mtProductsPage }} of {{ Math.ceil(mtProductsTotal / mtProductsPageSize) }}
                </span>
                <UiButton
                  @click="searchMTProducts(mtProductsPage + 1)"
                  :disabled="mtProductsPage >= Math.ceil(mtProductsTotal / mtProductsPageSize) || searching"
                  variant="outline"
                  size="sm"
                >
                  Next
                </UiButton>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="searching" class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-admin-brand-strong"></div>
            </div>

            <!-- Results -->
            <div v-else-if="mtProducts.length > 0" class="space-y-2">
              <div
                v-for="product in mtProducts"
                :key="product.id"
                @click="selectMTProduct(product)"
                class="p-4 border border-admin-border rounded-lg hover:border-admin-brand-strong hover:bg-admin-surface-hover cursor-pointer transition-colors relative"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="font-medium text-admin-text-primary">{{ product.attributes?.title || 'Untitled Product' }}</h3>
                    <p v-if="product.attributes?.description" class="text-sm text-admin-text-secondary mt-1 line-clamp-2">
                      {{ product.attributes.description }}
                    </p>
                    <div class="flex gap-4 mt-2 text-xs text-admin-text-secondary">
                      <span>ID: {{ product.id }}</span>
                      <span v-if="product.attributes?.children_count !== undefined">
                        {{ product.attributes.children_count }} variant{{ product.attributes.children_count !== 1 ? 's' : '' }}
                      </span>
                    </div>
                  </div>
                  <div v-if="isProductAdded(product.id)" class="ml-4 flex-shrink-0">
                    <UiBadge variant="success">
                      Added
                    </UiBadge>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="!searching && mtProducts.length === 0 && searchQuery" class="text-center py-8 text-admin-text-secondary">
              No products found
            </div>
            <div v-else-if="!searching && mtProducts.length === 0 && !searchQuery" class="text-center py-8 text-admin-text-secondary">
              No products available
            </div>
          </div>
        </div>
    </UiDialog>

    <!-- Delete Confirmation Modal -->
    <UiDialog :open="showDeleteModal" @update:open="(value) => { if (!value) closeDeleteModal() }" class="max-w-md">
      <div class="p-6">
        <div class="mx-auto w-12 h-12 bg-admin-state-danger-soft rounded-full flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-admin-state-danger-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <UiDialogTitle class="text-lg font-semibold text-admin-text-primary text-center mb-2">Delete from Sync</UiDialogTitle>
        <UiDialogDescription class="text-admin-text-secondary text-center mb-4">
          Are you sure you want to delete <strong>{{ productToDelete?.mtProductName || `Product #${productToDelete?.mtProductId}` }}</strong> from Sync?
        </UiDialogDescription>
        <UiAlert variant="warning" class="mb-6">
          <p class="text-sm">
            <strong>Note:</strong> Deleting on Sync won't delete this product from Mariana Tek. To delete this product completely, delete it from your Mariana Tek account.
          </p>
        </UiAlert>
        <div class="flex gap-3">
          <UiButton
            @click="closeDeleteModal"
            variant="secondary"
            class="flex-1"
          >
            Cancel
          </UiButton>
          <UiButton
            @click="confirmDelete"
            :disabled="deleting"
            variant="danger"
            class="flex-1"
          >
            {{ deleting ? 'Deleting...' : 'Delete from Sync' }}
          </UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const config = useRuntimeConfig()
const backendUrl = config.public.backendUrl
const { fetchWithCache, invalidate } = useAdminCache()
const { fetchStoreSettings } = useStoreSettings()
const { fetchCategories } = useCategory()

const loading = ref(false) // Start as false - only show loading if no cache
const error = ref<string | null>(null)
const products = ref<any[]>([])
const mtSubdomain = ref<string | null>(null)
const refreshing = ref(false) // Track background refresh

const showAddModal = ref(false)
const showDeleteModal = ref(false)
const productToDelete = ref<any>(null)
const deleting = ref(false)
const openMenuId = ref<string | null>(null)
const searchQuery = ref('')
const searching = ref(false)
const mtProducts = ref<any[]>([])
const mtProductsTotal = ref(0)
const mtProductsPage = ref(1)
const mtProductsPageSize = ref(20)

// Filters and pagination
const selectedCategory = ref<string>('')
const stockFilter = ref<string>('all')
const statusFilter = ref<string>('all')
const itemsPerPage = ref(10)
const currentPage = ref(1)
const expandedProducts = ref<Set<string>>(new Set())
const selectedLocationId = ref<string | null>(null)
const availableCategories = ref<any[]>([])

// Categories are already imported above

// Fetch products with cache-first strategy
async function fetchProducts() {
  const tenantId = route.params.tenant as string
  const cacheKey = `admin:products:${tenantId}`
  const ttl = 5 * 60 * 1000 // 5 minutes

  // Check cache first
  const cached = useAdminCache().getCached<{ products: any[]; mtSubdomain?: string }>(cacheKey)
  if (cached) {
    // Show cached data immediately
    products.value = cached.products || []
    mtSubdomain.value = cached.mtSubdomain || null
    loading.value = false
  } else {
    // No cache, show loading
    loading.value = true
  }

  error.value = null

  try {
    const data = await fetchWithCache(
      cacheKey,
      async () => {
        const response = await $fetch<{ products: any[]; mtSubdomain?: string }>(`${backendUrl}/admin/${tenantId}/products`, {
          credentials: 'include',
        })
        return {
          products: response.products || [],
          mtSubdomain: response.mtSubdomain || null,
        }
      },
      {
        ttl,
        onBackgroundUpdate: (freshData: { products: any[]; mtSubdomain?: string }) => {
          // Update UI when fresh data arrives
          products.value = freshData.products || []
          mtSubdomain.value = freshData.mtSubdomain || null
          refreshing.value = false
        },
      }
    )

    // Update with fresh data
    products.value = data.products || []
    mtSubdomain.value = data.mtSubdomain || null
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch products'
    // If we have cached data, keep showing it even on error
    if (!cached) {
      products.value = []
    }
  } finally {
    loading.value = false
  }
}

// MT Product Search
async function searchMTProducts(page = 1) {
  try {
    searching.value = true
    const queryParams: any = {
      page: page,
      page_size: mtProductsPageSize.value,
    }
    // Only add query if it's not empty
    if (searchQuery.value.trim()) {
      queryParams.query = searchQuery.value
    }
    
    const response = await $fetch<{ data: any[]; meta?: { pagination?: { count: number; pages: number } } }>(`${backendUrl}/admin/${route.params.tenant}/products/mt/search`, {
      credentials: 'include',
      query: queryParams,
    })
    mtProducts.value = response.data || []
    mtProductsTotal.value = response.meta?.pagination?.count || response.data?.length || 0
    mtProductsPage.value = page
  } catch (err: any) {
    console.error('Error searching MT products:', err)
    mtProducts.value = []
    mtProductsTotal.value = 0
  } finally {
    searching.value = false
  }
}

function openAddModal() {
  showAddModal.value = true
  searchQuery.value = ''
  mtProducts.value = []
  mtProductsPage.value = 1
  mtProductsTotal.value = 0
  // Load first page
  searchMTProducts(1)
}

function closeAddModal() {
  showAddModal.value = false
}

async function selectMTProduct(product: any) {
  const { navigateToProductAdd, navigateToProductEdit, setRouteState } = useAdminNavigation()
  
  try {
    // Check if product already exists locally
    const checkResponse = await $fetch<{ exists: boolean; productId: string | null }>(
      `${backendUrl}/admin/${route.params.tenant}/products/check/${product.id}`,
      {
        credentials: 'include',
      }
    )

    if (checkResponse.exists && checkResponse.productId) {
      // Product exists, navigate to edit page with product data
      // Use MT product ID (product.id) instead of database UUID
      const productData = {
        productName: product.attributes?.title,
        productDescription: product.attributes?.description,
      }
      setRouteState(productData)
      navigateToProductEdit(product.id, productData)
    } else {
      // Product doesn't exist, navigate to add page with product data
      navigateToProductAdd({
        mtProductId: product.id,
        productName: product.attributes?.title,
        productDescription: product.attributes?.description,
      })
    }
  } catch (err: any) {
    console.error('Error checking product existence:', err)
    // On error, default to add page with available data
    navigateToProductAdd({
      mtProductId: product.id,
      productName: product.attributes?.title,
      productDescription: product.attributes?.description,
    })
  }
}


// Computed properties for filtering and pagination
const filteredProducts = computed(() => {
  let filtered = [...products.value]

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product => {
      const name = (product.mtProductName || '').toLowerCase()
      const description = (product.description || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }

  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(product => {
      return product.categories?.some((cat: any) => cat.id === selectedCategory.value)
    })
  }

  // Status filter
  if (statusFilter.value === 'visible') {
    filtered = filtered.filter(product => product.visible === true)
  } else if (statusFilter.value === 'hidden') {
    filtered = filtered.filter(product => product.visible === false)
  }

  // Stock filter (requires variants to be loaded, so we'll show all for now and filter client-side if possible)
  // Note: Stock filtering would require loading all variants, which is expensive
  // For now, we'll skip stock filtering or implement it as a post-filter after variants load

  return filtered
})

const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' || 
         selectedCategory.value !== '' || 
         stockFilter.value !== 'all' || 
         statusFilter.value !== 'all'
})

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * itemsPerPage.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + itemsPerPage.value, filteredProducts.value.length)
})

const paginatedProducts = computed(() => {
  return filteredProducts.value.slice(startIndex.value, endIndex.value)
})

// Functions
function clearFilters() {
  searchQuery.value = ''
  selectedCategory.value = ''
  stockFilter.value = 'all'
  statusFilter.value = 'all'
  currentPage.value = 1
}

function toggleProductExpanded(productId: string, expanded: boolean) {
  if (expanded) {
    expandedProducts.value.add(productId)
  } else {
    expandedProducts.value.delete(productId)
  }
}

function handleEditProduct(product: any) {
  const { navigateToProductEdit, setRouteState } = useAdminNavigation()
  if (product && product.mtProductId) {
    const productData = {
      productName: product.mtProductName,
      productDescription: product.description,
    }
    setRouteState(productData)
    navigateToProductEdit(product.mtProductId, productData)
  }
}

// Watch for filter changes to reset to page 1
watch([searchQuery, selectedCategory, stockFilter, statusFilter], () => {
  currentPage.value = 1
})

// Watch for itemsPerPage changes to reset to page 1
watch(itemsPerPage, () => {
  currentPage.value = 1
})

// Load location and categories
async function loadLocationAndCategories() {
  const tenantId = route.params.tenant as string
  try {
    // Load store settings to get default location
    const storeSettings = await fetchStoreSettings(tenantId)
    selectedLocationId.value = storeSettings.storeInfo.defaultLocationId || null

    // Load categories for filter
    const categories = await fetchCategories(tenantId)
    availableCategories.value = categories || []
  } catch (err: any) {
    console.error('Error loading location/categories:', err)
  }
}

function getFeaturedImage(product: any) {
  return product.images?.find((img: any) => img.isFeatured) || product.images?.[0]
}

function getFullImageUrl(url: string) {
  if (url.startsWith('http')) return url
  return `${backendUrl}${url}`
}

// Check if a product is already added locally
function isProductAdded(mtProductId: string): boolean {
  return products.value.some(p => p.mtProductId === mtProductId)
}

// Menu functions
function handleProductCardClick(productId: string, event: Event) {
  // Don't navigate if clicking on menu
  const target = event.target as HTMLElement
  if (target.closest('.z-10') || target.closest('.z-20')) {
    return
  }
  
  // Find product data to pass along
  const product = products.value.find(p => p.id === productId)
  const { navigateToProductEdit, setRouteState } = useAdminNavigation()
  
  if (product && product.mtProductId) {
    // Use MT product ID instead of database UUID
    const productData = {
      productName: product.mtProductName,
      productDescription: product.description,
    }
    setRouteState(productData)
    navigateToProductEdit(product.mtProductId, productData)
  } else if (product) {
    // Fallback if mtProductId is missing (shouldn't happen, but be safe)
    console.warn('Product missing mtProductId, cannot navigate to edit page')
  }
}

function toggleProductMenu(productId: string) {
  if (openMenuId.value === productId) {
    closeProductMenu()
  } else {
    openMenuId.value = productId
    // Close menu when clicking outside
    nextTick(() => {
      const handler = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest('.z-10') && !target.closest('.z-20')) {
          closeProductMenu()
          document.removeEventListener('click', handler)
        }
      }
      setTimeout(() => {
        document.addEventListener('click', handler)
      }, 0)
    })
  }
}

function closeProductMenu() {
  openMenuId.value = null
}

function editOnMT(product: any) {
  closeProductMenu()
  if (!mtSubdomain.value) {
    alert('Unable to determine Marianatek subdomain')
    return
  }
  const url = `https://${mtSubdomain.value}.marianatek.com/admin/products/variants/edit/${product.mtProductId}/`
  window.open(url, '_blank')
}

function viewOnStore(product: any) {
  closeProductMenu()
  // Placeholder for now
  alert('View on store feature coming soon')
}

async function toggleProductVisibility(product: any) {
  closeProductMenu()
  const newVisible = !product.visible
  
  // Optimistic update - update UI immediately
  const productIndex = products.value.findIndex(p => p.id === product.id)
  if (productIndex !== -1) {
    products.value[productIndex] = {
      ...products.value[productIndex],
      visible: newVisible,
    }
  }

  // Update cache optimistically
  const tenantId = route.params.tenant as string
  const cacheKey = `admin:products:${tenantId}`
  const cached = useAdminCache().getCached<{ products: any[]; mtSubdomain?: string }>(cacheKey)
  if (cached) {
    const updatedProducts = cached.products.map(p => 
      p.id === product.id ? { ...p, visible: newVisible } : p
    )
    useAdminCache().setCache(cacheKey, {
      ...cached,
      products: updatedProducts,
    })
  }

  // Sync in background
  try {
    await $fetch(`${backendUrl}/admin/${tenantId}/products/${product.id}`, {
      method: 'PUT',
      credentials: 'include',
      body: {
        visible: String(newVisible),
      },
    })
    // Refresh cache with fresh data
    invalidate(cacheKey)
    await fetchProducts()
  } catch (err: any) {
    console.error('Error toggling product visibility:', err)
    // Revert optimistic update on error
    if (productIndex !== -1) {
      products.value[productIndex] = {
        ...products.value[productIndex],
        visible: !newVisible,
      }
    }
    alert(err.message || 'Failed to update product visibility')
  }
}

function openDeleteModal(product: any) {
  closeProductMenu()
  productToDelete.value = product
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  productToDelete.value = null
}

async function confirmDelete() {
  if (!productToDelete.value) return

  const productId = productToDelete.value.id
  const tenantId = route.params.tenant as string

  // Optimistic update - remove from UI immediately
  const productIndex = products.value.findIndex(p => p.id === productId)
  const deletedProduct = productToDelete.value
  if (productIndex !== -1) {
    products.value.splice(productIndex, 1)
  }

  // Update cache optimistically
  const cacheKey = `admin:products:${tenantId}`
  const cached = useAdminCache().getCached<{ products: any[]; mtSubdomain?: string }>(cacheKey)
  if (cached) {
    const updatedProducts = cached.products.filter(p => p.id !== productId)
    useAdminCache().setCache(cacheKey, {
      ...cached,
      products: updatedProducts,
    })
  }

  closeDeleteModal()

  // Sync in background
  try {
    deleting.value = true
    await $fetch(`${backendUrl}/admin/${tenantId}/products/${productId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    // Invalidate and refresh cache
    invalidate(cacheKey)
    await fetchProducts()
  } catch (err: any) {
    console.error('Error deleting product:', err)
    // Revert optimistic update on error
    if (productIndex !== -1) {
      products.value.splice(productIndex, 0, deletedProduct)
    }
    alert(err.message || 'Failed to delete product')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    loadLocationAndCategories(),
  ])
})
</script>

