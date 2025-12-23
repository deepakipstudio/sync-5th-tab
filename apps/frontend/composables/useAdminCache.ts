import { useAdminCacheStore } from '~/stores/adminCache'

interface FetchWithCacheOptions {
  ttl?: number
  forceRefresh?: boolean
  onBackgroundUpdate?: (data: any) => void
}

/**
 * Composable for admin cache operations
 */
export function useAdminCache() {
  const cacheStore = useAdminCacheStore()

  // Initialize cache from localStorage on first use
  if (typeof window !== 'undefined') {
    cacheStore.initFromStorage()
  }

  /**
   * Get cached data instantly
   */
  function getCached<T = any>(key: string): T | null {
    return cacheStore.get<T>(key)
  }

  /**
   * Check if cache entry is fresh
   */
  function isFresh(key: string, ttl?: number): boolean {
    return cacheStore.isFresh(key, ttl)
  }

  /**
   * Set cache entry
   */
  function setCache<T = any>(key: string, data: T, ttl?: number): void {
    cacheStore.set(key, data, ttl)
  }

  /**
   * Invalidate cache entry
   */
  function invalidate(key: string): void {
    cacheStore.clear(key)
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  function invalidatePattern(pattern: string | RegExp): void {
    cacheStore.clearPattern(pattern)
  }

  /**
   * Fetch data with cache-first strategy
   * Returns cached data immediately if available and fresh,
   * then fetches fresh data in background if needed
   */
  async function fetchWithCache<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    options: FetchWithCacheOptions = {}
  ): Promise<T> {
    const { ttl, forceRefresh = false, onBackgroundUpdate } = options

    // If force refresh, skip cache check
    if (forceRefresh) {
      const freshData = await fetcher()
      cacheStore.set(key, freshData, ttl)
      return freshData
    }

    // Check cache first
    const cached = getCached<T>(key)
    const fresh = isFresh(key, ttl)

    // If we have fresh cached data, return it immediately and refresh in background
    if (cached !== null && fresh) {
      // Trigger background refresh (don't await)
      fetcher()
        .then((freshData) => {
          cacheStore.set(key, freshData, ttl)
          if (onBackgroundUpdate) {
            onBackgroundUpdate(freshData)
          }
        })
        .catch((err) => {
          // Silently fail background refresh - we still have cached data
          console.warn('Background cache refresh failed:', err)
        })

      return cached
    }

    // If we have stale cached data, return it immediately and fetch fresh
    if (cached !== null && !fresh) {
      // Return stale data immediately
      const fetchPromise = fetcher()
        .then((freshData) => {
          cacheStore.set(key, freshData, ttl)
          if (onBackgroundUpdate) {
            onBackgroundUpdate(freshData)
          }
          return freshData
        })
        .catch((err) => {
          // If fetch fails, keep using stale data
          console.warn('Cache refresh failed, using stale data:', err)
          return cached
        })

      // Return stale data immediately, but also return the promise for fresh data
      // This allows the caller to await if they want fresh data
      return cached
    }

    // No cache, fetch and wait
    const freshData = await fetcher()
    cacheStore.set(key, freshData, ttl)
    return freshData
  }

  /**
   * Fetch data with cache-first strategy that returns both cached and fresh data
   * Useful when you want to show cached data immediately but also get fresh data
   */
  async function fetchWithCacheAndUpdate<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    options: FetchWithCacheOptions = {}
  ): Promise<{ cached: T | null; fresh: T }> {
    const { ttl, forceRefresh = false } = options

    // If force refresh, skip cache
    if (forceRefresh) {
      const freshData = await fetcher()
      cacheStore.set(key, freshData, ttl)
      return { cached: null, fresh: freshData }
    }

    // Get cached data
    const cached = getCached<T>(key)
    const fresh = isFresh(key, ttl)

    // Fetch fresh data
    const freshData = await fetcher()
    cacheStore.set(key, freshData, ttl)

    // Return both
    return { cached, fresh: freshData }
  }

  return {
    getCached,
    isFresh,
    setCache,
    invalidate,
    invalidatePattern,
    fetchWithCache,
    fetchWithCacheAndUpdate,
  }
}

