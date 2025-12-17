<template>
  <div class="p-8 space-y-6">
    <h1 class="text-2xl font-semibold">{{ tenant }} - Admin Dashboard</h1>
    <form class="space-y-4" @submit.prevent="submit">
      <div class="grid gap-3 grid-cols-2 max-w-xl">
        <input v-model="imageUrl" placeholder="banner image URL" class="border rounded px-3 py-2" />
        <input v-model.number="collectionId" type="number" placeholder="collectionId" class="border rounded px-3 py-2" />
        <input v-model="productClass" placeholder="productClass" class="border rounded px-3 py-2" />
        <input v-model="expiresAt" type="datetime-local" class="border rounded px-3 py-2" />
        <input v-model.number="sortOrder" type="number" placeholder="sortOrder" class="border rounded px-3 py-2" />
        <label class="flex items-center gap-2"><input type="checkbox" v-model="visible" /> Visible</label>
      </div>
      <button class="bg-black text-white px-4 py-2 rounded">Save Banner</button>
    </form>
    <p v-if="msg" class="text-green-700">{{ msg }}</p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const tenant = computed(() => route.params.tenant as string)

const imageUrl = ref('')
const collectionId = ref<number|undefined>()
const productClass = ref('')
const expiresAt = ref('')
const sortOrder = ref<number|undefined>()
const visible = ref(true)
const msg = ref('')

async function submit() {
  msg.value = ''
  const { error } = await useFetch(`/admin/${tenant.value}/banners`, {
    baseURL: config.public.backendUrl,
    method: 'POST',
    body: {
      imageUrl: imageUrl.value,
      collectionId: collectionId.value,
      productClass: productClass.value,
      expiresAt: expiresAt.value ? new Date(expiresAt.value).toISOString() : undefined,
      sortOrder: sortOrder.value,
      visible: visible.value
    },
    credentials: 'include'
  })
  if (error.value) return alert(error.value.message)
  msg.value = 'Banner saved'
}
</script>
