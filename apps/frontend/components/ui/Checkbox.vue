<template>
  <CheckboxRoot
    :class="cn(
      'peer h-4 w-4 shrink-0 rounded border border-admin-border text-admin-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand-strong focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-admin-brand-strong data-[state=checked]:text-admin-text-inverse',
      ($attrs.class as string)
    )"
    :checked="checked"
    @update:checked="(value) => $emit('update:checked', value)"
    v-bind="$attrs"
  >
    <CheckboxIndicator
      class="flex items-center justify-center text-current"
    >
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
          d="M5 13l4 4L19 7"
        />
      </svg>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

<script setup lang="ts">
import { CheckboxRoot, CheckboxIndicator } from 'radix-vue'
import { cn } from '~/lib/utils'

export interface CheckboxProps {
  checked?: boolean
}

withDefaults(defineProps<CheckboxProps>(), {
  checked: false,
})

defineEmits<{
  'update:checked': [value: boolean]
}>()
</script>

