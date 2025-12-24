<template>
  <div
    :class="cn(badgeVariants({ variant }), ($attrs.class as string))"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-admin-surface-raised text-admin-text-secondary',
        success: 'bg-admin-state-success-soft text-admin-state-success-text',
        warning: 'bg-admin-state-warning-soft text-admin-state-warning-text',
        danger: 'bg-admin-state-danger-soft text-admin-state-danger-text',
        info: 'bg-admin-state-info-soft text-admin-state-info-text',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends VariantProps<typeof badgeVariants> {}

withDefaults(defineProps<BadgeProps>(), {
  variant: 'default',
})
</script>

