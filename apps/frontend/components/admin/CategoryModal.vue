<template>
  <UiDialog :open="open" @update:open="(value) => $emit('update:open', value)" class="max-w-2xl">
    <UiDialogTitle class="sr-only">{{ editingCategory ? 'Edit Category' : 'Add Category' }}</UiDialogTitle>
    <div class="flex flex-col max-h-[90vh]">
      <div class="px-6 py-4 border-b border-admin-border flex items-center justify-between">
        <h2 class="text-lg font-semibold text-admin-text-primary">
          {{ editingCategory ? 'Edit Category' : 'Add Category' }}
        </h2>
        <UiDialogClose as-child>
          <UiButton variant="ghost" size="icon" class="text-admin-text-muted hover:text-admin-text-secondary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </UiButton>
        </UiDialogClose>
      </div>

      <div class="p-6 flex-1 overflow-y-auto space-y-6">
        <!-- Slug Collision Feedback -->
        <UiAlert v-if="slugWasAutoModified" variant="warning">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p class="font-medium mb-1">Slug was auto-modified</p>
              <p class="text-sm">The slug "{{ form.slug }}" was automatically adjusted to ensure uniqueness. You can manually edit it if needed.</p>
            </div>
          </div>
        </UiAlert>

        <!-- Name -->
        <div>
          <UiLabel for="category-name" class="block mb-1">Name *</UiLabel>
          <UiInput
            id="category-name"
            v-model="form.name"
            type="text"
            placeholder="Category name"
            class="w-full"
            @input="generateSlugFromName"
          />
        </div>

        <!-- Slug -->
        <div>
          <UiLabel for="category-slug" class="block mb-1">Slug</UiLabel>
          <UiInput
            id="category-slug"
            v-model="form.slug"
            type="text"
            placeholder="category-slug"
            class="w-full"
          />
          <p class="text-xs text-admin-text-secondary mt-1">URL-friendly identifier (auto-generated from name)</p>
        </div>

        <!-- Description -->
        <div>
          <UiLabel for="category-description" class="block mb-1">Description</UiLabel>
          <UiTextarea
            id="category-description"
            v-model="form.description"
            rows="3"
            placeholder="Category description..."
            class="w-full"
          />
        </div>

        <!-- Sort Order -->
        <div>
          <UiLabel for="category-sort-order" class="block mb-1">Sort Order</UiLabel>
          <UiInput
            id="category-sort-order"
            v-model.number="form.sortOrder"
            type="number"
            placeholder="0"
            class="w-full"
          />
          <p class="text-xs text-admin-text-secondary mt-1">Lower numbers appear first</p>
        </div>

        <!-- Image Upload -->
        <div>
          <UiLabel class="block mb-2">Category Image</UiLabel>
          <div
            class="flex justify-center px-6 pt-5 pb-6 border-2 border-admin-border border-dashed rounded-md cursor-pointer hover:border-admin-brand-strong transition-colors"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
            @click="() => imageInput?.click()"
            :class="{ 'border-admin-brand-strong bg-admin-surface-hover': isDragging }"
          >
            <div class="space-y-1 text-center">
              <svg
                v-if="!imagePreview"
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
              <img
                v-else
                :src="imagePreview"
                alt="Category image preview"
                class="mx-auto h-32 w-32 object-cover rounded-lg"
              />
              <div v-if="!imagePreview" class="flex text-sm text-admin-text-secondary">
                <label class="relative cursor-pointer rounded-md font-medium text-admin-text-primary hover:text-admin-brand-strong">
                  <span>Upload image</span>
                  <input
                    ref="imageInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    class="sr-only"
                    @change="handleFileSelect"
                  />
                </label>
                <p class="pl-1">or drag and drop</p>
              </div>
              <div v-else class="flex items-center justify-center gap-2">
                <UiButton
                  type="button"
                  @click.stop="removeImage"
                  variant="secondary"
                  size="sm"
                >
                  Remove Image
                </UiButton>
              </div>
              <p class="text-xs text-admin-text-secondary">PNG, JPG, GIF, WebP up to 2MB</p>
            </div>
          </div>
        </div>

        <!-- Product Assignment (Multi-select) -->
        <div>
          <UiLabel class="block mb-2">Assign Products</UiLabel>
          <div class="border border-admin-border rounded-lg p-3 max-h-48 overflow-y-auto">
            <div v-if="loadingProducts" class="text-sm text-admin-text-secondary text-center py-4">
              Loading products...
            </div>
            <div v-else-if="availableProducts.length === 0" class="text-sm text-admin-text-secondary text-center py-4">
              No products available
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="product in availableProducts"
                :key="product.id"
                class="flex items-center gap-2"
              >
                <UiCheckbox
                  :checked="selectedProductIds.includes(product.id)"
                  @update:checked="(checked) => toggleProduct(product.id, checked)"
                />
                <UiLabel class="text-sm cursor-pointer flex-1">
                  {{ product.mtProductName || `Product #${product.mtProductId}` }}
                </UiLabel>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <UiAlert v-if="error" variant="error">
          {{ error }}
        </UiAlert>
      </div>

      <div class="px-6 py-4 border-t border-admin-border flex gap-3">
        <UiButton
          @click="$emit('update:open', false)"
          variant="secondary"
          class="flex-1"
        >
          Cancel
        </UiButton>
        <UiButton
          @click="handleSave"
          :disabled="saving || !form.name"
          variant="default"
          class="flex-1"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </UiButton>
      </div>
    </div>
  </UiDialog>
</template>

<script setup lang="ts">
import { generateSlug } from '~/utils/slug'
import type { Category } from '~/composables/useCategory'

interface Props {
  open: boolean
  category?: Category | null
  tenantId: string
}

const props = withDefaults(defineProps<Props>(), {
  category: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const config = useRuntimeConfig()
const backendUrl = config.public.backendUrl
const { createCategory, updateCategory } = useCategory()

const editingCategory = computed(() => !!props.category)

const form = ref({
  name: '',
  description: '',
  slug: '',
  sortOrder: null as number | null,
})

const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const slugWasAutoModified = ref(false)

const availableProducts = ref<any[]>([])
const selectedProductIds = ref<string[]>([])
const loadingProducts = ref(false)

// Initialize form from category prop
watch(() => props.category, (category) => {
  if (category) {
    form.value = {
      name: category.name,
      description: category.description || '',
      slug: category.slug,
      sortOrder: category.sortOrder,
    }
    imagePreview.value = category.imageUrl
    imageFile.value = null
    selectedProductIds.value = []
    // Load existing product assignments when category is set
    if (props.open) {
      loadProductAssignments()
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Load products for assignment
async function loadProducts() {
  loadingProducts.value = true
  try {
    const response = await $fetch<{ products: any[] }>(`${backendUrl}/admin/${props.tenantId}/products`, {
      credentials: 'include',
    })
    availableProducts.value = response.products || []
  } catch (e: any) {
    console.error('Error loading products:', e)
    availableProducts.value = []
  } finally {
    loadingProducts.value = false
  }
}

// Load existing product assignments for editing
async function loadProductAssignments() {
  if (!props.category) return
  
  try {
    const response = await $fetch<{ category: Category & { products?: any[] } }>(
      `${backendUrl}/admin/${props.tenantId}/categories/${props.category.id}`,
      { credentials: 'include' }
    )
    if (response.category.products) {
      selectedProductIds.value = response.category.products.map((p: any) => p.id)
    }
  } catch (e: any) {
    console.error('Error loading product assignments:', e)
  }
}

function generateSlugFromName() {
  if (form.value.name && !form.value.slug) {
    form.value.slug = generateSlug(form.value.name)
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.size > 2 * 1024 * 1024) {
      error.value = 'File size must be less than 2MB'
      return
    }
    imageFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
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
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    if (file.size > 2 * 1024 * 1024) {
      error.value = 'File size must be less than 2MB'
      return
    }
    imageFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function removeImage() {
  imageFile.value = null
  imagePreview.value = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

function toggleProduct(productId: string, checked: boolean) {
  if (checked) {
    if (!selectedProductIds.value.includes(productId)) {
      selectedProductIds.value.push(productId)
    }
  } else {
    const index = selectedProductIds.value.indexOf(productId)
    if (index > -1) {
      selectedProductIds.value.splice(index, 1)
    }
  }
}

function resetForm() {
  form.value = {
    name: '',
    description: '',
    slug: '',
    sortOrder: null,
  }
  imageFile.value = null
  imagePreview.value = null
  selectedProductIds.value = []
  error.value = null
  slugWasAutoModified.value = false
}

async function handleSave() {
  if (!form.value.name) {
    error.value = 'Name is required'
    return
  }

  saving.value = true
  error.value = null
  slugWasAutoModified.value = false

  try {
    const categoryData = {
      name: form.value.name,
      description: form.value.description || undefined,
      slug: form.value.slug || undefined,
      sortOrder: form.value.sortOrder || undefined,
      image: imageFile.value || undefined,
    }

    let result
    if (editingCategory.value && props.category) {
      result = await updateCategory(props.tenantId, props.category.id, categoryData)
    } else {
      result = await createCategory(props.tenantId, categoryData)
    }

    slugWasAutoModified.value = result.slugWasAutoModified

    // Update product assignments (for both create and update)
    if (result.category.id) {
      await updateProductAssignments(result.category.id)
    }

    // Reset form and close modal
    resetForm()
    emit('update:open', false)
    emit('saved')
  } catch (e: any) {
    error.value = e.data?.error || e.message || 'Failed to save category'
  } finally {
    saving.value = false
  }
}

async function updateProductAssignments(categoryId: string) {
  try {
    // Get current product assignments
    const currentResponse = await $fetch<{ category: Category & { products?: any[] } }>(
      `${backendUrl}/admin/${props.tenantId}/categories/${categoryId}`,
      { credentials: 'include' }
    )
    const currentProductIds = currentResponse.category.products?.map((p: any) => p.id) || []
    
    // Find products to add and remove
    const toAdd = selectedProductIds.value.filter(id => !currentProductIds.includes(id))
    const toRemove = currentProductIds.filter(id => !selectedProductIds.value.includes(id))
    
    // Add new assignments
    if (toAdd.length > 0) {
      await $fetch(`${backendUrl}/admin/${props.tenantId}/categories/${categoryId}/products`, {
        method: 'POST',
        credentials: 'include',
        body: { productIds: toAdd },
      })
    }
    
    // Remove old assignments
    for (const productId of toRemove) {
      await $fetch(`${backendUrl}/admin/${props.tenantId}/categories/${categoryId}/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
    }
  } catch (e: any) {
    console.error('Error updating product assignments:', e)
    // Don't throw - category was saved successfully
  }
}

// Load products when modal opens
watch(() => props.open, (open) => {
  if (open) {
    loadProducts()
    if (editingCategory.value) {
      loadProductAssignments()
    }
  } else {
    resetForm()
  }
})
</script>

