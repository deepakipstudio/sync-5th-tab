<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Banners</h1>
        <p class="text-sm text-gray-500 mt-1">Manage promotional banners for your shop</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Banner
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="banners.length === 0" class="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-1">No banners yet</h3>
      <p class="text-gray-500 mb-4">Get started by creating your first promotional banner.</p>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Banner
      </button>
    </div>

    <!-- Banners Grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="banner in banners"
        :key="banner.id"
        class="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        <!-- Image Preview -->
        <div class="aspect-[16/9] bg-gray-100 relative">
          <img
            v-if="banner.imageUrl"
            :src="getFullImageUrl(banner.imageUrl)"
            :alt="`Banner ${banner.id}`"
            class="w-full h-full object-cover"
            @error="(e: Event) => (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23d1d5db%22%3E%3Cpath d=%22M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z%22/%3E%3C/svg%3E'"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <!-- Status Badges -->
          <div class="absolute top-2 left-2 flex gap-1.5">
            <span
              :class="[
                'text-xs font-medium px-2 py-0.5 rounded-full',
                banner.visible
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ banner.visible ? 'Visible' : 'Hidden' }}
            </span>
            <span
              v-if="isExpired(banner.expiresAt)"
              class="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"
            >
              Expired
            </span>
          </div>
        </div>

        <!-- Details -->
        <div class="p-4">
          <div class="text-sm text-gray-600 space-y-1 mb-3">
            <p v-if="banner.collectionId">
              <span class="text-gray-400">Collection:</span> {{ banner.collectionId }}
            </p>
            <p v-if="banner.productClass">
              <span class="text-gray-400">Product Class:</span> {{ banner.productClass }}
            </p>
            <p v-if="banner.expiresAt">
              <span class="text-gray-400">Expires:</span> {{ formatDate(banner.expiresAt) }}
            </p>
            <p v-if="banner.sortOrder !== null">
              <span class="text-gray-400">Sort Order:</span> {{ banner.sortOrder }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-3 border-t border-gray-100">
            <button
              @click="openEditModal(banner)"
              class="flex-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors"
            >
              Edit
            </button>
            <button
              @click="confirmDelete(banner)"
              class="text-sm text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">
              {{ editingBanner ? 'Edit Banner' : 'Create Banner' }}
            </h2>
          </div>

          <form @submit.prevent="saveBanner" class="p-6 space-y-4">
            <!-- Image Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Banner Image <span v-if="!editingBanner" class="text-red-500">*</span>
              </label>
              
              <!-- Drop Zone -->
              <div
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                @click="triggerFileInput"
                :class="[
                  'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                  isDragging 
                    ? 'border-gray-900 bg-gray-50' 
                    : 'border-gray-300 hover:border-gray-400'
                ]"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="hidden"
                  @change="handleFileSelect"
                />
                
                <!-- Preview or Upload Icon -->
                <div v-if="imagePreview" class="space-y-3">
                  <img
                    :src="imagePreview"
                    alt="Preview"
                    class="mx-auto max-h-40 rounded-lg object-contain"
                  />
                  <p class="text-sm text-gray-600">
                    {{ selectedFile?.name || 'Current image' }}
                    <span v-if="selectedFile" class="text-gray-400">
                      ({{ formatFileSize(selectedFile.size) }})
                    </span>
                  </p>
                  <button
                    type="button"
                    @click.stop="clearImage"
                    class="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div v-else class="space-y-2">
                  <svg class="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p class="text-sm text-gray-600">
                    <span class="font-medium text-gray-900">Click to upload</span> or drag and drop
                  </p>
                </div>
              </div>
              
              <!-- Guidelines -->
              <div class="mt-2 text-xs text-gray-500 space-y-0.5">
                <p>Recommended size: 1920 x 640 pixels (3:1 aspect ratio)</p>
                <p>Maximum file size: 2MB</p>
                <p>Supported formats: JPG, PNG, WebP, GIF</p>
              </div>
            </div>

            <!-- Collection ID -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Collection ID
              </label>
              <input
                v-model.number="form.collectionId"
                type="number"
                placeholder="Optional - Link to a product collection"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>

            <!-- Product Class -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Product Class
              </label>
              <input
                v-model="form.productClass"
                type="text"
                placeholder="Optional - e.g. membership, retail"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>

            <!-- Expires At -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <input
                v-model="form.expiresAt"
                type="datetime-local"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>

            <!-- Sort Order -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                v-model.number="form.sortOrder"
                type="number"
                placeholder="Lower numbers appear first"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>

            <!-- Visible Toggle -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="form.visible = !form.visible"
                :class="[
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2',
                  form.visible ? 'bg-gray-900' : 'bg-gray-200'
                ]"
              >
                <span
                  :class="[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    form.visible ? 'translate-x-5' : 'translate-x-0'
                  ]"
                />
              </button>
              <label class="text-sm font-medium text-gray-700">
                {{ form.visible ? 'Visible to customers' : 'Hidden from customers' }}
              </label>
            </div>

            <!-- Form Error -->
            <div v-if="formError" class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {{ formError }}
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? 'Saving...' : (editingBanner ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="showDeleteModal = false"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div class="p-6">
            <div class="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">Delete Banner</h3>
            <p class="text-gray-500 text-center mb-6">
              Are you sure you want to delete this banner? This action cannot be undone.
            </p>
            <div class="flex gap-3">
              <button
                @click="showDeleteModal = false"
                class="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="deleteBanner"
                :disabled="deleting"
                class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {{ deleting ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="toast.show"
          :class="[
            'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50',
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          ]"
        >
          <svg v-if="toast.type === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

interface Banner {
  id: string
  imageUrl: string
  filename?: string
  originalName?: string
  collectionId: number | null
  productClass: string | null
  expiresAt: string | null
  sortOrder: number | null
  visible: boolean
  createdAt: string
}

const route = useRoute()
const config = useRuntimeConfig()

const tenantId = computed(() => route.params.tenant as string)

// State
const banners = ref<Banner[]>([])
const loading = ref(true)
const error = ref('')

// Modal state
const showModal = ref(false)
const editingBanner = ref<Banner | null>(null)
const saving = ref(false)
const formError = ref('')

// File upload state
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const isDragging = ref(false)

// Form state
const form = ref({
  collectionId: null as number | null,
  productClass: '',
  expiresAt: '',
  sortOrder: null as number | null,
  visible: true,
})

// Delete state
const showDeleteModal = ref(false)
const bannerToDelete = ref<Banner | null>(null)
const deleting = ref(false)

// Toast state
const toast = ref({
  show: false,
  type: 'success' as 'success' | 'error',
  message: '',
})

// Get full image URL (backend serves from /uploads)
function getFullImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith('http')) return imageUrl
  return `${config.public.backendUrl}${imageUrl}`
}

// Fetch banners
async function fetchBanners() {
  loading.value = true
  error.value = ''
  
  try {
    const data = await $fetch<{ banners: Banner[] }>(`/admin/${tenantId.value}/banners`, {
      baseURL: config.public.backendUrl,
      credentials: 'include',
    })
    banners.value = data.banners
  } catch (e: any) {
    error.value = e.data?.error || e.message || 'Failed to load banners'
  } finally {
    loading.value = false
  }
}

// Trigger file input click
function triggerFileInput() {
  fileInputRef.value?.click()
}

// Handle file selection
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    validateAndSetFile(input.files[0])
  }
}

// Handle drag and drop
function handleDrop(event: DragEvent) {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files[0]) {
    validateAndSetFile(files[0])
  }
}

// Validate and set file
function validateAndSetFile(file: File) {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    formError.value = 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.'
    return
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    formError.value = 'File too large. Maximum size is 2MB.'
    return
  }

  formError.value = ''
  selectedFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// Clear selected image
function clearImage() {
  selectedFile.value = null
  imagePreview.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Open create modal
function openCreateModal() {
  editingBanner.value = null
  form.value = {
    collectionId: null,
    productClass: '',
    expiresAt: '',
    sortOrder: null,
    visible: true,
  }
  selectedFile.value = null
  imagePreview.value = null
  formError.value = ''
  showModal.value = true
}

// Open edit modal
function openEditModal(banner: Banner) {
  editingBanner.value = banner
  form.value = {
    collectionId: banner.collectionId,
    productClass: banner.productClass || '',
    expiresAt: banner.expiresAt ? formatDateTimeLocal(banner.expiresAt) : '',
    sortOrder: banner.sortOrder,
    visible: banner.visible,
  }
  selectedFile.value = null
  // Show current image as preview
  imagePreview.value = getFullImageUrl(banner.imageUrl)
  formError.value = ''
  showModal.value = true
}

// Close modal
function closeModal() {
  showModal.value = false
  editingBanner.value = null
  selectedFile.value = null
  imagePreview.value = null
}

// Save banner (create or update)
async function saveBanner() {
  // Validate: require image for new banners
  if (!editingBanner.value && !selectedFile.value) {
    formError.value = 'Please select an image'
    return
  }

  saving.value = true
  formError.value = ''

  try {
    // Build FormData
    const formData = new FormData()
    
    if (selectedFile.value) {
      formData.append('image', selectedFile.value)
    }
    
    if (form.value.collectionId !== null) {
      formData.append('collectionId', String(form.value.collectionId))
    }
    if (form.value.productClass) {
      formData.append('productClass', form.value.productClass)
    }
    if (form.value.expiresAt) {
      formData.append('expiresAt', new Date(form.value.expiresAt).toISOString())
    }
    if (form.value.sortOrder !== null) {
      formData.append('sortOrder', String(form.value.sortOrder))
    }
    formData.append('visible', String(form.value.visible))

    if (editingBanner.value) {
      // Update
      await $fetch(`/admin/${tenantId.value}/banners/${editingBanner.value.id}`, {
        baseURL: config.public.backendUrl,
        method: 'PUT',
        body: formData,
        credentials: 'include',
      })
      showToast('success', 'Banner updated successfully')
    } else {
      // Create
      await $fetch(`/admin/${tenantId.value}/banners`, {
        baseURL: config.public.backendUrl,
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      showToast('success', 'Banner created successfully')
    }

    closeModal()
    await fetchBanners()
  } catch (e: any) {
    formError.value = e.data?.error || e.message || 'Failed to save banner'
  } finally {
    saving.value = false
  }
}

// Confirm delete
function confirmDelete(banner: Banner) {
  bannerToDelete.value = banner
  showDeleteModal.value = true
}

// Delete banner
async function deleteBanner() {
  if (!bannerToDelete.value) return

  deleting.value = true

  try {
    await $fetch(`/admin/${tenantId.value}/banners/${bannerToDelete.value.id}`, {
      baseURL: config.public.backendUrl,
      method: 'DELETE',
      credentials: 'include',
    })

    showDeleteModal.value = false
    bannerToDelete.value = null
    showToast('success', 'Banner deleted successfully')
    await fetchBanners()
  } catch (e: any) {
    showToast('error', e.data?.error || e.message || 'Failed to delete banner')
  } finally {
    deleting.value = false
  }
}

// Show toast notification
function showToast(type: 'success' | 'error', message: string) {
  toast.value = { show: true, type, message }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// Helper functions
function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDateTimeLocal(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Fetch on mount
onMounted(() => {
  fetchBanners()
})
</script>
