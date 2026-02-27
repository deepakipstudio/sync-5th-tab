<template>
  <div
    :class="[
      'bg-white rounded-xl border-2 p-4 cursor-pointer transition-all',
      isSelected
        ? 'border-[var(--tenant-primary)] shadow-md'
        : 'border-gray-200 hover:border-[var(--tenant-primary)] hover:shadow-sm'
    ]"
    @click="$emit('select', location.id)"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-gray-900 mb-1.5">{{ location.name }}</h3>
        <p v-if="location.address" class="text-sm text-gray-600 mb-1">{{ location.address }}</p>
        <p v-if="location.hours" class="text-sm text-gray-500">{{ location.hours }}</p>
      </div>
      <div v-if="isSelected" class="ml-4 shrink-0">
        <div
          class="w-6 h-6 rounded-full flex items-center justify-center"
          :style="{ backgroundColor: 'var(--tenant-primary)' }"
        >
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Location {
  id: string
  name: string
  address?: string
  hours?: string
}

defineProps<{
  location: Location
  isSelected: boolean
}>()

defineEmits<{
  select: [id: string]
}>()
</script>

