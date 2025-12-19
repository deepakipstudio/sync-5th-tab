<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">{{ tenantName || 'Dashboard' }}</h1>
        <p class="text-sm text-gray-500 mt-1">Welcome to your admin dashboard</p>
      </div>
      <button
        @click="logout"
        class="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </div>

    <!-- Quick Actions Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Banners Card -->
      <NuxtLink
        :to="`/admin/${tenantId}/banners`"
        class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group"
      >
        <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
          <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-1">Banners</h3>
        <p class="text-sm text-gray-500">Manage promotional banners for your shop</p>
        <div class="mt-4 text-sm font-medium text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
          Manage banners
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </NuxtLink>

      <!-- Account Card -->
      <NuxtLink
        :to="`/admin/${tenantId}/account`"
        class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group"
      >
        <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
          <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-1">Account</h3>
        <p class="text-sm text-gray-500">View your account details and settings</p>
        <div class="mt-4 text-sm font-medium text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1">
          View account
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </NuxtLink>

      <!-- Products Card -->
      <NuxtLink
        :to="`/admin/${tenantId}/products`"
        class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group"
      >
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-1">Products</h3>
        <p class="text-sm text-gray-500">Manage products and inventory</p>
        <div class="mt-4 text-sm font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
          Manage products
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </NuxtLink>
    </div>

    <!-- Stats Overview (placeholder for future) -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Overview</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <p class="text-3xl font-semibold text-gray-900">--</p>
          <p class="text-sm text-gray-500 mt-1">Active Banners</p>
        </div>
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <p class="text-3xl font-semibold text-gray-900">{{ productCount }}</p>
          <p class="text-sm text-gray-500 mt-1">Total Products</p>
        </div>
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <p class="text-3xl font-semibold text-gray-900">--</p>
          <p class="text-sm text-gray-500 mt-1">Orders Today</p>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-4 text-center">
        Stats will be available when product sync is implemented
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { clearAuth } = useAuth()

const tenantId = computed(() => route.params.tenant as string)
const tenantName = ref('')
const productCount = ref(0)

// Fetch tenant info
onMounted(async () => {
  try {
    const data = await $fetch(`/tenants/${tenantId.value}`, {
      baseURL: config.public.backendUrl
    })
    if (data) {
      tenantName.value = (data as any).data?.name
    }
  } catch (_) {}

  // Fetch product count
  try {
    const productsData = await $fetch<{ products: any[] }>(`/admin/${tenantId.value}/products`, {
      baseURL: config.public.backendUrl,
      credentials: 'include',
    })
    productCount.value = productsData.products?.length || 0
  } catch (_) {
    productCount.value = 0
  }
})

async function logout() {
  await $fetch('/auth/logout', {
    baseURL: config.public.backendUrl,
    method: 'POST',
    credentials: 'include'
  }).catch(() => {})
  
  clearAuth()

  await router.push(`/admin/${tenantId.value}/auth/login`)
}
</script>
