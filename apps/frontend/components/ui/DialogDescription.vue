<template>
  <DialogDescription
    :class="cn('text-sm text-admin-text-secondary', $attrs.class)"
    v-bind="$attrs"
  >
    <slot />
  </DialogDescription>
</script>

<script setup lang="ts">
import { DialogDescription } from 'radix-vue'
import { cn } from '~/lib/utils'
</script>

