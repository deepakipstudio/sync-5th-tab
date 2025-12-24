<template>
  <DialogClose
    :class="cn(
      'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-admin-surface-base transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-admin-brand-strong focus:ring-offset-2 disabled:pointer-events-none',
      $attrs.class
    )"
    v-bind="$attrs"
  >
    <slot>
      <svg
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </slot>
  </DialogClose>
</template>

<script setup lang="ts">
import { DialogClose } from 'radix-vue'
import { cn } from '~/lib/utils'
</script>

