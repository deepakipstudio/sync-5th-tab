const DEFAULT_PRIMARY = '#8e213e'
const DEFAULT_SECONDARY = '#a83d5a'

interface TenantBranding {
  primaryBrandColor: string | null
  secondaryBrandColor: string | null
}

export function useTenantBranding(tenantId: Ref<string | undefined> | ComputedRef<string | undefined> | string | undefined) {
  const config = useRuntimeConfig()
  const primaryColor = ref<string>(DEFAULT_PRIMARY)
  const secondaryColor = ref<string>(DEFAULT_SECONDARY)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Convert tenantId to a computed ref if it's not already reactive
  const tenantIdRef = typeof tenantId === 'string' || tenantId === undefined
    ? computed(() => tenantId)
    : tenantId

  async function fetchBranding() {
    const id = unref(tenantIdRef)
    if (!id) {
      // Use defaults if no tenant
      primaryColor.value = DEFAULT_PRIMARY
      secondaryColor.value = DEFAULT_SECONDARY
      injectCSSVariables()
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<TenantBranding>(`/tenants/${id}/branding`, {
        baseURL: config.public.backendUrl,
        credentials: 'include',
      })

      // Use tenant colors if available, otherwise fall back to defaults
      primaryColor.value = data.primaryBrandColor || DEFAULT_PRIMARY
      secondaryColor.value = data.secondaryBrandColor || DEFAULT_SECONDARY

      injectCSSVariables()
    } catch (e: any) {
      error.value = e.data?.error || e.message || 'Failed to load branding'
      // Use defaults on error
      primaryColor.value = DEFAULT_PRIMARY
      secondaryColor.value = DEFAULT_SECONDARY
      injectCSSVariables()
    } finally {
      loading.value = false
    }
  }

  function injectCSSVariables() {
    // Only inject if we're in a browser environment
    if (typeof document === 'undefined') return

    // Remove existing style tag if it exists
    const existingStyle = document.getElementById('tenant-branding-styles')
    if (existingStyle) {
      existingStyle.remove()
    }

    // Create and inject style tag
    const style = document.createElement('style')
    style.id = 'tenant-branding-styles'
    style.textContent = `
      :root {
        --tenant-primary: ${primaryColor.value};
        --tenant-secondary: ${secondaryColor.value};
      }
    `
    document.head.appendChild(style)
  }

  // Watch tenantId and refetch when it changes
  watch(tenantIdRef, (newId) => {
    if (newId) {
      fetchBranding()
    } else {
      // Use defaults if no tenant
      primaryColor.value = DEFAULT_PRIMARY
      secondaryColor.value = DEFAULT_SECONDARY
      injectCSSVariables()
    }
  }, { immediate: true })

  return {
    primaryColor: readonly(primaryColor),
    secondaryColor: readonly(secondaryColor),
    loading: readonly(loading),
    error: readonly(error),
    fetchBranding,
  }
}

