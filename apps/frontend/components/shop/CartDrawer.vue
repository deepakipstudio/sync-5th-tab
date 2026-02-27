<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/40"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Drawer -->
    <Transition name="slide-right">
      <div
        v-if="open"
        class="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-full flex flex-col shadow-2xl bg-white"
      >
        <!-- Header — primary brand color -->
        <div
          class="flex items-center justify-between px-4 h-14 shrink-0"
          :style="{ backgroundColor: 'var(--tenant-primary)', color: 'var(--tenant-primary-foreground)' }"
        >
          <h2 class="font-semibold text-base" style="color: inherit">Your Cart</h2>
          <button
            @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style="color: inherit; background: transparent;"
            aria-label="Close cart"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Empty state -->
        <div class="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div
            class="w-16 h-16 rounded-full flex items-center justify-center"
            :style="{ backgroundColor: 'var(--tenant-primary)', opacity: 0.08 }"
          />
          <svg
            class="w-10 h-10 absolute"
            viewBox="0 0 24 24"
            fill="none"
            :style="{ color: 'var(--tenant-primary)' }"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div>
            <p class="text-gray-700 font-medium">Your cart is empty</p>
            <p class="text-gray-400 text-sm mt-1">Add items to get started</p>
          </div>
        </div>

        <!-- Footer — checkout button -->
        <div class="shrink-0 px-4 py-4 border-t border-gray-100">
          <button
            class="w-full py-3 rounded-xl font-semibold text-base transition-opacity opacity-40 cursor-not-allowed"
            :style="{ backgroundColor: 'var(--tenant-primary)', color: 'var(--tenant-primary-foreground)' }"
            disabled
          >
            Checkout
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.25s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
