<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="space-y-6 text-center">
      <h1 class="text-3xl font-bold">Welcome to {{ tenantName || 'your studio' }}</h1>
      <div v-if="isLoggedIn" class="space-y-4">
        <p class="text-lg">You are logged in as <strong>{{ userId }}</strong></p>
        <p class="text-sm text-gray-600">Role: {{ role }}</p>
        <div class="flex gap-4 justify-center">
          <NuxtLink 
            :to="`/admin/${tenantId}`" 
            class="px-4 py-2 rounded text-white"
            :style="{ backgroundColor: 'var(--tenant-primary, #8e213e)' }"
            v-if="role === 'admin'"
          >
            Admin Dashboard
          </NuxtLink>
          <button 
            @click="logout" 
            class="px-4 py-2 rounded text-white"
            :style="{ backgroundColor: 'var(--tenant-secondary, #a83d5a)' }"
          >
            Logout
          </button>
        </div>
      </div>
      <div v-else class="space-y-4">
        <p>Loading authentication...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'shop' })

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { role, userId, clearAuth } = useAuth()

const tenantId = computed(() => route.params.tenant as string)
const isLoggedIn = computed(() => !!role.value && !!userId.value)
const tenantName = ref('')

// Fetch tenant info to display name
onMounted(async () => {
  try {
    const data = await $fetch(`/tenants/${tenantId.value}`, {
      baseURL: config.public.backendUrl
    })
    if (data) {
      tenantName.value = (data as any).data?.name
    }
  } catch (_) {
    // Tenant not found or error
  }
})

async function logout() {
  await $fetch('/auth/logout', {
    baseURL: config.public.backendUrl,
    method: 'POST',
    credentials: 'include'
  }).catch(() => {})
  
  clearAuth()
  
  await router.push(`/shop/${tenantId.value}/auth/login`)
}
</script>
