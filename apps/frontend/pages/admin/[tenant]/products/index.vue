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

    <!-- Loading State -->
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-admin-surface-base rounded-lg border border-admin-border overflow-hidden"
      >
        <!-- Image Skeleton -->
        <UiSkeleton class="aspect-[16/9] w-full" />
        <!-- Content Skeleton -->
        <div class="p-4 space-y-3">
          <UiSkeleton class="h-5 w-3/4" />
          <UiSkeleton class="h-3 w-1/4" />
          <UiSkeleton class="h-4 w-full" />
          <UiSkeleton class="h-4 w-2/3" />
          <UiSkeleton class="h-3 w-1/3" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <UiAlert v-else-if="error" variant="error">
      {{ error }}
    </UiAlert>

    <!-- Empty State -->
    <div v-else-if="products.length === 0" class="bg-admin-surface-base rounded-lg border border-admin-border p-12 text-center">
      <div class="mx-auto w-16 h-16 bg-admin-surface-raised rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-admin-text-primary mb-1">No products yet</h3>
      <p class="text-admin-text-secondary mb-4">Get started by adding your first product from Marianatek.</p>
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

    <!-- Products Grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="product in products"
        :key="product.id"
        class="bg-admin-surface-base rounded-lg border border-admin-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative"
        @click="handleProductCardClick(product.id, $event)"
      >
        <!-- Three-dot Menu -->
        <div class="absolute top-2 right-2 z-10">
          <UiDropdownMenu
            :open="openMenuId === product.id"
            @update:open="(value) => { if (value) toggleProductMenu(product.id); else closeProductMenu() }"
          >
            <template #trigger>
              <UiButton
                variant="ghost"
                size="icon"
                class="p-1.5 bg-admin-surface-base/90 backdrop-blur-sm rounded-full hover:bg-admin-surface-base shadow-sm"
              >
                <svg class="w-5 h-5 text-admin-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </UiButton>
            </template>
            <UiDropdownMenuItem @click.stop="editOnMT(product)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit on Mariana Tek
            </UiDropdownMenuItem>
            <UiDropdownMenuItem @click.stop="viewOnStore(product)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View on store
            </UiDropdownMenuItem>
            <UiDropdownMenuItem @click.stop="toggleProductVisibility(product)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              {{ product.visible ? 'Disable' : 'Enable' }}
            </UiDropdownMenuItem>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem @click.stop="openDeleteModal(product)" class="text-admin-state-danger-text hover:bg-admin-state-danger-soft">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete from Sync
            </UiDropdownMenuItem>
          </UiDropdownMenu>
        </div>

        <!-- Image Preview -->
        <div class="aspect-[16/9] bg-admin-surface-raised relative">
          <img
            v-if="getFeaturedImage(product)"
            :src="getFullImageUrl(getFeaturedImage(product)!.imageUrl)"
            :alt="`Product ${product.id}`"
            class="w-full h-full object-cover"
            @error="(e: Event) => (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23d1d5db%22%3E%3Cpath d=%22M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4%22/%3E%3C/svg%3E'"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="w-12 h-12 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <!-- Status Badge -->
          <div class="absolute top-2 left-2">
            <UiBadge :variant="product.visible ? 'success' : 'default'">
              {{ product.visible ? 'Visible' : 'Hidden' }}
            </UiBadge>
          </div>
        </div>

        <!-- Details -->
        <div class="p-4">
          <h3 class="font-medium text-admin-text-primary mb-1 line-clamp-2">
            {{ product.mtProductName || `Product #${product.mtProductId}` }}
          </h3>
          <p class="text-xs text-admin-text-secondary mb-1">ID: {{ product.mtProductId }}</p>
          <p v-if="product.description" class="text-sm text-admin-text-secondary line-clamp-2 mb-2">
            {{ product.description }}
          </p>
          <div class="text-xs text-admin-text-secondary">
            {{ product.variants?.length || 0 }} variant{{ (product.variants?.length || 0) !== 1 ? 's' : '' }}
          </div>
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

onMounted(() => {
  fetchProducts()
})
</script>

