import { defineStore } from 'pinia'
import { adminCacheConfig } from '~/composables/useAdminCacheConfig'

interface CacheEntry<T = any> {
  data: T
  fetchedAt: number
  ttl?: number
}

interface CacheState {
  cache: Record<string, CacheEntry>
}

const STORAGE_KEY = 'admin-cache'
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

export const useAdminCacheStore = defineStore('adminCache', {
  state: (): CacheState => ({
    cache: {},
  }),

  getters: {
    /**
     * Get cached data by key
     */
    get<T = any>(state: CacheState) {
      return (key: string): T | null => {
        // If cache is disabled, always return null (cache miss)
        if (!adminCacheConfig.enabled) {
          return null
        }
        
        const entry = state.cache[key]
        if (!entry) {
          // Try to load from localStorage
          return loadFromStorage<T>(key)
        }
        return entry.data as T
      }
    },

    /**
     * Check if cache entry exists and is fresh
     */
    isFresh(state: CacheState) {
      return (key: string, ttl?: number): boolean => {
        // If cache is disabled, always return false (always stale)
        if (!adminCacheConfig.enabled) {
          return false
        }
        
        const entry = state.cache[key]
        if (!entry) {
          // Check localStorage
          const stored = loadFromStorage(key)
          if (!stored) return false
          const storedEntry = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${key}`) || '{}')
          if (!storedEntry.fetchedAt) return false
          const effectiveTtl = ttl || storedEntry.ttl || DEFAULT_TTL
          return Date.now() - storedEntry.fetchedAt < effectiveTtl
        }
        const effectiveTtl = ttl || entry.ttl || DEFAULT_TTL
        return Date.now() - entry.fetchedAt < effectiveTtl
      }
    },
  },

  actions: {
    /**
     * Set cache entry
     */
    set<T = any>(key: string, data: T, ttl?: number): void {
      // If cache is disabled, no-op (don't store anything)
      if (!adminCacheConfig.enabled) {
        return
      }
      
      const entry: CacheEntry<T> = {
        data,
        fetchedAt: Date.now(),
        ttl,
      }
      this.cache[key] = entry

      // Persist to localStorage (only for non-sensitive data)
      if (typeof window !== 'undefined' && !key.includes('sensitive')) {
        try {
          localStorage.setItem(
            `${STORAGE_KEY}:${key}`,
            JSON.stringify({
              data,
              fetchedAt: entry.fetchedAt,
              ttl: ttl || DEFAULT_TTL,
            })
          )
        } catch (e) {
          // localStorage quota exceeded or disabled
          console.warn('Failed to persist cache to localStorage:', e)
        }
      }
    },

    /**
     * Clear specific cache entry
     */
    clear(key: string): void {
      delete this.cache[key]
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`${STORAGE_KEY}:${key}`)
      }
    },

    /**
     * Clear all cache entries
     */
    clearAll(): void {
      this.cache = {}
      if (typeof window !== 'undefined') {
        // Clear all admin cache entries from localStorage
        const keys = Object.keys(localStorage).filter((k) => k.startsWith(`${STORAGE_KEY}:`))
        keys.forEach((k) => localStorage.removeItem(k))
      }
    },

    /**
     * Clear cache entries matching a pattern
     */
    clearPattern(pattern: string | RegExp): void {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
      const keysToDelete: string[] = []

      // Clear from memory
      for (const key in this.cache) {
        if (regex.test(key)) {
          keysToDelete.push(key)
          delete this.cache[key]
        }
      }

      // Clear from localStorage
      if (typeof window !== 'undefined') {
        const storageKeys = Object.keys(localStorage).filter((k) => k.startsWith(`${STORAGE_KEY}:`))
        storageKeys.forEach((storageKey) => {
          const key = storageKey.replace(`${STORAGE_KEY}:`, '')
          if (regex.test(key)) {
            localStorage.removeItem(storageKey)
          }
        })
      }
    },

    /**
     * Initialize cache from localStorage on store creation
     */
    initFromStorage(): void {
      // If cache is disabled, no-op (don't load from storage)
      if (!adminCacheConfig.enabled) {
        return
      }
      
      if (typeof window === 'undefined') return

      try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith(`${STORAGE_KEY}:`))
        keys.forEach((storageKey) => {
          const key = storageKey.replace(`${STORAGE_KEY}:`, '')
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            try {
              const entry = JSON.parse(stored)
              // Only load if not expired
              const ttl = entry.ttl || DEFAULT_TTL
              if (Date.now() - entry.fetchedAt < ttl) {
                this.cache[key] = {
                  data: entry.data,
                  fetchedAt: entry.fetchedAt,
                  ttl: entry.ttl,
                }
              } else {
                // Remove expired entry
                localStorage.removeItem(storageKey)
              }
            } catch (e) {
              // Invalid JSON, remove it
              localStorage.removeItem(storageKey)
            }
          }
        })
      } catch (e) {
        console.warn('Failed to initialize cache from localStorage:', e)
      }
    },
  },
})

/**
 * Load data from localStorage
 */
function loadFromStorage<T = any>(key: string): T | null {
  // If cache is disabled, don't load from storage
  if (!adminCacheConfig.enabled) {
    return null
  }
  
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}:${key}`)
    if (!stored) return null

    const entry = JSON.parse(stored)
    const ttl = entry.ttl || DEFAULT_TTL

    // Check if expired
    if (Date.now() - entry.fetchedAt >= ttl) {
      localStorage.removeItem(`${STORAGE_KEY}:${key}`)
      return null
    }

    return entry.data as T
  } catch (e) {
    return null
  }
}

