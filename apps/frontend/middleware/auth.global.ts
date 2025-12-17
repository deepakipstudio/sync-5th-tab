export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  const { role, tenant, userId, preferredLocationId } = useAuth()
  const tenantParam = to.params.tenant as string

  // Skip auth check for login/callback pages
  if (to.path.includes('/auth/login') || to.path.includes('/auth/callback')) {
    return
  }

  // Skip auth for home page
  if (to.path === '/') {
    return
  }

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

  // Determine if admin or shop route
  const isAdminRoute = to.path.startsWith('/admin/')
  const isShopRoute = to.path.startsWith('/shop/')

  // If user is not logged in and on a tenant route, redirect to login
  if (!role.value && tenantParam) {
    if (isAdminRoute) {
      return navigateTo(`/admin/${tenantParam}/auth/login`)
    } else if (isShopRoute) {
      return navigateTo(`/shop/${tenantParam}/auth/login`)
    }
  }

  // Gate admin routes by role
  if (isAdminRoute && role.value !== 'admin') {
    return navigateTo(`/admin/${tenantParam}/auth/login`)
  }
})

