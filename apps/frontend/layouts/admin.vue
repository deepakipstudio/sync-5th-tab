<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <aside class="hidden md:flex md:w-64 bg-gray-900 text-gray-100 flex-col">
      <div class="h-16 flex items-center px-6 border-b border-gray-800">
        <span class="text-lg font-semibold">sync-5th-tab</span>
      </div>
      <nav class="flex-1 px-4 py-4 space-y-1 text-sm">
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-gray-800"
        >
          Dashboard
        </NuxtLink>
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}/account` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-gray-800"
        >
          Account
        </NuxtLink>
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}/banners` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-gray-800"
        >
          Banners
        </NuxtLink>
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}/products` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-gray-800"
        >
          Products
        </NuxtLink>
      </nav>
      <div class="px-4 py-3 text-xs text-gray-500 border-t border-gray-800">
        Tenant: <span class="font-mono" v-if="tenantId">{{ tenantId }}</span>
        <span v-else>none</span>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- Top bar -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
        <div class="flex items-center gap-2">
          <span class="text-sm uppercase tracking-wide text-gray-500">Admin</span>
          <span class="hidden sm:inline text-gray-400">/</span>
          <span class="hidden sm:inline text-gray-700">Dashboard</span>
        </div>
        <div class="text-xs text-gray-500">
          {{ tenantId ? `Tenant: ${tenantId}` : 'No tenant selected' }}
        </div>
      </header>

      <!-- Page slot -->
      <main class="flex-1 p-4 md:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const tenantId = computed(() => route.params.tenant as string | undefined)
</script>
