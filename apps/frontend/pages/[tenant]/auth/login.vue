<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="space-y-6 text-center">
      <h1 class="text-2xl font-semibold">Login</h1>
      <p>Logging in to {{ tenant }}...</p>
      <div v-if="loading" class="animate-pulse">
        <p>Redirecting to Marianatek...</p>
      </div>
      <div v-else-if="error" class="text-red-600">
        <p>{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const tenant = computed(() => route.params.tenant as string)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  if (!tenant.value) {
    error.value = 'Tenant not specified in URL'
    loading.value = false
    return
  }

  try {
    const { data, error: fetchError } = await useFetch('/auth/mt/redirect', {
      baseURL: useRuntimeConfig().public.backendUrl,
      params: { tenant: tenant.value },
      credentials: 'include'
    })
    if (fetchError.value) {
      error.value = fetchError.value.message || 'Failed to initiate login'
      loading.value = false
      return
    }
    const url = (data.value as any)?.url
    if (url) {
      window.location.href = url
    } else {
      error.value = 'Failed to get login URL'
      loading.value = false
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
    loading.value = false
  }
})
</script>
