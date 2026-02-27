<template>
  <div class="min-h-screen bg-gray-50" :class="{ 'pb-24': selectedLocationId && !loading }">
    <!-- Header — no rounded bottom -->
    <div
      class="w-full pt-8 pb-14 px-4"
      :style="{ backgroundColor: 'var(--tenant-primary)' }"
    >
      <h1
        class="text-3xl font-bold text-center"
        :style="{ color: 'var(--tenant-primary-foreground)' }"
      >
        Pick Your Location
      </h1>
    </div>

    <!-- Location status card — always visible, overlaps the header -->
    <div class="mx-4 -mt-8 mb-4">
      <div class="bg-white rounded-xl shadow-md px-5 py-4">
        <template v-if="selectedLocation">
          <p class="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">Location</p>
          <p class="text-base font-semibold text-gray-900">{{ selectedLocation.name }}</p>
          <p v-if="selectedLocation.address" class="text-sm text-gray-500 mt-0.5">{{ selectedLocation.address }}</p>
        </template>
        <template v-else>
          <p class="text-sm text-gray-400 italic">Tap a location below to continue</p>
        </template>
      </div>
    </div>

    <!-- Location List -->
    <div class="px-4 pb-8 space-y-4">
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--tenant-primary)] mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading locations...</p>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <p class="text-red-600">{{ error }}</p>
        <button
          @click="fetchLocations"
          class="mt-4 px-4 py-2 rounded-md text-sm font-medium"
          :style="{
            backgroundColor: 'var(--tenant-primary)',
            color: 'var(--tenant-primary-foreground)'
          }"
        >
          Retry
        </button>
      </div>

      <div v-else-if="locations.length === 0" class="text-center py-8">
        <p class="text-gray-600">No locations available</p>
      </div>

      <div v-else class="space-y-4">
        <ShopLocationCard
          v-for="location in locations"
          :key="location.id"
          :location="location"
          :is-selected="selectedLocationId === location.id"
          @select="handleLocationSelect"
        />
      </div>
    </div>

    <!-- Floating Continue Button -->
    <Transition name="slide-up">
      <div
        v-if="selectedLocationId && !loading"
        class="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2"
      >
        <button
          @click="handleContinue"
          class="w-full py-3 px-6 rounded-xl font-semibold text-lg shadow-xl transition-all"
          :style="{
            backgroundColor: 'var(--tenant-primary)',
            color: 'var(--tenant-primary-foreground)'
          }"
        >
          Continue
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'shop' })

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const tenantId = computed(() => route.params.tenant as string)

const { locationId, setLocation } = useShopLocation(tenantId.value)
const selectedLocationId = ref<string | null>(locationId.value)
const locations = ref<Array<{ id: string; name: string; address?: string; hours?: string }>>([])
const loading = ref(false)
const error = ref<string | null>(null)

const selectedLocation = computed(() => {
  return locations.value.find(loc => loc.id === selectedLocationId.value)
})

async function fetchLocations() {
  loading.value = true
  error.value = null

  try {
    const data = await $fetch<{ locations: Array<{ id: string; name: string; address?: string; hours?: string }> }>(
      `/shop/${tenantId.value}/locations`,
      {
        baseURL: config.public.backendUrl,
        credentials: 'include',
      }
    )
    locations.value = data.locations || []
  } catch (e: any) {
    error.value = e.data?.error || e.message || 'Failed to fetch locations'
    locations.value = []
  } finally {
    loading.value = false
  }
}

function handleLocationSelect(id: string) {
  selectedLocationId.value = id
}

function handleContinue() {
  if (selectedLocationId.value) {
    setLocation(selectedLocationId.value, selectedLocation.value?.name)
    router.push(`/shop/${tenantId.value}`)
  }
}

onMounted(() => {
  fetchLocations()
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
