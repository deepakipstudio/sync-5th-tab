<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-admin-text-primary">Products</h1>
        <p class="text-sm text-admin-text-secondary mt-1">Manage your product catalog</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="openSyncModal"
          class="inline-flex items-center gap-2 bg-admin-surface-raised text-admin-text-primary px-4 py-2 rounded-lg hover:bg-admin-surface-hover transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync Products
        </button>
        <button
          @click="openAddModal"
          class="inline-flex items-center gap-2 bg-admin-brand-strong text-admin-text-inverse px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-admin-surface-base rounded-lg border border-admin-border overflow-hidden animate-pulse"
      >
        <!-- Image Skeleton -->
        <div class="aspect-[16/9] bg-admin-surface-raised"></div>
        <!-- Content Skeleton -->
        <div class="p-4 space-y-3">
          <div class="h-5 bg-admin-surface-raised rounded w-3/4"></div>
          <div class="h-3 bg-admin-surface-raised rounded w-1/4"></div>
          <div class="h-4 bg-admin-surface-raised rounded w-full"></div>
          <div class="h-4 bg-admin-surface-raised rounded w-2/3"></div>
          <div class="h-3 bg-admin-surface-raised rounded w-1/3"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-admin-state-danger-soft border border-admin-state-danger-border rounded-lg p-4 text-admin-state-danger-text">
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="products.length === 0" class="bg-admin-surface-base rounded-lg border border-admin-border p-12 text-center">
      <div class="mx-auto w-16 h-16 bg-admin-surface-raised rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-admin-text-primary mb-1">No products yet</h3>
      <p class="text-admin-text-secondary mb-4">Get started by adding your first product from Marianatek.</p>
      <button
        @click="openAddModal"
        class="inline-flex items-center gap-2 bg-admin-brand-strong text-admin-text-inverse px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Product
      </button>
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
          <button
            @click.stop="toggleProductMenu(product.id)"
            class="p-1.5 bg-admin-surface-base/90 backdrop-blur-sm rounded-full hover:bg-admin-surface-base shadow-sm transition-colors"
          >
            <svg class="w-5 h-5 text-admin-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          <!-- Dropdown Menu -->
          <div
            v-if="openMenuId === product.id"
            @click.stop
            class="absolute right-0 mt-1 w-56 bg-admin-surface-base rounded-lg shadow-lg border border-admin-border py-1 z-20"
          >
            <button
              @click.stop="editOnMT(product)"
              class="w-full text-left px-4 py-2 text-sm text-admin-text-primary hover:bg-admin-surface-hover flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit on Mariana Tek
            </button>
            <button
              @click.stop="viewOnStore(product)"
              class="w-full text-left px-4 py-2 text-sm text-admin-text-primary hover:bg-admin-surface-hover flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View on store
            </button>
            <button
              @click.stop="toggleProductVisibility(product)"
              class="w-full text-left px-4 py-2 text-sm text-admin-text-primary hover:bg-admin-surface-hover flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              {{ product.visible ? 'Disable' : 'Enable' }}
            </button>
            <div class="border-t border-admin-border my-1"></div>
            <button
              @click.stop="openDeleteModal(product)"
              class="w-full text-left px-4 py-2 text-sm text-admin-state-danger-text hover:bg-admin-state-danger-soft flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete from Sync
            </button>
          </div>
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
            <span
              :class="[
                'text-xs font-medium px-2 py-0.5 rounded-full',
                product.visible
                  ? 'bg-admin-state-success-soft text-admin-state-success-text'
                  : 'bg-admin-surface-raised text-admin-text-muted'
              ]"
            >
              {{ product.visible ? 'Visible' : 'Hidden' }}
            </span>
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
    <Teleport to="body">
      <div
        v-if="showAddModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="closeAddModal"
      >
        <div class="bg-admin-surface-base rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-admin-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-admin-text-primary">Select Product from Marianatek</h2>
            <button @click="closeAddModal" class="text-admin-text-muted hover:text-admin-text-secondary">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 flex-1 overflow-y-auto">
            <!-- Search -->
            <div class="mb-4">
              <input
                v-model="searchQuery"
                @input="() => searchMTProducts(1)"
                type="text"
                placeholder="Search products..."
                class="w-full px-4 py-2 border border-admin-border rounded-lg focus:ring-2 focus:ring-admin-brand-strong focus:border-admin-border-focus"
              />
            </div>

            <!-- Count and Pagination Info -->
            <div v-if="mtProductsTotal > 0" class="mb-4 flex items-center justify-between text-sm text-admin-text-secondary">
              <span>
                Showing {{ mtProducts.length }} out of {{ mtProductsTotal }} product{{ mtProductsTotal !== 1 ? 's' : '' }}
              </span>
              <div v-if="mtProductsTotal > mtProductsPageSize" class="flex items-center gap-2">
                <button
                  @click="searchMTProducts(mtProductsPage - 1)"
                  :disabled="mtProductsPage <= 1 || searching"
                  class="px-3 py-1 border border-admin-border rounded hover:bg-admin-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span class="text-admin-text-primary">
                  Page {{ mtProductsPage }} of {{ Math.ceil(mtProductsTotal / mtProductsPageSize) }}
                </span>
                <button
                  @click="searchMTProducts(mtProductsPage + 1)"
                  :disabled="mtProductsPage >= Math.ceil(mtProductsTotal / mtProductsPageSize) || searching"
                  class="px-3 py-1 border border-admin-border rounded hover:bg-admin-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
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
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-state-success-soft text-admin-state-success-text">
                      Added
                    </span>
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
      </div>
    </Teleport>

    <!-- Sync Products Modal -->
    <Teleport to="body">
      <div
        v-if="showSyncModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="closeSyncModal"
      >
        <div class="bg-admin-surface-base rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-admin-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-admin-text-primary">Sync Products</h2>
            <button @click="closeSyncModal" class="text-admin-text-muted hover:text-admin-text-secondary">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 flex-1 overflow-y-auto">
            <p class="text-sm text-admin-text-secondary mb-4">
              Select products to sync from Marianatek. This will update variants, add new ones, and mark deleted variants.
            </p>

            <!-- Product Selection -->
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  @change="toggleAllProducts"
                  class="rounded border-admin-border text-admin-brand-strong focus:ring-admin-brand-strong"
                />
                <label class="text-sm font-medium text-admin-text-primary">Select All</label>
              </div>
              <div
                v-for="product in products"
                :key="product.id"
                class="flex items-center gap-2 p-3 border border-admin-border rounded-lg"
              >
                <input
                  type="checkbox"
                  :checked="selectedProducts.includes(product.id)"
                  @change="toggleProduct(product.id)"
                  class="rounded border-admin-border text-admin-brand-strong focus:ring-admin-brand-strong"
                />
                <label class="flex-1 text-sm text-admin-text-primary cursor-pointer">
                  Product #{{ product.mtProductId }} ({{ product.variants?.length || 0 }} variants)
                </label>
              </div>
            </div>

            <!-- Sync Button -->
            <button
              @click="performSync"
              :disabled="syncing || selectedProducts.length === 0"
              class="w-full bg-admin-brand-strong text-admin-text-inverse px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="syncing">Syncing...</span>
              <span v-else>Sync Now ({{ selectedProducts.length }} product{{ selectedProducts.length !== 1 ? 's' : '' }})</span>
            </button>

            <!-- Sync Results -->
            <div v-if="syncResult" class="mt-4 p-4 bg-admin-surface-raised rounded-lg">
              <h3 class="font-medium text-admin-text-primary mb-2">Sync Results</h3>
              <div class="space-y-1 text-sm text-admin-text-secondary">
                <p>Products synced: {{ syncResult.summary.synced }}</p>
                <p>New variants: {{ syncResult.summary.newVariants }}</p>
                <p>Updated variants: {{ syncResult.summary.updatedVariants }}</p>
                <p>Deleted variants: {{ syncResult.summary.deletedVariants }}</p>
                <p v-if="syncResult.summary.errors.length > 0" class="text-admin-state-danger-text mt-2">
                  Errors: {{ syncResult.summary.errors.join(', ') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="closeDeleteModal"
      >
        <div class="bg-admin-surface-base rounded-xl shadow-xl w-full max-w-md">
          <div class="p-6">
            <div class="mx-auto w-12 h-12 bg-admin-state-danger-soft rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-admin-state-danger-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-admin-text-primary text-center mb-2">Delete from Sync</h3>
            <p class="text-admin-text-secondary text-center mb-4">
              Are you sure you want to delete <strong>{{ productToDelete?.mtProductName || `Product #${productToDelete?.mtProductId}` }}</strong> from Sync?
            </p>
            <div class="bg-admin-state-warning-soft border border-admin-state-warning-border rounded-lg p-3 mb-6">
              <p class="text-sm text-admin-state-warning-text">
                <strong>Note:</strong> Deleting on Sync won't delete this product from Mariana Tek. To delete this product completely, delete it from your Mariana Tek account.
              </p>
            </div>
            <div class="flex gap-3">
              <button
                @click="closeDeleteModal"
                class="flex-1 bg-admin-surface-raised text-admin-text-primary px-4 py-2 rounded-lg hover:bg-admin-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                @click="confirmDelete"
                :disabled="deleting"
                class="flex-1 bg-admin-state-danger-text text-admin-text-inverse px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ deleting ? 'Deleting...' : 'Delete from Sync' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const config = useRuntimeConfig()
const backendUrl = config.public.backendUrl

const loading = ref(true)
const error = ref<string | null>(null)
const products = ref<any[]>([])
const mtSubdomain = ref<string | null>(null)

const showAddModal = ref(false)
const showSyncModal = ref(false)
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
const selectedProducts = ref<string[]>([])
const syncing = ref(false)
const syncResult = ref<any>(null)

// Fetch products
async function fetchProducts() {
  try {
    loading.value = true
    error.value = null
    const response = await $fetch<{ products: any[]; mtSubdomain?: string }>(`${backendUrl}/admin/${route.params.tenant}/products`, {
      credentials: 'include',
    })
    products.value = response.products || []
    mtSubdomain.value = response.mtSubdomain || null
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch products'
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
  try {
    // Check if product already exists locally
    const checkResponse = await $fetch<{ exists: boolean; productId: string | null }>(
      `${backendUrl}/admin/${route.params.tenant}/products/check/${product.id}`,
      {
        credentials: 'include',
      }
    )

    if (checkResponse.exists && checkResponse.productId) {
      // Product exists, navigate to edit page
      navigateTo(`/admin/${route.params.tenant}/products/edit/${checkResponse.productId}`)
    } else {
      // Product doesn't exist, navigate to add page
      navigateTo(`/admin/${route.params.tenant}/products/add?mtProductId=${product.id}`)
    }
  } catch (err: any) {
    console.error('Error checking product existence:', err)
    // On error, default to add page
    navigateTo(`/admin/${route.params.tenant}/products/add?mtProductId=${product.id}`)
  }
}

// Sync Modal
function openSyncModal() {
  showSyncModal.value = true
  selectedProducts.value = products.value.map(p => p.id)
  syncResult.value = null
}

function closeSyncModal() {
  showSyncModal.value = false
  selectedProducts.value = []
  syncResult.value = null
}

const allSelected = computed(() => {
  return products.value.length > 0 && selectedProducts.value.length === products.value.length
})

function toggleAllProducts() {
  if (allSelected.value) {
    selectedProducts.value = []
  } else {
    selectedProducts.value = products.value.map(p => p.id)
  }
}

function toggleProduct(productId: string) {
  const index = selectedProducts.value.indexOf(productId)
  if (index > -1) {
    selectedProducts.value.splice(index, 1)
  } else {
    selectedProducts.value.push(productId)
  }
}

async function performSync() {
  try {
    syncing.value = true
    syncResult.value = null
    const response = await $fetch<{ summary: any }>(`${backendUrl}/admin/${route.params.tenant}/products/sync`, {
      method: 'POST',
      credentials: 'include',
      body: {
        productIds: selectedProducts.value,
      },
    })
    syncResult.value = response
    // Refresh products after sync
    await fetchProducts()
  } catch (err: any) {
    console.error('Error syncing products:', err)
    syncResult.value = {
      summary: {
        synced: 0,
        newVariants: 0,
        updatedVariants: 0,
        deletedVariants: 0,
        errors: [err.message || 'Failed to sync products'],
      },
    }
  } finally {
    syncing.value = false
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
  navigateTo(`/admin/${route.params.tenant}/products/edit/${productId}`)
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
  try {
    await $fetch(`${backendUrl}/admin/${route.params.tenant}/products/${product.id}`, {
      method: 'PUT',
      credentials: 'include',
      body: {
        visible: String(newVisible),
      },
    })
    // Update only the affected product in the list
    const productIndex = products.value.findIndex(p => p.id === product.id)
    if (productIndex !== -1) {
      products.value[productIndex] = {
        ...products.value[productIndex],
        visible: newVisible,
      }
    }
  } catch (err: any) {
    console.error('Error toggling product visibility:', err)
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

  try {
    deleting.value = true
    await $fetch(`${backendUrl}/admin/${route.params.tenant}/products/${productToDelete.value.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    closeDeleteModal()
    // Refresh products list
    await fetchProducts()
  } catch (err: any) {
    console.error('Error deleting product:', err)
    alert(err.message || 'Failed to delete product')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

