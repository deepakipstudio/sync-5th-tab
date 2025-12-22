<template>
  <div class="min-h-screen bg-admin-surface-sunken flex font-admin">
    <!-- Mobile Menu Button -->
    <button
      @click="mobileMenuOpen = true"
      class="md:hidden fixed top-4 left-4 z-50 p-2 bg-admin-brand-strong text-admin-text-inverse rounded-lg"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- Mobile Menu Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileMenuOpen"
        class="md:hidden fixed inset-0 bg-black/50 z-40"
        @click="mobileMenuOpen = false"
      />
    </Transition>

    <!-- Mobile Sidebar -->
    <Transition
      enter-active-class="transition-transform duration-300"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="mobileMenuOpen"
        class="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-admin-brand-strong text-admin-text-inverse flex flex-col z-50 shadow-xl"
      >
        <div class="h-16 flex items-center justify-between px-6 border-b border-admin-border-strong">
          <div class="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" class="h-8 w-auto" />
            <span class="text-lg font-semibold">sync-5th-tab</span>
          </div>
          <button
            @click="mobileMenuOpen = false"
            class="p-1 hover:bg-admin-brand-muted rounded"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav class="flex-1 px-4 py-4 space-y-1 text-sm overflow-y-auto">
          <NuxtLink
            :to="tenantId ? `/admin/${tenantId}` : '/admin'"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            :to="tenantId ? `/admin/${tenantId}/products` : '/admin'"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
          >
            Products
          </NuxtLink>
          <NuxtLink
            :to="tenantId ? `/admin/${tenantId}/store-settings` : '/admin'"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
          >
            Store Settings
          </NuxtLink>
          <NuxtLink
            :to="tenantId ? `/admin/${tenantId}/account` : '/admin'"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
          >
            Account
          </NuxtLink>
        </nav>
        <div class="px-4 py-3 text-xs text-admin-text-secondary border-t border-admin-border-strong">
          Tenant: <span class="font-mono" v-if="tenantId">{{ tenantName || tenantId }}</span>
          <span v-else>none</span>
        </div>
      </aside>
    </Transition>

    <!-- Desktop Sidebar -->
    <aside class="hidden md:flex md:w-64 bg-admin-brand-strong text-admin-text-inverse flex-col">
      <div class="h-16 flex items-center px-6 border-b border-admin-border-strong">
        <div class="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" class="h-8 w-auto" />
          <span class="text-lg font-semibold">sync-5th-tab</span>
        </div>
      </div>
      <nav class="flex-1 px-4 py-4 space-y-1 text-sm">
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
        >
          Dashboard
        </NuxtLink>
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}/products` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
        >
          Products
        </NuxtLink>
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}/store-settings` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
        >
          Store Settings
        </NuxtLink>
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}/account` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
        >
          Account
        </NuxtLink>
      </nav>
      <div class="px-4 py-3 text-xs text-admin-text-secondary border-t border-admin-border-strong">
        Tenant: <span class="font-mono" v-if="tenantId">{{ tenantName || tenantId }}</span>
        <span v-else>none</span>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- Top bar -->
      <header class="h-16 bg-admin-surface-base border-b border-admin-border flex items-center justify-between pl-16 md:pl-4 pr-4 md:pr-8">
        <div class="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" class="h-8 w-auto hidden sm:block" />
          <span class="text-sm font-medium text-admin-text-primary">Sync by IPSTUDIO</span>
        </div>
        <div class="text-xs text-admin-text-secondary">
          <span v-if="loadingTenant">Loading...</span>
          <span v-else-if="tenantId && tenantName">{{ tenantName }}</span>
          <span v-else-if="tenantId">{{ tenantId }}</span>
          <span v-else>No tenant selected</span>
        </div>
      </header>

      <!-- Page slot with breadcrumbs -->
      <main class="flex-1 p-4 md:p-8">
        <AdminBreadcrumb />
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const tenantId = computed(() => route.params.tenant as string | undefined)

// Mobile menu state
const mobileMenuOpen = ref(false)

// Tenant name state
const tenantName = ref('')
const loadingTenant = ref(false)

// Fetch tenant name
async function fetchTenantName() {
  if (!tenantId.value) {
    tenantName.value = ''
    return
  }

  loadingTenant.value = true
  try {
    const data = await $fetch<{ data: { name: string } }>(`/tenants/${tenantId.value}`, {
      baseURL: config.public.backendUrl,
      credentials: 'include',
    })
    tenantName.value = data.data?.name || ''
  } catch (e) {
    // Fallback to ID if name fetch fails
    tenantName.value = ''
  } finally {
    loadingTenant.value = false
  }
}

// Watch for tenant changes
watch(tenantId, () => {
  fetchTenantName()
}, { immediate: true })

// Close mobile menu on route change
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>
