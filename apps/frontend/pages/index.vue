<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="space-y-8 text-center max-w-md">
      <div>
        <h1 class="text-4xl font-bold mb-2">sync-5th-tab</h1>
        <p class="text-gray-600">Multi-tenant booking system</p>
      </div>
      
      <div class="bg-white p-8 rounded-lg shadow-md">
        <p class="text-gray-700 mb-6">Choose your tenant to continue</p>
        
        <div class="space-y-3">
          <NuxtLink 
            :to="`/shop/${testTenantId}`"
            class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Shop - Test Studio
          </NuxtLink>
          <NuxtLink 
            :to="`/admin/${testTenantId}`"
            class="block w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Admin - Test Studio
          </NuxtLink>
        </div>
      </div>
      
      <p class="text-sm text-gray-500">Routes: /shop/[tenant-uuid] or /admin/[tenant-uuid]</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// This is the test tenant UUID from seed.ts - in production, fetch from API
const testTenantId = '019388b9-2e67-7b08-898d-8f8f2e90dd78'
</script>

