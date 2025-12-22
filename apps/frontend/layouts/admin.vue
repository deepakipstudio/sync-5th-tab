<template>
  <div class="min-h-screen bg-admin-surface-sunken flex">
    <!-- Sidebar -->
    <aside class="hidden md:flex md:w-64 bg-admin-brand-strong text-admin-text-inverse flex-col">
      <div class="h-16 flex items-center px-6 border-b border-admin-border-strong">
        <span class="text-lg font-semibold">sync-5th-tab</span>
      </div>
      <nav class="flex-1 px-4 py-4 space-y-1 text-sm">
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
        >
          Dashboard
        </NuxtLink>
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}/account` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
        >
          Account
        </NuxtLink>
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}/banners` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
        >
          Banners
        </NuxtLink>
        <NuxtLink
          :to="tenantId ? `/admin/${tenantId}/products` : '/admin'"
          class="block px-3 py-2 rounded hover:bg-admin-brand-muted"
        >
          Products
        </NuxtLink>
      </nav>
      <div class="px-4 py-3 text-xs text-admin-text-secondary border-t border-admin-border-strong">
        Tenant: <span class="font-mono" v-if="tenantId">{{ tenantId }}</span>
        <span v-else>none</span>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- Top bar -->
      <header class="h-16 bg-admin-surface-base border-b border-admin-border flex items-center justify-between px-4 md:px-8">
        <div class="flex items-center gap-2">
          <span class="text-sm uppercase tracking-wide text-admin-text-secondary">Admin</span>
          <span class="hidden sm:inline text-admin-text-muted">/</span>
          <span class="hidden sm:inline text-admin-text-primary">Dashboard</span>
        </div>
        <div class="text-xs text-admin-text-secondary">
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
