/**
 * Navigation helper for admin pages
 * Handles passing data between pages via route state
 */
export function useAdminNavigation() {
  const route = useRoute()

  /**
   * Navigate to add product page with product data
   */
  function navigateToProductAdd(productData?: {
    mtProductId: string
    productName?: string
    productDescription?: string
    [key: string]: any
  }) {
    const tenantId = route.params.tenant as string
    const url = `/admin/${tenantId}/products/add`
    
    if (productData?.mtProductId) {
      // Store product data in sessionStorage before navigation
      if (productData && typeof window !== 'undefined') {
        const stateKey = `route-state:${url}`
        sessionStorage.setItem(stateKey, JSON.stringify(productData))
      }
      // Use query params for mtProductId (required)
      navigateTo({
        path: url,
        query: {
          mtProductId: productData.mtProductId,
        },
      })
    } else {
      navigateTo(url)
    }
  }

  /**
   * Navigate to edit product page with optional product data
   * Now uses MT product ID instead of database UUID
   */
  function navigateToProductEdit(mtProductId: string, productData?: {
    productName?: string
    productDescription?: string
    [key: string]: any
  }) {
    const tenantId = route.params.tenant as string
    const url = `/admin/${tenantId}/products/edit/${mtProductId}`
    
    if (productData && typeof window !== 'undefined') {
      // Store product data in sessionStorage before navigation
      const stateKey = `route-state:${url}`
      sessionStorage.setItem(stateKey, JSON.stringify(productData))
    }
    
    navigateTo(url)
  }

  /**
   * Get route state data (data passed via navigateTo state)
   */
  function getRouteState<T = any>(): T | null {
    if (typeof window === 'undefined') return null
    
    // Nuxt doesn't have built-in route state, so we use sessionStorage as a workaround
    // This is a temporary solution - in a real app you might use a state management solution
    const stateKey = `route-state:${route.path}`
    try {
      const stored = sessionStorage.getItem(stateKey)
      if (stored) {
        const data = JSON.parse(stored)
        // Clear after reading (one-time use)
        sessionStorage.removeItem(stateKey)
        return data as T
      }
    } catch (e) {
      console.warn('Failed to read route state:', e)
    }
    return null
  }

  /**
   * Set route state data (internal use)
   */
  function setRouteState<T = any>(data: T): void {
    if (typeof window === 'undefined') return
    
    const stateKey = `route-state:${route.path}`
    try {
      sessionStorage.setItem(stateKey, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to set route state:', e)
    }
  }

  return {
    navigateToProductAdd,
    navigateToProductEdit,
    getRouteState,
    setRouteState,
  }
}

