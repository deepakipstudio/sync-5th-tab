/**
 * Global admin cache configuration
 * 
 * Controls whether admin caching is enabled or disabled.
 * Can be toggled via environment variable: NUXT_PUBLIC_ADMIN_CACHE_ENABLED
 * 
 * When disabled:
 * - Cache get() returns null
 * - Cache isFresh() returns false
 * - Cache set() becomes a no-op
 * - Fetch logic continues to work normally (just without caching)
 */
export const adminCacheConfig = {
  /**
   * Whether caching is enabled
   * Default: true (caching ON by default)
   * Set to false via NUXT_PUBLIC_ADMIN_CACHE_ENABLED=false
   */
  get enabled(): boolean {
    if (typeof window === 'undefined') {
      // Server-side: check process.env
      const envValue = process.env.NUXT_PUBLIC_ADMIN_CACHE_ENABLED
      if (envValue === 'false' || envValue === '0' || envValue === '') {
        return false
      }
      return true // Default to enabled
    }
    
    // Client-side: check import.meta.env
    const envValue = import.meta.env.NUXT_PUBLIC_ADMIN_CACHE_ENABLED
    if (envValue === 'false' || envValue === '0' || envValue === '') {
      return false
    }
    return true // Default to enabled
  },
}

