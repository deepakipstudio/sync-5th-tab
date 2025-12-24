<template>
  <label
    :class="cn(
      'text-sm font-medium text-admin-text-primary',
      ($attrs.class as string)
    )"
    v-bind="$attrs"
  >
    <slot />
  </label>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'
</script>

