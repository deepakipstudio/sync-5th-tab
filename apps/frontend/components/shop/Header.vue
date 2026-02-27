<template>
  <header
    class="sticky top-0 z-40"
    :style="{ backgroundColor: 'var(--tenant-primary)', color: 'var(--tenant-primary-foreground)' }"
  >
    <div class="flex items-center justify-between px-4 h-14">
      <!-- Logo + name -->
      <NuxtLink :to="tenantId ? `/shop/${tenantId}` : '/'" class="flex items-center gap-2" style="color: inherit">
        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9h18M9 9V5a3 3 0 0 1 6 0v4M7 21h10a2 2 0 0 0 2-2V9H5v10a2 2 0 0 0 2 2Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="font-semibold text-base">Shop</span>
      </NuxtLink>

      <!-- Cart button -->
      <button
        @click="$emit('open-cart')"
        class="relative flex items-center justify-center w-10 h-10 transition-opacity hover:opacity-80"
        aria-label="Open cart"
        style="color: inherit"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span
          v-if="cartCount > 0"
          class="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center"
          :style="{ backgroundColor: 'var(--tenant-primary-foreground)', color: 'var(--tenant-primary)' }"
        >{{ cartCount }}</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  tenantId?: string
  cartCount?: number
}>()

defineEmits<{
  'open-cart': []
}>()
</script>
