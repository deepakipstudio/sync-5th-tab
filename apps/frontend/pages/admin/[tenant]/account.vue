<template>
  <div class="p-8 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold">Account</h1>
      <NuxtLink
        :to="`/admin/${tenantId}`"
        class="text-gray-600 hover:text-gray-900"
      >
        ← Back to Dashboard
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white p-6 rounded-lg shadow">
      <div class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        <div class="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
      <p class="font-medium">Failed to load account information</p>
      <p class="text-sm mt-1">{{ error }}</p>
      <button
        @click="fetchAccount"
        class="mt-4 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
      >
        Try Again
      </button>
    </div>

    <!-- Account Info -->
    <div v-else-if="account" class="space-y-6">
      <!-- Tenant Info -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium mb-6 text-gray-900">Tenant Information</h2>
        
        <dl class="space-y-4">
          <div class="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
            <dt class="text-sm font-medium text-gray-500">Name</dt>
            <dd class="text-sm text-gray-900 col-span-2">{{ account.tenant?.name || '—' }}</dd>
          </div>

          <div class="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
            <dt class="text-sm font-medium text-gray-500">MT Subdomain</dt>
            <dd class="text-sm text-gray-900 col-span-2">
              <code class="bg-gray-100 px-2 py-1 rounded text-sm">{{ account.tenant?.mtSubdomain || '—' }}</code>
            </dd>
          </div>

          <div v-if="account.mtTenant?.email" class="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
            <dt class="text-sm font-medium text-gray-500">Email</dt>
            <dd class="text-sm text-gray-900 col-span-2">{{ account.mtTenant.email }}</dd>
          </div>

          <div v-if="account.mtTenant?.phone" class="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
            <dt class="text-sm font-medium text-gray-500">Phone</dt>
            <dd class="text-sm text-gray-900 col-span-2">{{ account.mtTenant.phone }}</dd>
          </div>

          <div v-if="account.mtTenant?.timezone" class="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
            <dt class="text-sm font-medium text-gray-500">Timezone</dt>
            <dd class="text-sm text-gray-900 col-span-2">{{ account.mtTenant.timezone }}</dd>
          </div>

          <div v-if="account.mtTenant?.currency" class="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
            <dt class="text-sm font-medium text-gray-500">Currency</dt>
            <dd class="text-sm text-gray-900 col-span-2">{{ account.mtTenant.currency }}</dd>
          </div>

          <div class="grid grid-cols-3 gap-4 py-3">
            <dt class="text-sm font-medium text-gray-500">Tenant ID</dt>
            <dd class="text-sm text-gray-900 col-span-2 font-mono">{{ account.tenant?.id || '—' }}</dd>
          </div>
        </dl>
      </div>

      <!-- Session Info -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium mb-6 text-gray-900">Session</h2>
        
        <dl class="space-y-4">
          <div class="grid grid-cols-3 gap-4 py-3">
            <dt class="text-sm font-medium text-gray-500">Role</dt>
            <dd class="text-sm col-span-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
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
