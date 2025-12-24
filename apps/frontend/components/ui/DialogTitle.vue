<template>
  <DialogTitle
    :class="cn('text-lg font-semibold text-admin-text-primary', $attrs.class)"
    v-bind="$attrs"
  >
    <slot />
  </DialogTitle>
</template>

<script setup lang="ts">
import { DialogTitle } from 'radix-vue'
import { cn } from '~/lib/utils'
</script>

