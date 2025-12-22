<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-admin-text-primary">Store Settings</h1>
      <p class="text-sm text-admin-text-secondary mt-1">Manage your store branding and promotional banners</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-8">
      <!-- Brand Settings Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6 animate-pulse">
        <div class="space-y-4">
          <div class="h-6 bg-admin-surface-raised rounded w-1/3"></div>
          <div class="h-4 bg-admin-surface-raised rounded w-1/2"></div>
          <div class="space-y-3">
            <div class="h-4 bg-admin-surface-raised rounded w-1/4"></div>
            <div class="flex items-center gap-3">
              <div class="w-16 h-10 bg-admin-surface-raised rounded"></div>
              <div class="flex-1 h-10 bg-admin-surface-raised rounded"></div>
            </div>
          </div>
          <div class="space-y-3">
            <div class="h-4 bg-admin-surface-raised rounded w-1/4"></div>
            <div class="flex items-center gap-3">
              <div class="w-16 h-10 bg-admin-surface-raised rounded"></div>
              <div class="flex-1 h-10 bg-admin-surface-raised rounded"></div>
            </div>
          </div>
          <div class="mt-4 p-4 bg-admin-surface-raised rounded-lg">
            <div class="h-4 bg-admin-surface-sunken rounded w-1/6 mb-2"></div>
            <div class="flex gap-2">
              <div class="flex-1 h-16 bg-admin-surface-sunken rounded"></div>
              <div class="flex-1 h-16 bg-admin-surface-sunken rounded"></div>
            </div>
          </div>
          <div class="flex justify-end">
            <div class="h-10 bg-admin-surface-raised rounded w-40"></div>
          </div>
        </div>
      </div>

      <!-- Banners Section Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6 animate-pulse">
        <div class="flex items-center justify-between mb-4">
          <div class="space-y-2">
            <div class="h-6 bg-admin-surface-raised rounded w-1/4"></div>
            <div class="h-4 bg-admin-surface-raised rounded w-1/2"></div>
          </div>
          <div class="h-10 bg-admin-surface-raised rounded w-32"></div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="i in 3"
            :key="i"
            class="bg-admin-surface-raised rounded-lg border border-admin-border overflow-hidden"
          >
            <div class="aspect-[16/9] bg-admin-surface-sunken"></div>
            <div class="p-4 space-y-3">
              <div class="h-4 bg-admin-surface-sunken rounded w-3/4"></div>
              <div class="h-3 bg-admin-surface-sunken rounded w-1/2"></div>
              <div class="h-3 bg-admin-surface-sunken rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content (shown when not loading) -->
    <template v-else>
    <!-- Brand Settings Section -->
    <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-admin-text-primary">Brand Settings</h2>
          <p class="text-sm text-admin-text-secondary mt-1">Customize your store's primary and secondary brand colors</p>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Primary Color -->
        <div>
          <label class="block text-sm font-medium text-admin-text-primary mb-2">
            Primary Brand Color
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model="brandForm.primaryBrandColor"
              type="color"
              class="w-16 h-10 rounded border border-admin-border cursor-pointer"
            />
            <input
              v-model="brandForm.primaryBrandColor"
              type="text"
              placeholder="#8e213e"
              pattern="^#[0-9A-Fa-f]{6}$"
              class="flex-1 border border-admin-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-admin-brand-strong focus:border-transparent outline-none font-mono text-sm"
            />
          </div>
        </div>

        <!-- Secondary Color -->
        <div>
          <label class="block text-sm font-medium text-admin-text-primary mb-2">
            Secondary Brand Color
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model="brandForm.secondaryBrandColor"
              type="color"
              class="w-16 h-10 rounded border border-admin-border cursor-pointer"
            />
            <input
              v-model="brandForm.secondaryBrandColor"
              type="text"
              placeholder="#a83d5a"
              pattern="^#[0-9A-Fa-f]{6}$"
              class="flex-1 border border-admin-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-admin-brand-strong focus:border-transparent outline-none font-mono text-sm"
            />
          </div>
        </div>

        <!-- Color Preview -->
        <div class="mt-4 p-4 bg-admin-surface-raised rounded-lg border border-admin-border">
          <p class="text-sm font-medium text-admin-text-primary mb-2">Preview</p>
          <div class="flex gap-2">
            <div
              :style="{ backgroundColor: brandForm.primaryBrandColor || '#8e213e' }"
              class="flex-1 h-16 rounded flex items-center justify-center text-white text-sm font-medium"
            >
              Primary
            </div>
            <div
              :style="{ backgroundColor: brandForm.secondaryBrandColor || '#a83d5a' }"
              class="flex-1 h-16 rounded flex items-center justify-center text-white text-sm font-medium"
            >
              Secondary
            </div>
          </div>
        </div>

        <!-- Brand Settings Error -->
        <div v-if="brandError" class="bg-admin-state-danger-soft border border-admin-state-danger-border rounded-lg p-3 text-admin-state-danger-text text-sm">
          {{ brandError }}
        </div>

        <!-- Save Brand Settings Button -->
        <div class="flex justify-end pt-2">
          <button
            @click="saveBrandSettings"
            :disabled="savingBrand"
            class="bg-admin-brand-strong text-admin-text-inverse px-6 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ savingBrand ? 'Saving...' : 'Save Brand Settings' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Banners Section -->
    <div id="banners" class="bg-admin-surface-base rounded-lg border border-admin-border p-6 scroll-mt-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-admin-text-primary">Banners</h2>
          <p class="text-sm text-admin-text-secondary mt-1">Manage promotional banners for your shop</p>
        </div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 bg-admin-brand-strong text-admin-text-inverse px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Banner
        </button>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-admin-state-danger-soft border border-admin-state-danger-border rounded-lg p-4 text-admin-state-danger-text">
        {{ error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="banners.length === 0" class="bg-admin-surface-raised rounded-lg border border-admin-border p-12 text-center">
        <div class="mx-auto w-16 h-16 bg-admin-surface-raised rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-admin-text-primary mb-1">No banners yet</h3>
        <p class="text-admin-text-secondary mb-4">Get started by creating your first promotional banner.</p>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 bg-admin-brand-strong text-admin-text-inverse px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
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
          class="bg-admin-surface-raised rounded-lg border border-admin-border overflow-hidden hover:shadow-md transition-shadow"
        >
          <!-- Image Preview -->
          <div class="aspect-[16/9] bg-admin-surface-raised relative">
            <img
              v-if="banner.imageUrl"
              :src="getFullImageUrl(banner.imageUrl)"
              :alt="`Banner ${banner.id}`"
              class="w-full h-full object-cover"
              @error="(e: Event) => (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23d1d5db%22%3E%3Cpath d=%22M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z%22/%3E%3C/svg%3E'"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-12 h-12 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <!-- Status Badges -->
            <div class="absolute top-2 left-2 flex gap-1.5">
              <span
                :class="[
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  banner.visible
                    ? 'bg-admin-state-success-soft text-admin-state-success-text'
                    : 'bg-admin-surface-raised text-admin-text-secondary'
                ]"
              >
                {{ banner.visible ? 'Visible' : 'Hidden' }}
              </span>
              <span
                v-if="isExpired(banner.expiresAt)"
                class="text-xs font-medium px-2 py-0.5 rounded-full bg-admin-state-warning-soft text-admin-state-warning-text"
              >
                Expired
              </span>
            </div>
          </div>

          <!-- Details -->
          <div class="p-4">
            <div class="text-sm text-admin-text-secondary space-y-1 mb-3">
              <p v-if="banner.collectionId">
                <span class="text-admin-text-muted">Collection:</span> {{ banner.collectionId }}
              </p>
              <p v-if="banner.productClass">
                <span class="text-admin-text-muted">Product Class:</span> {{ banner.productClass }}
              </p>
              <p v-if="banner.expiresAt">
                <span class="text-admin-text-muted">Expires:</span> {{ formatDate(banner.expiresAt) }}
              </p>
              <p v-if="banner.sortOrder !== null">
                <span class="text-admin-text-muted">Sort Order:</span> {{ banner.sortOrder }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-3 border-t border-admin-border-subtle">
              <button
                @click="openEditModal(banner)"
                class="flex-1 text-sm text-admin-text-primary bg-admin-surface-base hover:bg-admin-surface-hover px-3 py-1.5 rounded transition-colors"
              >
                Edit
              </button>
              <button
                @click="confirmDelete(banner)"
                class="text-sm text-admin-state-danger-text bg-admin-state-danger-soft hover:bg-admin-state-danger-soft px-3 py-1.5 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>

    <!-- Create/Edit Banner Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="closeModal"
      >
        <div class="bg-admin-surface-base rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="px-6 py-4 border-b border-admin-border">
            <h2 class="text-lg font-semibold text-admin-text-primary">
              {{ editingBanner ? 'Edit Banner' : 'Create Banner' }}
            </h2>
          </div>

          <form @submit.prevent="saveBanner" class="p-6 space-y-4">
            <!-- Image Upload -->
            <div>
              <label class="block text-sm font-medium text-admin-text-primary mb-1">
                Banner Image <span v-if="!editingBanner" class="text-admin-state-danger-text">*</span>
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
                    ? 'border-admin-brand-strong bg-admin-surface-hover' 
                    : 'border-admin-border hover:border-admin-border-strong'
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
                  <p class="text-sm text-admin-text-secondary">
                    {{ selectedFile?.name || 'Current image' }}
                    <span v-if="selectedFile" class="text-admin-text-muted">
                      ({{ formatFileSize(selectedFile.size) }})
                    </span>
                  </p>
                  <button
                    type="button"
                    @click.stop="clearImage"
                    class="text-sm text-admin-state-danger-text hover:text-admin-state-danger-text"
                  >
                    Remove
                  </button>
                </div>
                <div v-else class="space-y-2">
                  <svg class="mx-auto w-12 h-12 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p class="text-sm text-admin-text-secondary">
                    <span class="font-medium text-admin-text-primary">Click to upload</span> or drag and drop
                  </p>
                </div>
              </div>
              
              <!-- Guidelines -->
              <div class="mt-2 text-xs text-admin-text-secondary space-y-0.5">
                <p>Recommended size: 1920 x 640 pixels (3:1 aspect ratio)</p>
                <p>Maximum file size: 2MB</p>
                <p>Supported formats: JPG, PNG, WebP, GIF</p>
              </div>
            </div>

            <!-- Collection ID -->
            <div>
              <label class="block text-sm font-medium text-admin-text-primary mb-1">
                Collection ID
              </label>
              <input
                v-model.number="form.collectionId"
                type="number"
                placeholder="Optional - Link to a product collection"
                class="w-full border border-admin-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-admin-brand-strong focus:border-transparent outline-none"
              />
            </div>

            <!-- Product Class -->
            <div>
              <label class="block text-sm font-medium text-admin-text-primary mb-1">
                Product Class
              </label>
              <input
                v-model="form.productClass"
                type="text"
                placeholder="Optional - e.g. membership, retail"
                class="w-full border border-admin-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-admin-brand-strong focus:border-transparent outline-none"
              />
            </div>

            <!-- Expires At -->
            <div>
              <label class="block text-sm font-medium text-admin-text-primary mb-1">
                Expiration Date
              </label>
              <input
                v-model="form.expiresAt"
                type="datetime-local"
                class="w-full border border-admin-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-admin-brand-strong focus:border-transparent outline-none"
              />
            </div>

            <!-- Sort Order -->
            <div>
              <label class="block text-sm font-medium text-admin-text-primary mb-1">
                Sort Order
              </label>
              <input
                v-model.number="form.sortOrder"
                type="number"
                placeholder="Lower numbers appear first"
                class="w-full border border-admin-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-admin-brand-strong focus:border-transparent outline-none"
              />
            </div>

            <!-- Visible Toggle -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="form.visible = !form.visible"
                :class="[
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-admin-brand-strong focus:ring-offset-2',
                  form.visible ? 'bg-admin-brand-strong' : 'bg-admin-surface-raised'
                ]"
              >
                <span
                  :class="[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-admin-surface-base shadow ring-0 transition duration-200 ease-in-out',
                    form.visible ? 'translate-x-5' : 'translate-x-0'
                  ]"
                />
              </button>
              <label class="text-sm font-medium text-admin-text-primary">
                {{ form.visible ? 'Visible to customers' : 'Hidden from customers' }}
              </label>
            </div>

            <!-- Form Error -->
            <div v-if="formError" class="bg-admin-state-danger-soft border border-admin-state-danger-border rounded-lg p-3 text-admin-state-danger-text text-sm">
              {{ formError }}
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="flex-1 bg-admin-surface-raised text-admin-text-primary px-4 py-2 rounded-lg hover:bg-admin-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 bg-admin-brand-strong text-admin-text-inverse px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div class="bg-admin-surface-base rounded-xl shadow-xl w-full max-w-md">
          <div class="p-6">
            <div class="mx-auto w-12 h-12 bg-admin-state-danger-soft rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-admin-state-danger-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-admin-text-primary text-center mb-2">Delete Banner</h3>
            <p class="text-admin-text-secondary text-center mb-6">
              Are you sure you want to delete this banner? This action cannot be undone.
            </p>
            <div class="flex gap-3">
              <button
                @click="showDeleteModal = false"
                class="flex-1 bg-admin-surface-raised text-admin-text-primary px-4 py-2 rounded-lg hover:bg-admin-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                @click="deleteBanner"
                :disabled="deleting"
                class="flex-1 bg-admin-state-danger-text text-admin-text-inverse px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
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
            toast.type === 'success' ? 'bg-admin-state-success-text text-admin-text-inverse' : 'bg-admin-state-danger-text text-admin-text-inverse'
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

// Brand Settings State
const brandForm = ref({
  primaryBrandColor: '#8e213e',
  secondaryBrandColor: '#a83d5a',
})
const savingBrand = ref(false)
const brandError = ref('')

// Banners State
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

// Get full image URL
function getFullImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith('http')) return imageUrl
  return `${config.public.backendUrl}${imageUrl}`
}

// Fetch store settings (brand colors and banners)
async function fetchStoreSettings() {
  loading.value = true
  error.value = ''
  brandError.value = ''
  
  try {
    const data = await $fetch<{
      brandSettings: {
        primaryBrandColor: string | null
        secondaryBrandColor: string | null
      }
      banners: Banner[]
    }>(`/admin/${tenantId.value}/store-settings`, {
      baseURL: config.public.backendUrl,
      credentials: 'include',
    })
    
    // Set brand colors (with defaults)
    brandForm.value.primaryBrandColor = data.brandSettings.primaryBrandColor || '#8e213e'
    brandForm.value.secondaryBrandColor = data.brandSettings.secondaryBrandColor || '#a83d5a'
    banners.value = data.banners
  } catch (e: any) {
    error.value = e.data?.error || e.message || 'Failed to load store settings'
  } finally {
    loading.value = false
  }
}

// Save brand settings
async function saveBrandSettings() {
  savingBrand.value = true
  brandError.value = ''

  // Validate color format
  const colorRegex = /^#[0-9A-Fa-f]{6}$/i
  if (brandForm.value.primaryBrandColor && !colorRegex.test(brandForm.value.primaryBrandColor)) {
    brandError.value = 'Invalid primary color format. Use hex format (e.g., #8e213e)'
    savingBrand.value = false
    return
  }
  if (brandForm.value.secondaryBrandColor && !colorRegex.test(brandForm.value.secondaryBrandColor)) {
    brandError.value = 'Invalid secondary color format. Use hex format (e.g., #a83d5a)'
    savingBrand.value = false
    return
  }

  try {
    await $fetch(`/admin/${tenantId.value}/store-settings/brand`, {
      baseURL: config.public.backendUrl,
      method: 'PUT',
      body: {
        primaryBrandColor: brandForm.value.primaryBrandColor || null,
        secondaryBrandColor: brandForm.value.secondaryBrandColor || null,
      },
      credentials: 'include',
    })
    
    showToast('success', 'Brand settings saved successfully')
  } catch (e: any) {
    brandError.value = e.data?.error || e.message || 'Failed to save brand settings'
  } finally {
    savingBrand.value = false
  }
}

// Banner functions (same as banners.vue)
function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    validateAndSetFile(input.files[0])
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files[0]) {
    validateAndSetFile(files[0])
  }
}

function validateAndSetFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    formError.value = 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.'
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    formError.value = 'File too large. Maximum size is 2MB.'
    return
  }

  formError.value = ''
  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function clearImage() {
  selectedFile.value = null
  imagePreview.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

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
  imagePreview.value = getFullImageUrl(banner.imageUrl)
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingBanner.value = null
  selectedFile.value = null
  imagePreview.value = null
}

async function saveBanner() {
  if (!editingBanner.value && !selectedFile.value) {
    formError.value = 'Please select an image'
    return
  }

  saving.value = true
  formError.value = ''

  try {
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
      await $fetch(`/admin/${tenantId.value}/banners/${editingBanner.value.id}`, {
        baseURL: config.public.backendUrl,
        method: 'PUT',
        body: formData,
        credentials: 'include',
      })
      showToast('success', 'Banner updated successfully')
    } else {
      await $fetch(`/admin/${tenantId.value}/banners`, {
        baseURL: config.public.backendUrl,
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      showToast('success', 'Banner created successfully')
    }

    closeModal()
    await fetchStoreSettings()
  } catch (e: any) {
    formError.value = e.data?.error || e.message || 'Failed to save banner'
  } finally {
    saving.value = false
  }
}

function confirmDelete(banner: Banner) {
  bannerToDelete.value = banner
  showDeleteModal.value = true
}

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
    await fetchStoreSettings()
  } catch (e: any) {
    showToast('error', e.data?.error || e.message || 'Failed to delete banner')
  } finally {
    deleting.value = false
  }
}

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { show: true, type, message }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

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

onMounted(() => {
  fetchStoreSettings()
  
  // Handle hash scrolling (e.g., #banners)
  nextTick(() => {
    const hash = window.location.hash
    if (hash) {
      const element = document.querySelector(hash)
      if (element) {
        // Small delay to ensure page is fully rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }
  })
})
</script>

