<template>
  <input
    :class="cn(
      'flex h-10 w-full rounded-lg border border-admin-border bg-admin-surface-base px-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-brand-strong focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
      ($attrs.class as string)
    )"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

defineProps<{
  modelValue?: string | number
}>()

defineEmits<{
  'update:modelValue': [value: string | number]
}>()
</script>

