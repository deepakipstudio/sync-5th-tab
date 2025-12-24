<template>
  <button
    :class="cn(buttonVariants({ variant, size }), ($attrs.class as string))"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { cva } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand-strong focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-admin-brand-strong text-admin-text-inverse hover:opacity-90',
        secondary: 'bg-admin-surface-raised text-admin-text-primary hover:bg-admin-surface-hover',
        danger: 'bg-admin-state-danger-text text-admin-text-inverse hover:opacity-90',
        ghost: 'bg-transparent text-admin-text-primary hover:bg-admin-surface-hover',
        outline: 'border border-admin-border bg-admin-surface-base text-admin-text-primary hover:bg-admin-surface-hover',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-sm',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps {
  variant?: 'default' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
}

withDefaults(defineProps<ButtonProps>(), {
  variant: 'default',
  size: 'default',
  disabled: false,
})
</script>

