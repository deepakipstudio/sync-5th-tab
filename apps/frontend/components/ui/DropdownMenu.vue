<template>
  <DropdownMenuRoot :open="open" @update:open="(value) => $emit('update:open', value)">
    <DropdownMenuTrigger
      :class="cn('outline-none', ($attrs.class as string))"
      v-bind="$attrs"
    >
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :class="cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-lg border border-admin-border bg-admin-surface-base p-1 text-admin-text-primary shadow-lg',
          ($attrs.class as string)
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

export interface DropdownMenuProps {
  open?: boolean
}

withDefaults(defineProps<DropdownMenuProps>(), {
  open: false,
})

defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

