<template>
  <DropdownMenuSeparator
    :class="cn('-mx-1 my-1 h-px bg-admin-border', $attrs.class)"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { DropdownMenuSeparator } from 'radix-vue'
import { cn } from '~/lib/utils'
</script>

