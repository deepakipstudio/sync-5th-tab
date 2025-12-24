<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger
      :class="cn('outline-none', $attrs.class)"
      v-bind="$attrs"
    >
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :class="cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-lg border border-admin-border bg-admin-surface-base p-1 text-admin-text-primary shadow-lg',
          $attrs.class
        )"
        v-bind="$attrs"
      >
        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
} from 'radix-vue'
import { cn } from '~/lib/utils'
</script>

