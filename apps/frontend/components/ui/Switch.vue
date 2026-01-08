<template>
  <SwitchRoot
    :class="cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand-strong focus-visible:ring-offset-2 focus-visible:ring-offset-admin-surface-base disabled:cursor-not-allowed disabled:opacity-50',
      isChecked ? 'bg-admin-brand-strong' : 'bg-admin-surface-raised',
      ($attrs.class as string)
    )"
    :checked="isChecked"
    @update:checked="handleUpdate"
    v-bind="$attrs"
  >
    <SwitchThumb
      :class="cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-admin-surface-base shadow ring-0 transition-transform',
        isChecked ? 'translate-x-5' : 'translate-x-0'
      )"
    />
  </SwitchRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SwitchRoot, SwitchThumb } from 'radix-vue'
import { cn } from '~/lib/utils'

export interface SwitchProps {
  checked?: boolean
  modelValue?: boolean
}

const props = withDefaults(defineProps<SwitchProps>(), {
  checked: undefined,
  modelValue: undefined,
})

const emit = defineEmits<{
  'update:checked': [value: boolean]
  'update:modelValue': [value: boolean]
}>()

// Support both v-model (modelValue) and checked prop for backward compatibility
const isChecked = computed(() => {
  if (props.modelValue !== undefined) {
    return props.modelValue
  }
  return props.checked ?? false
})

function handleUpdate(value: boolean) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a6de727a-68a8-45e2-a4c6-8f390c9db417',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Switch.vue:49',message:'handleUpdate called',data:{value,modelValue:props.modelValue,checked:props.checked},timestamp:Date.now(),sessionId:'debug-session',runId:'switch-fix',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  // Emit both events for compatibility
  emit('update:checked', value)
  emit('update:modelValue', value)
}
</script>

