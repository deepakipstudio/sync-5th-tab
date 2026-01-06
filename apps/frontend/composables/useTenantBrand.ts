export function useTenantBrand() {
  const config = useRuntimeConfig()
  const { fetchWithCache, invalidate } = useAdminCache()

  interface TenantBrand {
    id: string
    brandName: string | null
    primaryColor: string | null
    primaryForegroundColor: string | null
    secondaryColor: string | null
    secondaryForegroundColor: string | null
    logoLightUrl: string | null
    logoDarkUrl: string | null
    createdAt: string
    updatedAt: string
  }

  /**
   * Fetch tenant brand data with caching
   */
  async function fetchBrand(tenantId: string): Promise<TenantBrand | null> {
    const cacheKey = `admin:tenant-brand:${tenantId}`
    const ttl = 30 * 60 * 1000 // 30 minutes

    try {
      const data = await fetchWithCache<TenantBrand>(
        cacheKey,
        async () => {
          const response = await $fetch<{ brand: TenantBrand }>(
            `/admin/${tenantId}/settings`,
            {
              baseURL: config.public.backendUrl,
              credentials: 'include',
            }
          )
          return response.brand
        },
        { ttl }
      )
      return data
    } catch (e: any) {
      // Return null if brand not found (404) or other errors
      if (e.statusCode === 404) {
        return null
      }
      console.error('Error fetching tenant brand:', e)
      return null
    }
  }

  /**
   * Sync brand data from Marianatek
   */
  async function syncBrand(tenantId: string): Promise<TenantBrand | null> {
    try {
      const response = await $fetch<{ ok: boolean; brand: TenantBrand }>(
        `/admin/${tenantId}/sync-brand`,
        {
          baseURL: config.public.backendUrl,
          method: 'POST',
          credentials: 'include',
        }
      )

      // Invalidate cache to force refresh
      invalidate(`admin:tenant-brand:${tenantId}`)
      invalidate(`admin:store-settings:${tenantId}`)

      return response.brand
    } catch (e: any) {
      console.error('Error syncing brand:', e)
      throw e
    }
  }

  /**
   * Invalidate brand cache
   */
  function invalidateBrand(tenantId: string) {
    invalidate(`admin:tenant-brand:${tenantId}`)
    invalidate(`admin:store-settings:${tenantId}`)
  }

  return {
    fetchBrand,
    syncBrand,
    invalidateBrand,
  }
}

