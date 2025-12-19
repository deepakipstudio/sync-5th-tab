export function useAuth() {
  // Core auth identity
  const role = useState<'admin' | 'customer' | null>('role', () => null)
  const tenantId = useState<string | null>('tenantId', () => null)
  const userId = useState<string | null>('userId', () => null)
  const preferredLocationId = useState<string | null>('preferredLocationId', () => null)

  // Auth lifecycle state
  const authStatus = useState<'unknown' | 'authenticated' | 'unauthenticated'>(
    'authStatus',
    () => 'unknown',
  )
  const authLoading = useState<boolean>('authLoading', () => false)

  function setAuth(payload: {
    role?: 'admin' | 'customer'
    tenantId?: string
    userId?: string
    preferredLocationId?: string | null
  }) {
    if (payload.role) role.value = payload.role
    if (payload.tenantId) tenantId.value = payload.tenantId
    if (payload.userId) userId.value = payload.userId
    if (payload.preferredLocationId !== undefined) {
      preferredLocationId.value = payload.preferredLocationId
    }
  }

  function clearAuth() {
    role.value = null
    tenantId.value = null
    userId.value = null
    preferredLocationId.value = null
    authStatus.value = 'unauthenticated'
  }

  // Promise to allow waiting for in-flight auth check
  let authPromise: Promise<'unknown' | 'authenticated' | 'unauthenticated'> | null = null

  async function ensureAuthLoaded(): Promise<'unknown' | 'authenticated' | 'unauthenticated'> {
    // If we've already resolved auth, don't refetch
    if (authStatus.value !== 'unknown') return authStatus.value

    // If already loading, wait for the current request to complete
    if (authLoading.value && authPromise) {
      return authPromise
    }

    const config = useRuntimeConfig()
    authLoading.value = true

    // Create and store the promise so concurrent calls can wait
    authPromise = (async () => {
      try {
        // Use $fetch instead of useFetch - no SSR caching issues
        const me = await $fetch<{
          role?: 'admin' | 'customer'
          tenantId?: string
          userId?: string
          preferredLocationId?: string | null
        }>('/me', {
          baseURL: config.public.backendUrl,
          credentials: 'include',
        })

        if (me?.role && me?.tenantId && me?.userId) {
          setAuth({
            role: me.role,
            tenantId: me.tenantId,
            userId: me.userId,
            preferredLocationId: me.preferredLocationId ?? null,
          })
          authStatus.value = 'authenticated'
        } else {
          clearAuth()
        }

        return authStatus.value
      } catch (_e) {
        clearAuth()
        return authStatus.value
      } finally {
        authLoading.value = false
        authPromise = null
      }
    })()

    return authPromise
  }

  return {
    role,
    tenantId,
    userId,
    preferredLocationId,
    authStatus,
    authLoading,
    setAuth,
    clearAuth,
    ensureAuthLoaded,
  }
}
