<template>
  <div>
    <ShopHeader
      :tenant-id="tenantId"
      :cart-count="0"
      @open-cart="cartOpen = true"
    />
    <slot />
    <ShopCartDrawer :open="cartOpen" @close="cartOpen = false" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const tenantId = computed(() => route.params.tenant as string | undefined)

const cartOpen = ref(false)

useTenantBranding(tenantId)
</script>

