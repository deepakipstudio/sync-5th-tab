<template>
  <SwitchRoot
    :class="cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand-strong focus-visible:ring-offset-2 focus-visible:ring-offset-admin-surface-base disabled:cursor-not-allowed disabled:opacity-50',
      checked ? 'bg-admin-brand-strong' : 'bg-admin-surface-raised',
      ($attrs.class as string)
    )"
    :checked="checked"
    @update:checked="(value) => $emit('update:checked', value)"
    v-bind="$attrs"
  >
    <SwitchThumb
      :class="cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-admin-surface-base shadow ring-0 transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0'
      )"
    />
  </SwitchRoot>
</template>

<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'radix-vue'
import { cn } from '~/lib/utils'

export interface SwitchProps {
  checked?: boolean
}

withDefaults(defineProps<SwitchProps>(), {
  checked: false,
})

defineEmits<{
  'update:checked': [value: boolean]
}>()
</script>

