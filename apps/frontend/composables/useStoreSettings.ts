export function useStoreSettings() {
  const config = useRuntimeConfig()
  const { fetchWithCache, invalidate } = useAdminCache()

  interface StoreInfo {
    storeName: string | null
    storeDescription: string | null
    contactEmail: string | null
    defaultLocationId: string | null
  }

  interface StoreHour {
    dayOfWeek: string
    openTime: string | null
    closeTime: string | null
    isOpen: boolean
  }

  interface Location {
    id: string
    name: string
  }

  interface StoreSettings {
    brandSettings: {
      primaryBrandColor: string | null
      secondaryBrandColor: string | null
    }
    banners: any[]
    storeInfo: StoreInfo
    storeHours: StoreHour[]
    locations: Location[]
  }

  /**
   * Fetch all store settings with caching
   */
  async function fetchStoreSettings(tenantId: string): Promise<StoreSettings> {
    const cacheKey = `admin:store-settings:${tenantId}`
    const ttl = 5 * 60 * 1000 // 5 minutes

    try {
      const data = await fetchWithCache<StoreSettings>(
        cacheKey,
        async () => {
          const response = await $fetch<StoreSettings>(
            `/admin/${tenantId}/store-settings`,
            {
              baseURL: config.public.backendUrl,
              credentials: 'include',
            }
          )
          return response
        },
        { ttl }
      )
      return data
    } catch (e: any) {
      console.error('Error fetching store settings:', e)
      throw e
    }
  }

  /**
   * Fetch available locations
   */
  async function fetchLocations(tenantId: string): Promise<Location[]> {
    const cacheKey = `admin:store-locations:${tenantId}`
    const ttl = 30 * 60 * 1000 // 30 minutes

    try {
      const data = await fetchWithCache<{ locations: Location[] }>(
        cacheKey,
        async () => {
          const response = await $fetch<{ locations: Location[] }>(
            `/admin/${tenantId}/store-settings/locations`,
            {
              baseURL: config.public.backendUrl,
              credentials: 'include',
            }
          )
          return response
        },
        { ttl }
      )
      return data.locations
    } catch (e: any) {
      console.error('Error fetching locations:', e)
      return []
    }
  }

  /**
   * Update store information
   */
  async function updateStoreInfo(
    tenantId: string,
    data: StoreInfo
  ): Promise<StoreInfo> {
    try {
      const response = await $fetch<{ storeInfo: StoreInfo }>(
        `/admin/${tenantId}/store-settings/store-info`,
        {
          baseURL: config.public.backendUrl,
          method: 'PUT',
          credentials: 'include',
          body: data,
        }
      )

      // Invalidate cache
      invalidate(`admin:store-settings:${tenantId}`)

      return response.storeInfo
    } catch (e: any) {
      console.error('Error updating store info:', e)
      throw e
    }
  }

  /**
   * Update store hours
   */
  async function updateStoreHours(
    tenantId: string,
    hours: StoreHour[]
  ): Promise<StoreHour[]> {
    try {
      const response = await $fetch<{ storeHours: StoreHour[] }>(
        `/admin/${tenantId}/store-settings/store-hours`,
        {
          baseURL: config.public.backendUrl,
          method: 'PUT',
          credentials: 'include',
          body: { storeHours: hours },
        }
      )

      // Invalidate cache
      invalidate(`admin:store-settings:${tenantId}`)

      return response.storeHours
    } catch (e: any) {
      console.error('Error updating store hours:', e)
      throw e
    }
  }

  /**
   * Invalidate store settings cache
   */
  function invalidateStoreSettings(tenantId: string) {
    invalidate(`admin:store-settings:${tenantId}`)
    invalidate(`admin:store-locations:${tenantId}`)
  }

  return {
    fetchStoreSettings,
    fetchLocations,
    updateStoreInfo,
    updateStoreHours,
    invalidateStoreSettings,
  }
}


