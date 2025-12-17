<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="space-y-6 text-center">
      <h1 class="text-2xl font-semibold">Login</h1>
      <p>Select tenant and continue.</p>
      <div class="space-x-2">
        <select v-model="tenant" class="border rounded px-3 py-2">
          <option disabled value="">Choose tenant…</option>
          <option value="demo">demo</option>
        </select>
        <button @click="start" class="bg-black text-white px-4 py-2 rounded">Continue</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const tenant = ref('')

async function start() {
  if (!tenant.value) return
  const { data, error } = await useFetch('/auth/mt/redirect', {
    baseURL: useRuntimeConfig().public.backendUrl,
    params: { tenant: tenant.value },
    credentials: 'include'
  })
  if (error.value) return alert(error.value.message)
  const url = (data.value as any)?.url
  if (url) window.location.href = url
}
</script>
