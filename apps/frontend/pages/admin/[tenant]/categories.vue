<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold text-admin-text-primary">Categories</h1>
        <p class="text-sm text-admin-text-secondary mt-2">Organize your products with categories</p>
      </div>
      <UiButton
        @click="openCategoryModal"
        variant="default"
        class="inline-flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Category
      </UiButton>
    </div>

    <!-- Empty State -->
    <div v-if="!loadingCategories && categories.length === 0" class="bg-admin-surface-base rounded-lg border border-admin-border p-12 text-center">
      <div class="mx-auto w-16 h-16 bg-admin-surface-raised rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-admin-text-primary mb-1">No categories yet</h3>
      <p class="text-admin-text-secondary mb-4">Add your first category to organize your products.</p>
      <UiButton
        @click="openCategoryModal"
        variant="default"
        class="inline-flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Category
      </UiButton>
    </div>

    <!-- Categories Grid -->
    <div v-else-if="!loadingCategories" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="category in categories"
        :key="category.id"
        class="bg-admin-surface-base rounded-lg border border-admin-border overflow-hidden hover:shadow-md transition-shadow relative group"
      >
        <!-- Three-dot Menu -->
        <div class="absolute top-2 right-2 z-10">
          <UiDropdownMenu
            :open="openCategoryMenuId === category.id"
            @update:open="(value) => { if (value) toggleCategoryMenu(category.id); else closeCategoryMenu() }"
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
            <UiDropdownMenuItem @click.stop="editCategory(category)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </UiDropdownMenuItem>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem @click.stop="openDeleteCategoryModal(category)" class="text-admin-state-danger-text hover:bg-admin-state-danger-soft">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </UiDropdownMenuItem>
          </UiDropdownMenu>
        </div>

        <!-- Image Thumbnail -->
        <div class="aspect-[16/9] bg-admin-surface-raised relative">
          <img
            v-if="category.imageUrl"
            :src="getFullImageUrl(category.imageUrl)"
            :alt="category.name"
            class="w-full h-full object-cover"
            @error="(e: Event) => (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23d1d5db%22%3E%3Cpath d=%22M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z%22/%3E%3C/svg%3E'"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="w-12 h-12 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>

        <!-- Details -->
        <div class="p-4">
          <h3 class="font-medium text-admin-text-primary mb-1 line-clamp-2">
            {{ category.name }}
          </h3>
          <p v-if="category.description" class="text-sm text-admin-text-secondary line-clamp-2 mb-2">
            {{ category.description }}
          </p>
          <div class="text-xs text-admin-text-secondary">
            {{ category.productCount || 0 }} product{{ (category.productCount || 0) !== 1 ? 's' : '' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Categories Loading State -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-admin-surface-base rounded-lg border border-admin-border overflow-hidden"
      >
        <UiSkeleton class="aspect-[16/9] w-full" />
        <div class="p-4 space-y-3">
          <UiSkeleton class="h-5 w-3/4" />
          <UiSkeleton class="h-3 w-1/4" />
        </div>
      </div>
    </div>

    <!-- Category Modal -->
    <AdminCategoryModal
      :open="showCategoryModal"
      :category="editingCategory"
      :tenant-id="route.params.tenant as string"
      @update:open="(value) => { if (!value) closeCategoryModal() }"
      @saved="handleCategorySaved"
    />

    <!-- Delete Category Confirmation Modal -->
    <UiDialog :open="showDeleteCategoryModal" @update:open="(value) => { if (!value) closeDeleteCategoryModal() }" class="max-w-md">
      <div class="p-6">
        <div class="mx-auto w-12 h-12 bg-admin-state-danger-soft rounded-full flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-admin-state-danger-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <UiDialogTitle class="text-lg font-semibold text-admin-text-primary text-center mb-2">Delete Category</UiDialogTitle>
        <UiDialogDescription class="text-admin-text-secondary text-center mb-4">
          Are you sure you want to delete <strong>{{ categoryToDelete?.name }}</strong>? This will unlink all products from this category.
        </UiDialogDescription>
        <div class="flex gap-3">
          <UiButton
            @click="closeDeleteCategoryModal"
            variant="secondary"
            class="flex-1"
          >
            Cancel
          </UiButton>
          <UiButton
            @click="confirmDeleteCategory"
            :disabled="deletingCategory"
            variant="danger"
            class="flex-1"
          >
            {{ deletingCategory ? 'Deleting...' : 'Delete' }}
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
const { fetchCategories, deleteCategory } = useCategory()
const { invalidate } = useAdminCache()

const categories = ref<any[]>([])
const loadingCategories = ref(false)
const showCategoryModal = ref(false)
const editingCategory = ref<any>(null)
const openCategoryMenuId = ref<string | null>(null)
const showDeleteCategoryModal = ref(false)
const categoryToDelete = ref<any>(null)
const deletingCategory = ref(false)

// Category management functions
async function loadCategories() {
  loadingCategories.value = true
  try {
    const tenantId = route.params.tenant as string
    categories.value = await fetchCategories(tenantId)
  } catch (err: any) {
    console.error('Error fetching categories:', err)
    categories.value = []
  } finally {
    loadingCategories.value = false
  }
}

function openCategoryModal(category?: any) {
  editingCategory.value = category || null
  showCategoryModal.value = true
}

function closeCategoryModal() {
  showCategoryModal.value = false
  editingCategory.value = null
}

function editCategory(category: any) {
  closeCategoryMenu()
  openCategoryModal(category)
}

function toggleCategoryMenu(categoryId: string) {
  if (openCategoryMenuId.value === categoryId) {
    closeCategoryMenu()
  } else {
    openCategoryMenuId.value = categoryId
    nextTick(() => {
      const handler = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest('.z-10') && !target.closest('.z-20')) {
          closeCategoryMenu()
          document.removeEventListener('click', handler)
        }
      }
      setTimeout(() => {
        document.addEventListener('click', handler)
      }, 0)
    })
  }
}

function closeCategoryMenu() {
  openCategoryMenuId.value = null
}

function openDeleteCategoryModal(category: any) {
  closeCategoryMenu()
  categoryToDelete.value = category
  showDeleteCategoryModal.value = true
}

function closeDeleteCategoryModal() {
  showDeleteCategoryModal.value = false
  categoryToDelete.value = null
}

async function confirmDeleteCategory() {
  if (!categoryToDelete.value) return

  const categoryId = categoryToDelete.value.id
  const tenantId = route.params.tenant as string

  deletingCategory.value = true
  try {
    await deleteCategory(tenantId, categoryId, false)
    // Invalidate cache and refresh
    invalidate(`admin:categories:${tenantId}`)
    await loadCategories()
    closeDeleteCategoryModal()
  } catch (err: any) {
    console.error('Error deleting category:', err)
    alert(err.message || 'Failed to delete category')
  } finally {
    deletingCategory.value = false
  }
}

function handleCategorySaved() {
  const tenantId = route.params.tenant as string
  invalidate(`admin:categories:${tenantId}`)
  loadCategories()
}

function getFullImageUrl(url: string) {
  if (url.startsWith('http')) return url
  return `${backendUrl}${url}`
}

onMounted(() => {
  loadCategories()
})
</script>


