<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="space-y-4 text-center">
      <h1 class="text-2xl font-semibold">sync-5th-tab</h1>
      <p>Redirecting to login…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
onMounted(() => {
  router.replace('/auth/login')
})
</script>
