<template>
  <div
    :class="cn('animate-pulse rounded bg-admin-surface-raised', ($attrs.class as string))"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'
</script>

