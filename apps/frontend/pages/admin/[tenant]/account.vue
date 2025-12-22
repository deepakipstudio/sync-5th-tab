<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-admin-text-primary">Account</h1>
      <p class="text-sm text-admin-text-secondary mt-1">View your account details and settings</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-8">
      <!-- Tenant Info Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6 animate-pulse">
        <div class="h-6 bg-admin-surface-raised rounded w-1/3 mb-6"></div>
        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-4 py-3 border-b border-admin-border-subtle">
            <div class="h-4 bg-admin-surface-raised rounded w-1/4"></div>
            <div class="h-4 bg-admin-surface-raised rounded w-3/4 col-span-2"></div>
          </div>
          <div class="grid grid-cols-3 gap-4 py-3 border-b border-admin-border-subtle">
            <div class="h-4 bg-admin-surface-raised rounded w-1/4"></div>
            <div class="h-4 bg-admin-surface-raised rounded w-3/4 col-span-2"></div>
          </div>
          <div class="grid grid-cols-3 gap-4 py-3">
            <div class="h-4 bg-admin-surface-raised rounded w-1/4"></div>
            <div class="h-4 bg-admin-surface-raised rounded w-3/4 col-span-2"></div>
          </div>
        </div>
      </div>
      <!-- Session Info Skeleton -->
      <div class="bg-admin-surface-base rounded-lg border border-admin-border p-6 animate-pulse">
        <div class="h-6 bg-admin-surface-raised rounded w-1/4 mb-6"></div>
        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-4 py-3">
            <div class="h-4 bg-admin-surface-raised rounded w-1/4"></div>
            <div class="h-4 bg-admin-surface-raised rounded w-1/4 col-span-2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-admin-state-danger-soft border border-admin-state-danger-border rounded-lg p-4 text-admin-state-danger-text">
      <p class="font-medium">Failed to load account information</p>
      <p class="text-sm mt-1">{{ error }}</p>
      <button
        @click="fetchAccount"
        class="mt-4 bg-admin-state-danger-text text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-colors"
      >
        Try Again
      </button>
    </div>

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
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-brand-soft text-admin-brand-strong">
                {{ account.role }}
              </span>
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
const loading = ref(true)
const error = ref('')

async function fetchAccount() {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<{ data: AccountData }>(`/admin/${tenantId.value}/account`, {
      baseURL: config.public.backendUrl,
      credentials: 'include',
    })
    account.value = response.data
  } catch (e: any) {
    error.value = e.data?.error || e.message || 'Unknown error'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAccount()
})
</script>
