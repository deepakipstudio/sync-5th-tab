<template>
  <div
    :class="cn(
      'rounded-lg',
      {
        'border border-admin-border bg-admin-surface-base': variant === 'default',
        'border border-admin-border bg-admin-surface-base shadow-sm': variant === 'elevated',
        'bg-admin-surface-base': variant === 'flat',
      },
      ($attrs.class as string)
    )"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface CardProps {
  variant?: 'default' | 'elevated' | 'flat'
}

withDefaults(defineProps<CardProps>(), {
  variant: 'default',
})
</script>

