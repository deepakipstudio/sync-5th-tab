<template>
  <p
    :class="cn('text-sm text-admin-text-secondary', ($attrs.class as string))"
    v-bind="$attrs"
  >
    <slot />
  </p>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'
</script>

