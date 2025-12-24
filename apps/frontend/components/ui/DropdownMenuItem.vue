<template>
  <DropdownMenuItem
    :class="cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-4 py-2 text-sm text-admin-text-primary outline-none transition-colors focus:bg-admin-surface-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      $attrs.class
    )"
    v-bind="$attrs"
  >
    <slot />
  </DropdownMenuItem>
</template>

<script setup lang="ts">
import { DropdownMenuItem } from 'radix-vue'
import { cn } from '~/lib/utils'
</script>

