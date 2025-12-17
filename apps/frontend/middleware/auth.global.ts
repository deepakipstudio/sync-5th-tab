export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  const { role, tenant, userId, preferredLocationId } = useAuth()

  // Fetch session from backend if not hydrated
  if (!role.value || !tenant.value || !userId.value) {
    try {
      const { data } = await useFetch('/me', {
        baseURL: config.public.backendUrl,
        credentials: 'include'
      })
      const me = data.value as any
      if (me?.role && me?.tenantId && me?.userId) {
        role.value = me.role
        tenant.value = me.tenantId
        userId.value = me.userId
        preferredLocationId.value = me.preferredLocationId || undefined
      }
    } catch (_) {
      // swallow
    }
  }

  // Gate admin routes by role
  if (to.path.startsWith('/admin')) {
    if (role.value !== 'admin') {
      return navigateTo('/auth/login')
    }
  }
})
