<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-semibold text-admin-text-primary">Account</h1>
      <p class="text-sm text-admin-text-secondary mt-2">View your account details and settings</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-8">
      <!-- Tenant Info Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <UiSkeleton class="h-6 w-1/3 mb-6" />
        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-4 py-3 border-b border-admin-border-subtle">
            <UiSkeleton class="h-4 w-1/4" />
            <UiSkeleton class="h-4 w-3/4 col-span-2" />
          </div>
          <div class="grid grid-cols-3 gap-4 py-3 border-b border-admin-border-subtle">
            <UiSkeleton class="h-4 w-1/4" />
            <UiSkeleton class="h-4 w-3/4 col-span-2" />
          </div>
          <div class="grid grid-cols-3 gap-4 py-3">
            <UiSkeleton class="h-4 w-1/4" />
            <UiSkeleton class="h-4 w-3/4 col-span-2" />
          </div>
        </div>
      </div>
      <!-- Session Info Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <UiSkeleton class="h-6 w-1/4 mb-6" />
        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-4 py-3">
            <UiSkeleton class="h-4 w-1/4" />
            <UiSkeleton class="h-4 w-1/4 col-span-2" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <UiAlert v-else-if="error" variant="error">
      <p class="font-medium">Failed to load account information</p>
      <p class="text-sm mt-1">{{ error }}</p>
      <UiButton
        @click="fetchAccount"
        variant="danger"
        size="sm"
        class="mt-4"
      >
        Try Again
      </UiButton>
    </UiAlert>

    <!-- Account Info -->
    <div v-else-if="account" class="space-y-8">
      <!-- Tenant Info -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold mb-6 text-admin-text-primary">Tenant Information</h2>
        
        <dl class="space-y-4">
          <div class="grid grid-cols-3 gap-4 py-3 border-b border-admin-border-subtle">
            <dt class="text-sm font-medium text-admin-text-secondary">Name</dt>
            <dd class="text-sm text-admin-text-primary col-span-2">{{ account.tenant?.name || '—' }}</dd>
          </div>

          <div class="grid grid-cols-3 gap-4 py-3 border-b border-admin-border-subtle">
            <dt class="text-sm font-medium text-admin-text-secondary">MT Subdomain</dt>
            <dd class="text-sm text-admin-text-primary col-span-2">
              <code class="bg-admin-surface-raised px-2 py-1 rounded text-sm">{{ account.tenant?.mtSubdomain || '—' }}</code>
            </dd>
          </div>

          <div v-if="account.mtTenant?.email" class="grid grid-cols-3 gap-4 py-3 border-b border-admin-border-subtle">
            <dt class="text-sm font-medium text-admin-text-secondary">Email</dt>
            <dd class="text-sm text-admin-text-primary col-span-2">{{ account.mtTenant.email }}</dd>
          </div>

          <div v-if="account.mtTenant?.phone" class="grid grid-cols-3 gap-4 py-3 border-b border-admin-border-subtle">
            <dt class="text-sm font-medium text-admin-text-secondary">Phone</dt>
            <dd class="text-sm text-admin-text-primary col-span-2">{{ account.mtTenant.phone }}</dd>
          </div>

          <div v-if="account.mtTenant?.timezone" class="grid grid-cols-3 gap-4 py-3 border-b border-admin-border-subtle">
            <dt class="text-sm font-medium text-admin-text-secondary">Timezone</dt>
            <dd class="text-sm text-admin-text-primary col-span-2">{{ account.mtTenant.timezone }}</dd>
          </div>

          <div v-if="account.mtTenant?.currency" class="grid grid-cols-3 gap-4 py-3 border-b border-admin-border-subtle">
            <dt class="text-sm font-medium text-admin-text-secondary">Currency</dt>
            <dd class="text-sm text-admin-text-primary col-span-2">{{ account.mtTenant.currency }}</dd>
          </div>

          <div class="grid grid-cols-3 gap-4 py-3">
            <dt class="text-sm font-medium text-admin-text-secondary">Tenant ID</dt>
            <dd class="text-sm text-admin-text-primary col-span-2 font-mono">{{ account.tenant?.id || '—' }}</dd>
          </div>
        </dl>
      </div>

      <!-- Session Info -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6">
        <h2 class="text-lg font-semibold mb-6 text-admin-text-primary">Session</h2>
        
        <dl class="space-y-4">
          <div class="grid grid-cols-3 gap-4 py-3">
            <dt class="text-sm font-medium text-admin-text-secondary">Role</dt>
            <dd class="text-sm col-span-2">
              <UiBadge variant="default">
                {{ account.role }}
              </UiBadge>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const config = useRuntimeConfig()
const adminCache = useAdminCache()
const { fetchWithCache } = adminCache

const tenantId = computed(() => route.params.tenant as string)

interface AccountData {
  role: string
  tenant: {
    id: string
    name: string
    slug: string
    mtSubdomain: string
  }
  mtTenant?: {
    id: string
    name: string
    email?: string
    phone?: string
    timezone?: string
    currency?: string
  }
}

const account = ref<AccountData | null>(null)
const loading = ref(false) // Start as false - only show if no cache
const error = ref('')

// Try to get tenant name from layout cache
const tenantNameCacheKey = `admin:tenant-name:${tenantId.value}`
const cachedTenantName = adminCache.getCached<string>(tenantNameCacheKey)

// Initialize with cached tenant data if available
if (cachedTenantName) {
  account.value = {
    role: 'admin',
    tenant: {
      id: tenantId.value,
      name: cachedTenantName,
      slug: '',
      mtSubdomain: '',
    },
  }
}

async function fetchAccount() {
  const cacheKey = `admin:account:${tenantId.value}`
  const ttl = 5 * 60 * 1000 // 5 minutes

  // Check cache first
  const cached = adminCache.getCached<AccountData>(cacheKey)
  if (cached) {
    // Show cached data immediately
    account.value = cached
    loading.value = false
  } else if (!account.value) {
    // Only show loading if we don't have any data
    loading.value = true
  }

  error.value = ''

  try {
    const data = await fetchWithCache(
      cacheKey,
      async () => {
        const response = await $fetch<{ data: AccountData }>(`/admin/${tenantId.value}/account`, {
          baseURL: config.public.backendUrl,
          credentials: 'include',
        })
        return response.data
      },
      {
        ttl,
        onBackgroundUpdate: (freshData: AccountData) => {
          // Update UI when fresh data arrives
          account.value = freshData
        },
      }
    )
    account.value = data
  } catch (e: any) {
    error.value = e.data?.error || e.message || 'Unknown error'
    // If we have cached data, keep showing it even on error
    if (!cached && !account.value) {
      account.value = null
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAccount()
})
</script>
