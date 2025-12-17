<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="space-y-4 text-center">
      <h1 class="text-2xl font-semibold">Completing login…</h1>
      <p v-if="err" class="text-red-600">{{ err }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const tenant = computed(() => route.params.tenant as string)
const err = ref('')

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string
  const role = (route.query.role as string) || 'customer'
  const userId = (route.query.user_id as string) || 'placeholder-user'
  if (!code || !state) {
    err.value = 'Missing code/state'
    return
  }
  const { error } = await useFetch('/auth/mt/callback', {
    baseURL: useRuntimeConfig().public.backendUrl,
    method: 'POST',
    body: { code, state, role, userId },
    credentials: 'include'
  })
  if (error.value) {
    err.value = error.value.message
    return
  }
  router.replace(`/shop/${tenant.value}`)
})
</script>
