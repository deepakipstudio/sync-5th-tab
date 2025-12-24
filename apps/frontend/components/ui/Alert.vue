<template>
  <div
    :class="cn(alertVariants({ variant }), ($attrs.class as string))"
    role="alert"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const alertVariants = cva(
  'relative rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-admin-surface-base border-admin-border text-admin-text-primary',
        error: 'bg-admin-state-danger-soft border-admin-state-danger-border text-admin-state-danger-text',
        warning: 'bg-admin-state-warning-soft border-admin-state-warning-border text-admin-state-warning-text',
        info: 'bg-admin-state-info-soft border-admin-state-info-border text-admin-state-info-text',
        success: 'bg-admin-state-success-soft border-admin-state-success-border text-admin-state-success-text',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface AlertProps extends VariantProps<typeof alertVariants> {}

withDefaults(defineProps<AlertProps>(), {
  variant: 'default',
})
</script>

