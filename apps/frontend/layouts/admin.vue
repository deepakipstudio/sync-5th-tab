<template>
  <div class="min-h-screen bg-admin-surface-base flex flex-col font-admin">
    <!-- Top Navigation Bar (Desktop) -->
    <header class="hidden md:block sticky top-0 z-40 bg-admin-surface-base border-b border-admin-border">
      <div class="max-w-7xl mx-auto px-4 lg:px-6">
        <div class="h-16 flex items-center justify-between">
          <!-- Logo and Brand -->
          <div class="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" class="h-8 w-auto" />
            <span class="text-sm font-medium text-admin-text-primary">Sync by IPSTUDIO</span>
          </div>

          <!-- Navigation Items -->
          <nav class="flex items-center gap-1">
            <NuxtLink
              :to="tenantId ? `/admin/${tenantId}` : '/admin'"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="isActiveRoute('/admin/' + (tenantId || '')) ? 'bg-admin-brand-soft text-admin-brand-strong' : 'text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text-primary'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </NuxtLink>
            <NuxtLink
              :to="tenantId ? `/admin/${tenantId}/products` : '/admin'"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="isActiveRoute('/admin/' + (tenantId || '') + '/products') ? 'bg-admin-brand-soft text-admin-brand-strong' : 'text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text-primary'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Products</span>
            </NuxtLink>
            <NuxtLink
              :to="tenantId ? `/admin/${tenantId}/store-settings` : '/admin'"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="isActiveRoute('/admin/' + (tenantId || '') + '/store-settings') ? 'bg-admin-brand-soft text-admin-brand-strong' : 'text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text-primary'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Store Settings</span>
            </NuxtLink>
            <NuxtLink
              :to="tenantId ? `/admin/${tenantId}/account` : '/admin'"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="isActiveRoute('/admin/' + (tenantId || '') + '/account') ? 'bg-admin-brand-soft text-admin-brand-strong' : 'text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text-primary'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Account</span>
            </NuxtLink>
          </nav>

          <!-- User Dropdown -->
          <UiDropdownMenu :open="userDropdownOpen" @update:open="userDropdownOpen = $event">
            <template #trigger>
              <UiButton variant="ghost" size="icon" class="text-admin-text-secondary hover:text-admin-text-primary">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </UiButton>
            </template>
            
            <!-- Tenant Info Header -->
            <div class="px-4 py-3">
              <div class="text-sm font-medium text-admin-text-primary">
                <span v-if="loadingTenant">Loading...</span>
                <span v-else-if="tenantId && tenantName">{{ tenantName }}</span>
                <span v-else-if="tenantId" class="font-mono">{{ tenantId }}</span>
                <span v-else>No tenant selected</span>
              </div>
              <div v-if="tenantSubdomain" class="text-xs text-admin-text-secondary mt-1">{{ tenantSubdomain }}</div>
            </div>
            
            <UiDropdownMenuSeparator />
            
            <!-- My Account Heading -->
            <div class="px-4 py-2 text-xs font-semibold text-admin-text-secondary uppercase tracking-wide">
              My Account
            </div>
            
            <UiDropdownMenuItem @click="navigateTo(`/admin/${tenantId}/account`); userDropdownOpen = false">
              Profile
            </UiDropdownMenuItem>
            
            <UiDropdownMenuItem @click="navigateTo(`/admin/${tenantId}/store-settings`); userDropdownOpen = false">
              Settings
            </UiDropdownMenuItem>
            
            <UiDropdownMenuSeparator />
            
            <UiDropdownMenuItem @click="logout" class="text-admin-state-danger-text hover:bg-admin-state-danger-soft">
              Logout
            </UiDropdownMenuItem>
          </UiDropdownMenu>
        </div>
      </div>
    </header>

    <!-- Mobile Header -->
    <div class="md:hidden fixed top-0 left-0 right-0 h-16 bg-admin-surface-base border-b border-admin-border z-50 flex items-center justify-between px-4">
      <button
        @click="mobileMenuOpen = true"
        class="p-2 text-admin-text-primary rounded-lg hover:bg-admin-surface-hover"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <!-- Mobile User Dropdown -->
      <UiDropdownMenu :open="mobileUserDropdownOpen" @update:open="mobileUserDropdownOpen = $event">
        <template #trigger>
          <UiButton variant="ghost" size="icon" class="text-admin-text-secondary hover:text-admin-text-primary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </UiButton>
        </template>
        
        <!-- Tenant Info Header -->
        <div class="px-4 py-3">
          <div class="text-sm font-medium text-admin-text-primary">
            <span v-if="loadingTenant">Loading...</span>
            <span v-else-if="tenantId && tenantName">{{ tenantName }}</span>
            <span v-else-if="tenantId" class="font-mono">{{ tenantId }}</span>
            <span v-else>No tenant selected</span>
          </div>
          <div v-if="tenantSubdomain" class="text-xs text-admin-text-secondary mt-1">{{ tenantSubdomain }}</div>
        </div>
        
        <UiDropdownMenuSeparator />
        
        <!-- My Account Heading -->
        <div class="px-4 py-2 text-xs font-semibold text-admin-text-secondary uppercase tracking-wide">
          My Account
        </div>
        
        <UiDropdownMenuItem @click="navigateTo(`/admin/${tenantId}/account`); mobileUserDropdownOpen = false">
          Profile
        </UiDropdownMenuItem>
        
        <UiDropdownMenuItem @click="navigateTo(`/admin/${tenantId}/store-settings`); mobileUserDropdownOpen = false">
          Settings
        </UiDropdownMenuItem>
        
        <UiDropdownMenuSeparator />
        
        <UiDropdownMenuItem @click="logout" class="text-admin-state-danger-text hover:bg-admin-state-danger-soft">
          Logout
        </UiDropdownMenuItem>
      </UiDropdownMenu>
    </div>

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
        class="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-admin-surface-base border-r border-admin-border flex flex-col z-50 shadow-xl"
      >
        <div class="h-16 flex items-center justify-between px-6 border-b border-admin-border">
          <div class="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" class="h-8 w-auto" />
            <span class="text-sm font-medium text-admin-text-primary">Sync</span>
          </div>
          <button
            @click="mobileMenuOpen = false"
            class="p-1 hover:bg-admin-surface-hover rounded text-admin-text-secondary"
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
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text-primary transition-colors"
            :class="isActiveRoute('/admin/' + (tenantId || '')) ? 'bg-admin-brand-soft text-admin-brand-strong' : ''"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </NuxtLink>
          <NuxtLink
            :to="tenantId ? `/admin/${tenantId}/products` : '/admin'"
            @click="mobileMenuOpen = false"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text-primary transition-colors"
            :class="isActiveRoute('/admin/' + (tenantId || '') + '/products') ? 'bg-admin-brand-soft text-admin-brand-strong' : ''"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Products</span>
          </NuxtLink>
          <NuxtLink
            :to="tenantId ? `/admin/${tenantId}/store-settings` : '/admin'"
            @click="mobileMenuOpen = false"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text-primary transition-colors"
            :class="isActiveRoute('/admin/' + (tenantId || '') + '/store-settings') ? 'bg-admin-brand-soft text-admin-brand-strong' : ''"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Store Settings</span>
          </NuxtLink>
          <NuxtLink
            :to="tenantId ? `/admin/${tenantId}/account` : '/admin'"
            @click="mobileMenuOpen = false"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text-primary transition-colors"
            :class="isActiveRoute('/admin/' + (tenantId || '') + '/account') ? 'bg-admin-brand-soft text-admin-brand-strong' : ''"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Account</span>
          </NuxtLink>
        </nav>
      </aside>
    </Transition>

    <!-- Main content -->
    <div class="flex-1 flex flex-col pt-16">
      <!-- Page slot with breadcrumbs -->
      <main class="flex-1">
        <div class="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          <AdminBreadcrumb />
          <slot />
        </div>
      </main>
    </div>

    <!-- Toast Notifications -->
    <UiSonner position="bottom-right" />
  </div>
</template>

<script setup lang="ts">
import 'vue-sonner/style.css'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const tenantId = computed(() => route.params.tenant as string | undefined)
const { fetchWithCache } = useAdminCache()
const { clearAuth } = useAuth()

// Mobile menu state
const mobileMenuOpen = ref(false)

// User dropdown state
const userDropdownOpen = ref(false)
const mobileUserDropdownOpen = ref(false)

// Tenant name state
const tenantName = ref('')
const tenantSubdomain = ref('')
const loadingTenant = ref(false)

// Fetch tenant name with caching
async function fetchTenantName() {
  if (!tenantId.value) {
    tenantName.value = ''
    tenantSubdomain.value = ''
    return
  }

  const cacheKey = `admin:tenant-name:${tenantId.value}`
  const ttl = 30 * 60 * 1000 // 30 minutes for tenant name (relatively static)

  // Try to get from cache first
  const cached = useAdminCache().getCached<string>(cacheKey)
  if (cached) {
    tenantName.value = cached
    loadingTenant.value = false
  }

  // Fetch with cache-first strategy
  try {
    const data = await fetchWithCache(
      cacheKey,
      async () => {
        const response = await $fetch<{ data: { name: string } }>(`/tenants/${tenantId.value}`, {
          baseURL: config.public.backendUrl,
          credentials: 'include',
        })
        return response.data?.name || ''
      },
      {
        ttl,
        onBackgroundUpdate: (name: string) => {
          // Update UI when fresh data arrives
          tenantName.value = name
        },
      }
    )
    tenantName.value = data || ''
  } catch (e) {
    // Fallback to ID if name fetch fails
    if (!tenantName.value) {
      tenantName.value = ''
    }
  } finally {
    loadingTenant.value = false
  }
  
  // Fetch tenant subdomain from account API
  await fetchTenantSubdomain()
}

// Fetch tenant subdomain from account API
async function fetchTenantSubdomain() {
  if (!tenantId.value) {
    tenantSubdomain.value = ''
    return
  }

  const cacheKey = `admin:account:${tenantId.value}`
  const ttl = 5 * 60 * 1000 // 5 minutes

  // Try to get from cache first
  const cached = useAdminCache().getCached<{
    tenant: {
      mtSubdomain: string
    }
  }>(cacheKey)
  
  if (cached?.tenant?.mtSubdomain) {
    tenantSubdomain.value = cached.tenant.mtSubdomain
  }

  // Fetch with cache-first strategy
  try {
    const data = await fetchWithCache(
      cacheKey,
      async () => {
        const response = await $fetch<{
          data: {
            tenant: {
              id: string
              name: string
              slug: string
              mtSubdomain: string
            }
          }
        }>(`/admin/${tenantId.value}/account`, {
          baseURL: config.public.backendUrl,
          credentials: 'include',
        })
        return response.data
      },
      {
        ttl,
        onBackgroundUpdate: (accountData: { tenant: { mtSubdomain: string } }) => {
          // Update UI when fresh data arrives
          if (accountData?.tenant?.mtSubdomain) {
            tenantSubdomain.value = accountData.tenant.mtSubdomain
          }
        },
      }
    )
    
    if (data?.tenant?.mtSubdomain) {
      tenantSubdomain.value = data.tenant.mtSubdomain
    }
  } catch (e) {
    // Silently fail - subdomain is optional
    if (!tenantSubdomain.value) {
      tenantSubdomain.value = ''
    }
  }
}

// Logout function
async function logout() {
  userDropdownOpen.value = false
  mobileUserDropdownOpen.value = false
  
  await $fetch('/auth/logout', {
    baseURL: config.public.backendUrl,
    method: 'POST',
    credentials: 'include'
  }).catch(() => {})
  
  clearAuth()
  
  if (tenantId.value) {
    await router.push(`/admin/${tenantId.value}/auth/login`)
  } else {
    await router.push('/admin')
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

// Check if route is active for navigation highlighting
function isActiveRoute(path: string): boolean {
  if (!path || !tenantId.value) return false
  const currentPath = route.path
  
  // Handle dashboard route (exact match)
  const dashboardPath = `/admin/${tenantId.value}`
  if (path === dashboardPath || path === '/admin') {
    return currentPath === dashboardPath
  }
  
  // For other routes, check if current path starts with the route path
  if (currentPath.startsWith(path)) {
    // If it's exactly the path, it's active
    if (currentPath === path) return true
    // If the next character is /, it's a child route, so still active
    if (currentPath.length > path.length && currentPath[path.length] === '/') return true
  }
  
  return false
}
</script>
