<template>
  <nav class="flex items-center space-x-2 text-sm text-admin-text-secondary mb-4">
    <NuxtLink
      v-if="tenantId"
      :to="`/admin/${tenantId}`"
      class="hover:text-admin-text-primary transition-colors"
    >
      Dashboard
    </NuxtLink>
    <template v-for="(item, index) in breadcrumbs" :key="index">
      <span class="text-admin-text-muted">/</span>
      <NuxtLink
        v-if="item.to"
        :to="item.to"
        class="hover:text-admin-text-primary transition-colors"
      >
        {{ item.label }}
      </NuxtLink>
      <span v-else class="text-admin-text-primary">{{ item.label }}</span>
    </template>
  </nav>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  to?: string
}

const route = useRoute()
const tenantId = computed(() => route.params.tenant as string | undefined)

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  if (!tenantId.value) return []

  const path = route.path
  const segments = path.split('/').filter(Boolean)
  
  // Remove 'admin' and tenant ID from segments
  const relevantSegments = segments.slice(2)
  
  if (relevantSegments.length === 0) return []

  const items: BreadcrumbItem[] = []
  
  // Map route segments to readable labels
  const labelMap: Record<string, string> = {
    'store-settings': 'Store Settings',
    'products': 'Products',
    'account': 'Account',
    'add': 'Add',
    'edit': 'Edit',
  }

  // Build breadcrumb items
  let currentPath = `/admin/${tenantId.value}`
  
  for (let i = 0; i < relevantSegments.length; i++) {
    const segment = relevantSegments[i]
    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    
    // Don't create link for last item (current page)
    if (i === relevantSegments.length - 1) {
      items.push({ label })
    } else {
      currentPath += `/${segment}`
      items.push({ label, to: currentPath })
    }
  }

  return items
})
</script>

