<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="space-y-4 text-center">
      <h1 class="text-2xl font-semibold">Completing admin login…</h1>
      <p v-if="err" class="text-red-600">{{ err }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const tenant = computed(() => route.params.tenant as string)
const err = ref('')
const { setAuth, authStatus } = useAuth()

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string
  const role = 'admin'
  const userId = (route.query.user_id as string) || 'placeholder-user'
  if (!code || !state) {
    err.value = 'Missing code/state'
    return
  }

  try {
    const response = await $fetch<{
      role: 'admin' | 'customer'
      tenantId: string
      userId: string
    }>('/auth/mt/callback', {
      baseURL: useRuntimeConfig().public.backendUrl,
      method: 'POST',
      body: { code, state, role, userId },
      credentials: 'include'
    })

    // Set auth state immediately after successful login
    if (response?.role && response?.tenantId) {
      setAuth({
        role: response.role,
        tenantId: response.tenantId,
        userId: response.userId || userId,
      })
      authStatus.value = 'authenticated'
    }

    router.replace(`/admin/${tenant.value}`)
  } catch (e: any) {
    err.value = e.data?.message || e.message || 'Authentication failed'
  }
})
</script>
