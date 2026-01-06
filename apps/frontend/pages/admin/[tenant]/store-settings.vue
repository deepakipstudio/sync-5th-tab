<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-semibold text-admin-text-primary">Store Settings</h1>
      <p class="text-sm text-admin-text-secondary mt-2">Manage your store branding and promotional banners</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-8">
      <!-- Brand Settings Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <div class="space-y-4">
          <UiSkeleton class="h-6 w-1/3" />
          <UiSkeleton class="h-4 w-1/2" />
          <div class="space-y-3">
            <UiSkeleton class="h-4 w-1/4" />
            <div class="flex items-center gap-3">
              <UiSkeleton class="w-16 h-10" />
              <UiSkeleton class="flex-1 h-10" />
            </div>
          </div>
          <div class="space-y-3">
            <UiSkeleton class="h-4 w-1/4" />
            <div class="flex items-center gap-3">
              <UiSkeleton class="w-16 h-10" />
              <UiSkeleton class="flex-1 h-10" />
            </div>
          </div>
          <div class="mt-4 p-4 bg-admin-surface-raised rounded-lg">
            <UiSkeleton class="h-4 w-1/6 mb-2" />
            <div class="flex gap-2">
              <UiSkeleton class="flex-1 h-16" />
              <UiSkeleton class="flex-1 h-16" />
            </div>
          </div>
          <div class="flex justify-end">
            <UiSkeleton class="h-10 w-40" />
          </div>
        </div>
      </div>

      <!-- Banners Section Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="space-y-2">
            <UiSkeleton class="h-6 w-1/4" />
            <UiSkeleton class="h-4 w-1/2" />
          </div>
          <UiSkeleton class="h-10 w-32" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="i in 3"
            :key="i"
            class="bg-admin-surface-raised rounded-lg border border-admin-border overflow-hidden"
          >
            <UiSkeleton class="aspect-[16/9] w-full" />
            <div class="p-4 space-y-3">
              <UiSkeleton class="h-4 w-3/4" />
              <UiSkeleton class="h-3 w-1/2" />
              <UiSkeleton class="h-3 w-1/3" />
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
          <h2 class="text-lg font-semibold text-admin-text-primary">
            {{ brandData?.brandName || 'Brand Settings' }}
          </h2>
          <p class="text-sm text-admin-text-secondary mt-1">Brand information synced from Marianatek</p>
        </div>
        <UiButton
          @click="handleSyncBrand"
          :disabled="syncingBrand"
          variant="secondary"
          class="inline-flex items-center gap-2"
        >
          <svg 
            v-if="!syncingBrand"
            class="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span v-else class="animate-spin">⟳</span>
          {{ syncingBrand ? 'Syncing...' : 'Sync from Marianatek' }}
        </UiButton>
      </div>

      <!-- Logo Preview -->
      <div v-if="brandData?.logoLightUrl" class="mb-4">
        <UiLabel class="block mb-2">Logo</UiLabel>
        <div class="flex items-center gap-4">
          <img
            :src="brandData.logoLightUrl"
            alt="Brand Logo"
            class="h-16 w-auto object-contain rounded border border-admin-border p-2 bg-admin-surface-raised"
            @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
          />
          <div v-if="brandData.logoDarkUrl" class="flex items-center gap-2">
            <span class="text-sm text-admin-text-secondary">Dark:</span>
            <img
              :src="brandData.logoDarkUrl"
              alt="Brand Logo Dark"
              class="h-16 w-auto object-contain rounded border border-admin-border p-2 bg-admin-surface-raised"
              @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
            />
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Brand Colors - Read-only display -->
        <div>
          <UiLabel class="block mb-3 text-sm font-medium text-admin-text-primary">
            Brand Colors
          </UiLabel>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Primary Brand Color -->
            <div class="bg-admin-surface-raised rounded-lg border border-admin-border p-4">
              <div class="flex items-center gap-3 mb-2">
                <div
                  :style="{ backgroundColor: brandData?.primaryColor || '#8e213e' }"
                  class="w-12 h-12 rounded border-2 border-admin-border flex-shrink-0"
                />
                <div class="flex-1">
                  <p class="text-sm font-medium text-admin-text-primary">Primary Brand Color</p>
                  <p class="text-xs font-mono text-admin-text-secondary">
                    {{ brandData?.primaryColor || 'Not set' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Primary Foreground Color -->
            <div class="bg-admin-surface-raised rounded-lg border border-admin-border p-4">
              <div class="flex items-center gap-3 mb-2">
                <div
                  :style="{ backgroundColor: brandData?.primaryForegroundColor || '#ffffff' }"
                  class="w-12 h-12 rounded border-2 border-admin-border flex-shrink-0"
                />
                <div class="flex-1">
                  <p class="text-sm font-medium text-admin-text-primary">Primary Foreground Color</p>
                  <p class="text-xs font-mono text-admin-text-secondary">
                    {{ brandData?.primaryForegroundColor || 'Not set' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Secondary Brand Color -->
            <div class="bg-admin-surface-raised rounded-lg border border-admin-border p-4">
              <div class="flex items-center gap-3 mb-2">
                <div
                  :style="{ backgroundColor: brandData?.secondaryColor || '#a83d5a' }"
                  class="w-12 h-12 rounded border-2 border-admin-border flex-shrink-0"
                />
                <div class="flex-1">
                  <p class="text-sm font-medium text-admin-text-primary">Secondary Brand Color</p>
                  <p class="text-xs font-mono text-admin-text-secondary">
                    {{ brandData?.secondaryColor || 'Not set' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Secondary Foreground Color -->
            <div class="bg-admin-surface-raised rounded-lg border border-admin-border p-4">
              <div class="flex items-center gap-3 mb-2">
                <div
                  :style="{ backgroundColor: brandData?.secondaryForegroundColor || '#ffffff' }"
                  class="w-12 h-12 rounded border-2 border-admin-border flex-shrink-0"
                />
                <div class="flex-1">
                  <p class="text-sm font-medium text-admin-text-primary">Secondary Foreground Color</p>
                  <p class="text-xs font-mono text-admin-text-secondary">
                    {{ brandData?.secondaryForegroundColor || 'Not set' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Management Section -->
    <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-admin-text-primary">Product Management</h2>
          <p class="text-sm text-admin-text-secondary mt-1">Sync products from Marianatek to your store</p>
        </div>
        <UiButton
          @click="openSyncModal"
          variant="secondary"
          class="inline-flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync Products
        </UiButton>
      </div>
    </div>

    <!-- Banners Section -->
    <div id="banners" class="bg-admin-surface-base rounded-lg border border-admin-border p-6 scroll-mt-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-admin-text-primary">Banners</h2>
          <p class="text-sm text-admin-text-secondary mt-1">Manage promotional banners for your shop</p>
        </div>
        <UiButton
          @click="openCreateModal"
          variant="default"
          class="inline-flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Banner
        </UiButton>
      </div>

      <!-- Error State -->
      <UiAlert v-if="error" variant="error">
        {{ error }}
      </UiAlert>

      <!-- Empty State -->
      <div v-else-if="banners.length === 0" class="bg-admin-surface-raised rounded-lg border border-admin-border p-12 text-center">
        <div class="mx-auto w-16 h-16 bg-admin-surface-raised rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-admin-text-primary mb-1">No banners yet</h3>
        <p class="text-admin-text-secondary mb-4">Get started by creating your first promotional banner.</p>
        <UiButton
          @click="openCreateModal"
          variant="default"
          class="inline-flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Banner
        </UiButton>
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
              <UiBadge :variant="banner.visible ? 'success' : 'default'">
                {{ banner.visible ? 'Visible' : 'Hidden' }}
              </UiBadge>
              <UiBadge
                v-if="isExpired(banner.expiresAt)"
                variant="warning"
              >
                Expired
              </UiBadge>
            </div>
          </div>

          <!-- Details -->
          <div class="p-4">
            <div class="text-sm text-admin-text-secondary space-y-1 mb-3">
              <p v-if="banner.category">
                <span class="text-admin-text-muted">Category:</span> {{ banner.category.name }}
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
              <UiButton
                @click="openEditModal(banner)"
                variant="secondary"
                size="sm"
                class="flex-1"
              >
                Edit
              </UiButton>
              <UiButton
                @click="confirmDelete(banner)"
                variant="danger"
                size="sm"
              >
                Delete
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>

    <!-- Create/Edit Banner Modal -->
    <UiDialog :open="showModal" @update:open="(value) => { if (!value) closeModal() }" class="max-h-[90vh] overflow-y-auto">
      <div class="border-b border-admin-border pb-4 mb-4">
        <UiDialogTitle>
          {{ editingBanner ? 'Edit Banner' : 'Create Banner' }}
        </UiDialogTitle>
        <UiDialogDescription class="sr-only">
          {{ editingBanner ? 'Edit banner details' : 'Create a new promotional banner' }}
        </UiDialogDescription>
      </div>

      <form @submit.prevent="saveBanner" class="space-y-4">
            <!-- Image Upload -->
            <div>
              <UiLabel class="block mb-1">
                Banner Image <span v-if="!editingBanner" class="text-admin-state-danger-text">*</span>
              </UiLabel>
              
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
                  <UiButton
                    type="button"
                    @click.stop="clearImage"
                    variant="ghost"
                    size="sm"
                    class="text-sm text-admin-state-danger-text hover:text-admin-state-danger-text"
                  >
                    Remove
                  </UiButton>
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

            <!-- Category -->
            <div>
              <UiLabel class="block mb-1">
                Category
              </UiLabel>
              <select
                v-model="form.categoryId"
                class="flex h-10 w-full rounded-lg border border-admin-border bg-admin-surface-base px-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-brand-strong focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option :value="null">None</option>
                <option
                  v-for="category in availableCategories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
              <p class="text-xs text-admin-text-secondary mt-1">Optional - Link to a category</p>
            </div>

            <!-- Product Class -->
            <div>
              <UiLabel class="block mb-1">
                Product Class
              </UiLabel>
              <UiInput
                v-model="form.productClass"
                type="text"
                placeholder="Optional - e.g. membership, retail"
              />
            </div>

            <!-- Expires At -->
            <div>
              <UiLabel class="block mb-1">
                Expiration Date
              </UiLabel>
              <UiInput
                v-model="form.expiresAt"
                type="datetime-local"
              />
            </div>

            <!-- Sort Order -->
            <div>
              <UiLabel class="block mb-1">
                Sort Order
              </UiLabel>
              <UiInput
                v-model.number="form.sortOrder"
                type="number"
                placeholder="Lower numbers appear first"
              />
            </div>

            <!-- Visible Toggle -->
            <div class="flex items-center gap-3">
              <UiSwitch
                :checked="form.visible"
                @update:checked="(value) => form.visible = value"
              />
              <UiLabel class="text-sm font-medium">
                {{ form.visible ? 'Visible to customers' : 'Hidden from customers' }}
              </UiLabel>
            </div>

            <!-- Form Error -->
            <UiAlert v-if="formError" variant="error" class="text-sm">
              {{ formError }}
            </UiAlert>

            <!-- Actions -->
            <div class="flex gap-3 pt-4">
              <UiButton
                type="button"
                @click="closeModal"
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
                {{ saving ? 'Saving...' : (editingBanner ? 'Update' : 'Create') }}
              </UiButton>
            </div>
          </form>
    </UiDialog>

    <!-- Delete Confirmation Modal -->
    <UiDialog :open="showDeleteModal" @update:open="(value) => { if (!value) showDeleteModal = false }">
      <div class="text-center">
        <div class="mx-auto w-12 h-12 bg-admin-state-danger-soft rounded-full flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-admin-state-danger-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <UiDialogTitle>Delete Banner</UiDialogTitle>
        <UiDialogDescription class="mb-6">
          Are you sure you want to delete this banner? This action cannot be undone.
        </UiDialogDescription>
        <div class="flex gap-3">
          <UiButton
            @click="showDeleteModal = false"
            variant="secondary"
            class="flex-1"
          >
            Cancel
          </UiButton>
          <UiButton
            @click="deleteBanner"
            :disabled="deleting"
            variant="danger"
            class="flex-1"
          >
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </UiButton>
        </div>
      </div>
    </UiDialog>

    <!-- Sync Products Modal -->
    <UiDialog :open="showSyncModal" @update:open="(value) => { if (!value) closeSyncModal() }" class="max-w-2xl max-h-[90vh]">
      <UiDialogTitle class="sr-only">Sync Products</UiDialogTitle>
      <div class="flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-admin-border flex items-center justify-between">
          <h2 class="text-lg font-semibold text-admin-text-primary">Sync Products</h2>
          <UiDialogClose as-child>
            <UiButton variant="ghost" size="icon" class="text-admin-text-muted hover:text-admin-text-secondary">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </UiButton>
          </UiDialogClose>
        </div>

        <div class="p-6 flex-1 overflow-y-auto">
          <p class="text-sm text-admin-text-secondary mb-4">
            Select products to sync from Marianatek. This will update variants, add new ones, and mark deleted variants.
          </p>

          <!-- Product Selection -->
          <div class="space-y-2 mb-4">
            <div class="flex items-center gap-2 mb-2">
              <UiCheckbox
                :checked="allSelected"
                @update:checked="(value) => { if (value && !allSelected) toggleAllProducts(); else if (!value && allSelected) toggleAllProducts() }"
              />
              <UiLabel class="text-sm font-medium">Select All</UiLabel>
            </div>
            <div
              v-for="product in syncProducts"
              :key="product.id"
              class="flex items-center gap-3 p-3 border border-admin-border rounded-lg"
            >
              <!-- Image Thumbnail -->
              <div class="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-admin-surface-raised border border-admin-border flex items-center justify-center">
                <img
                  v-if="getFeaturedImage(product)"
                  :src="getFullImageUrl(getFeaturedImage(product)!.imageUrl)"
                  :alt="`${product.mtProductName || 'Product'} image`"
                  class="w-full h-full object-cover"
                  @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
                />
                <svg
                  v-else
                  class="w-6 h-6 text-admin-text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              
              <!-- Checkbox + Product Info -->
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <UiCheckbox
                  :checked="selectedProducts.includes(product.id)"
                  @update:checked="(value) => { if (value && !selectedProducts.includes(product.id)) toggleProduct(product.id); else if (!value && selectedProducts.includes(product.id)) toggleProduct(product.id) }"
                  class="flex-shrink-0"
                />
                <UiLabel class="flex-1 text-sm cursor-pointer">
                  {{ product.mtProductName || 'Product' }} ({{ product.mtProductId }}) ({{ product.variants?.length || 0 }} variants)
                </UiLabel>
              </div>
            </div>
          </div>

          <!-- Sync Button -->
          <UiButton
            @click="performSync"
            :disabled="syncing || selectedProducts.length === 0"
            variant="default"
            class="w-full"
          >
            <span v-if="syncing">Syncing...</span>
            <span v-else>Sync Now ({{ selectedProducts.length }} product{{ selectedProducts.length !== 1 ? 's' : '' }})</span>
          </UiButton>

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
    </UiDialog>

  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'admin' })

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const { fetchBrand, syncBrand } = useTenantBrand()

interface Banner {
  id: string
  imageUrl: string
  filename?: string
  originalName?: string
  categoryId: string | null
  category?: { id: string; name: string } | null
  productClass: string | null
  expiresAt: string | null
  sortOrder: number | null
  visible: boolean
  createdAt: string
}

const route = useRoute()
const config = useRuntimeConfig()
const { fetchWithCache, invalidate } = useAdminCache()

const tenantId = computed(() => route.params.tenant as string)

// Brand Settings State
const brandData = ref<{
  id: string
  brandName: string | null
  primaryColor: string | null
  primaryForegroundColor: string | null
  secondaryColor: string | null
  secondaryForegroundColor: string | null
  logoLightUrl: string | null
  logoDarkUrl: string | null
} | null>(null)
const brandForm = ref({
  primaryBrandColor: '#8e213e',
  secondaryBrandColor: '#a83d5a',
})
const savingBrand = ref(false)
const syncingBrand = ref(false)
const brandError = ref('')

// Banners State
const banners = ref<Banner[]>([])
const loading = ref(false) // Start as false - only show if no cache
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
  categoryId: null as string | null,
  productClass: '',
  expiresAt: '',
  sortOrder: null as number | null,
  visible: true,
})

// Category management
const { fetchCategories } = useCategory()
const availableCategories = ref<any[]>([])
const loadingCategories = ref(false)

// Product sync state
const showSyncModal = ref(false)
const syncProducts = ref<any[]>([])
const selectedProducts = ref<string[]>([])
const syncing = ref(false)
const syncResult = ref<any>(null)

// Delete state
const showDeleteModal = ref(false)
const bannerToDelete = ref<Banner | null>(null)
const deleting = ref(false)

// Toast notifications use Sonner (imported from sonner)

// Get full image URL
function getFullImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith('http')) return imageUrl
  return `${config.public.backendUrl}${imageUrl}`
}

// Fetch brand data
async function fetchBrandData() {
  try {
    const brand = await fetchBrand(tenantId.value)
    if (brand) {
      brandData.value = brand
    } else {
      brandData.value = null
    }
  } catch (e: any) {
    console.error('Error fetching brand data:', e)
    brandData.value = null
  }
}

// Sync brand from Marianatek
async function handleSyncBrand() {
  syncingBrand.value = true
  brandError.value = ''

  try {
    const brand = await syncBrand(tenantId.value)
    if (brand) {
      brandData.value = brand
      showToast('success', 'Brand data synced successfully from Marianatek')
    }
  } catch (e: any) {
    brandError.value = e.data?.error || e.message || 'Failed to sync brand data'
    showToast('error', brandError.value)
  } finally {
    syncingBrand.value = false
  }
}

// Fetch store settings (brand colors and banners) with cache-first strategy
async function fetchStoreSettings() {
  const cacheKey = `admin:store-settings:${tenantId.value}`
  const ttl = 5 * 60 * 1000 // 5 minutes

  // Check cache first
  const cached = useAdminCache().getCached<{
    brandSettings: {
      primaryBrandColor: string | null
      secondaryBrandColor: string | null
    }
    banners: Banner[]
  }>(cacheKey)
  
  if (cached) {
    // Show cached data immediately
    brandForm.value.primaryBrandColor = cached.brandSettings.primaryBrandColor || '#8e213e'
    brandForm.value.secondaryBrandColor = cached.brandSettings.secondaryBrandColor || '#a83d5a'
    banners.value = cached.banners
    loading.value = false
  } else {
    loading.value = true
  }

  error.value = ''
  brandError.value = ''
  
  try {
    const data = await fetchWithCache(
      cacheKey,
      async () => {
        const response = await $fetch<{
          brandSettings: {
            primaryBrandColor: string | null
            secondaryBrandColor: string | null
          }
          banners: Banner[]
        }>(`/admin/${tenantId.value}/store-settings`, {
          baseURL: config.public.backendUrl,
          credentials: 'include',
        })
        return {
          brandSettings: response.brandSettings,
          banners: response.banners,
        }
      },
      {
        ttl,
        onBackgroundUpdate: (freshData: {
          brandSettings: {
            primaryBrandColor: string | null
            secondaryBrandColor: string | null
          }
          banners: Banner[]
        }) => {
          // Update UI when fresh data arrives
          brandForm.value.primaryBrandColor = freshData.brandSettings.primaryBrandColor || '#8e213e'
          brandForm.value.secondaryBrandColor = freshData.brandSettings.secondaryBrandColor || '#a83d5a'
          banners.value = freshData.banners
        },
      }
    )
    
    // Set brand colors (with defaults)
    brandForm.value.primaryBrandColor = data.brandSettings.primaryBrandColor || '#8e213e'
    brandForm.value.secondaryBrandColor = data.brandSettings.secondaryBrandColor || '#a83d5a'
    banners.value = data.banners
  } catch (e: any) {
    error.value = e.data?.error || e.message || 'Failed to load store settings'
    // If we have cached data, keep showing it even on error
    if (!cached) {
      banners.value = []
    }
  } finally {
    loading.value = false
  }
}

// Save brand settings with optimistic update
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

  // Optimistic update - update cache immediately
  const cacheKey = `admin:store-settings:${tenantId.value}`
  const cached = useAdminCache().getCached<{
    brandSettings: {
      primaryBrandColor: string | null
      secondaryBrandColor: string | null
    }
    banners: Banner[]
  }>(cacheKey)
  
  if (cached) {
    useAdminCache().setCache(cacheKey, {
      ...cached,
      brandSettings: {
        primaryBrandColor: brandForm.value.primaryBrandColor || null,
        secondaryBrandColor: brandForm.value.secondaryBrandColor || null,
      },
    })
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
    
    // Invalidate cache to force refresh
    invalidate(cacheKey)
    await fetchStoreSettings()
    
    showToast('success', 'Brand settings saved successfully')
  } catch (e: any) {
    brandError.value = e.data?.error || e.message || 'Failed to save brand settings'
    // Revert optimistic update on error
    if (cached) {
      useAdminCache().setCache(cacheKey, cached)
      brandForm.value.primaryBrandColor = cached.brandSettings.primaryBrandColor || '#8e213e'
      brandForm.value.secondaryBrandColor = cached.brandSettings.secondaryBrandColor || '#a83d5a'
    }
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
    categoryId: null,
    productClass: '',
    expiresAt: '',
    sortOrder: null,
    visible: true,
  }
  selectedFile.value = null
  imagePreview.value = null
  formError.value = ''
  showModal.value = true
  loadCategories()
}

function openEditModal(banner: Banner) {
  editingBanner.value = banner
  form.value = {
    categoryId: banner.categoryId,
    productClass: banner.productClass || '',
    expiresAt: banner.expiresAt ? formatDateTimeLocal(banner.expiresAt) : '',
    sortOrder: banner.sortOrder,
    visible: banner.visible,
  }
  selectedFile.value = null
  imagePreview.value = getFullImageUrl(banner.imageUrl)
  formError.value = ''
  showModal.value = true
  loadCategories()
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
    
    if (form.value.categoryId) {
      formData.append('categoryId', form.value.categoryId)
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
    // Invalidate cache and refresh
    invalidate(`admin:store-settings:${tenantId.value}`)
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
    // Invalidate cache and refresh
    invalidate(`admin:store-settings:${tenantId.value}`)
    await fetchStoreSettings()
  } catch (e: any) {
    showToast('error', e.data?.error || e.message || 'Failed to delete banner')
  } finally {
    deleting.value = false
  }
}

// Toast function using vue-sonner
function showToast(type: 'success' | 'error', message: string) {
  if (type === 'success') {
    toast.success(message, { duration: 3000 })
  } else {
    toast.error(message, { duration: 3000 })
  }
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

// Load categories for dropdown
async function loadCategories() {
  loadingCategories.value = true
  try {
    availableCategories.value = await fetchCategories(tenantId.value)
  } catch (err: any) {
    console.error('Error loading categories:', err)
    availableCategories.value = []
  } finally {
    loadingCategories.value = false
  }
}

// Product sync functions
async function openSyncModal() {
  showSyncModal.value = true
  selectedProducts.value = []
  syncResult.value = null
  
  // Load products for sync
  try {
    const response = await $fetch<{ products: any[] }>(`${config.public.backendUrl}/admin/${tenantId.value}/products`, {
      credentials: 'include',
    })
    syncProducts.value = response.products || []
    selectedProducts.value = syncProducts.value.map(p => p.id)
  } catch (err: any) {
    console.error('Error loading products for sync:', err)
    syncProducts.value = []
  }
}

function closeSyncModal() {
  showSyncModal.value = false
  selectedProducts.value = []
  syncResult.value = null
}

const allSelected = computed(() => {
  return syncProducts.value.length > 0 && selectedProducts.value.length === syncProducts.value.length
})

function toggleAllProducts() {
  if (allSelected.value) {
    selectedProducts.value = []
  } else {
    selectedProducts.value = syncProducts.value.map(p => p.id)
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
    const response = await $fetch<{ summary: any }>(`${config.public.backendUrl}/admin/${tenantId.value}/products/sync`, {
      method: 'POST',
      credentials: 'include',
      body: {
        productIds: selectedProducts.value,
      },
    })
    syncResult.value = response
    // Invalidate cache after sync
    invalidate(`admin:products:${tenantId.value}`)
    showToast('success', 'Products synced successfully')
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
    showToast('error', err.message || 'Failed to sync products')
  } finally {
    syncing.value = false
  }
}

function getFeaturedImage(product: any) {
  return product.images?.find((img: any) => img.isFeatured) || product.images?.[0]
}

onMounted(() => {
  fetchBrandData()
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

