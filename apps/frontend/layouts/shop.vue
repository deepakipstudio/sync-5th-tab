<template>
  <div>
    <slot />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const tenantId = computed(() => route.params.tenant as string | undefined)

// Initialize tenant branding - pass the computed ref so it's reactive
useTenantBranding(tenantId)
</script>

