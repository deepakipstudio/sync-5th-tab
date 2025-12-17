<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="space-y-6 text-center">
      <h1 class="text-3xl font-bold">Welcome to {{ tenantName || 'your studio' }}</h1>
      <div v-if="isLoggedIn" class="space-y-4">
        <p class="text-lg">You are logged in as <strong>{{ userId }}</strong></p>
        <p class="text-sm text-gray-600">Role: {{ role }}</p>
        <button @click="logout" class="bg-red-600 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>
      <div v-else class="space-y-4">
        <p>Loading authentication...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { role, userId, tenant } = useAuth()

const tenantId = computed(() => route.params.tenant as string)
const isLoggedIn = computed(() => !!role.value && !!userId.value)
const tenantName = ref('')

// Fetch tenant info to display name
onMounted(async () => {
  try {
    const { data } = await $fetch(`/tenants/${tenantId.value}`, {
      baseURL: config.public.backendUrl
    })
    if (data) {
      tenantName.value = (data as any).name
    }
  } catch (_) {
    // Tenant not found or error
  }
})

async function logout() {
  // Clear session cookie by calling backend
  await $fetch('/auth/logout', {
    baseURL: config.public.backendUrl,
    method: 'POST',
    credentials: 'include'
  }).catch(() => {})
  
  // Clear composable state
  role.value = ''
  userId.value = ''
  
  // Redirect to login
  await router.push(`/${tenantId.value}/auth/login`)
}
</script>
