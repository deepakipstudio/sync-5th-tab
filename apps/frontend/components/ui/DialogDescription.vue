<template>
  <DialogDescription
    :class="cn('text-sm text-admin-text-secondary', ($attrs.class as string))"
    v-bind="$attrs"
  >
    <slot />
  </DialogDescription>
</template>

<script setup lang="ts">
import { DialogDescription } from 'radix-vue'
import { cn } from '~/lib/utils'
</script>

