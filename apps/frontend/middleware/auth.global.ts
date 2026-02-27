export default defineNuxtRouteMiddleware(async (to) => {
  const { role, tenantId, authStatus, ensureAuthLoaded } = useAuth()
  const tenantParam = to.params.tenant as string | undefined

  // Skip auth check for login/callback pages
  if (to.path.includes('/auth/login') || to.path.includes('/auth/callback')) {
    return
  }

  // Skip auth for home page
  if (to.path === '/') {
    return
  }

  const isAdminRoute = to.path.startsWith('/admin/')
  const isShopRoute = to.path.startsWith('/shop/')
  const onTenantRoute = !!tenantParam && (isAdminRoute || isShopRoute)

  // Only guard tenant-specific admin/shop routes
  if (!onTenantRoute) {
    return
  }

  // Ensure auth is loaded once before making a decision
  if (authStatus.value === 'unknown') {
    await ensureAuthLoaded()
  }

  // If unauthenticated, send to the appropriate login page
  if (authStatus.value === 'unauthenticated') {
    if (isAdminRoute) {
      return navigateTo(`/admin/${tenantParam}/auth/login`)
    }
    if (isShopRoute) {
      return navigateTo(`/shop/${tenantParam}/auth/login`)
    }
    return
  }

  // At this point, user is authenticated. Optionally enforce canonical tenant id.
  if (tenantId.value && tenantParam && tenantParam !== tenantId.value) {
    const targetTenant = tenantId.value
    if (isAdminRoute) {
      return navigateTo(`/admin/${targetTenant}`)
    }
    if (isShopRoute) {
      return navigateTo(`/shop/${targetTenant}`)
    }
  }

  // Gate admin routes by role
  if (isAdminRoute && role.value !== 'admin') {
    return navigateTo(`/admin/${tenantParam}/auth/login`)
  }

  // Gate shop routes by customer role
  if (isShopRoute && role.value !== 'customer') {
    return navigateTo(`/shop/${tenantParam}/auth/login`)
  }
})

