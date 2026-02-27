export function useShopLocation(tenantId: string) {
  const locationId = useState<string | null>(`shop_${tenantId}_location`, () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`shop_${tenantId}_location`)
    }
    return null
  })

  const locationName = useState<string | null>(`shop_${tenantId}_location_name`, () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`shop_${tenantId}_location_name`)
    }
    return null
  })
  
  function setLocation(id: string, name?: string) {
    locationId.value = id
    locationName.value = name ?? null
    if (typeof window !== 'undefined') {
      localStorage.setItem(`shop_${tenantId}_location`, id)
      if (name) {
        localStorage.setItem(`shop_${tenantId}_location_name`, name)
      } else {
        localStorage.removeItem(`shop_${tenantId}_location_name`)
      }
    }
  }
  
  function clearLocation() {
    locationId.value = null
    locationName.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`shop_${tenantId}_location`)
      localStorage.removeItem(`shop_${tenantId}_location_name`)
    }
  }
  
  return { locationId, locationName, setLocation, clearLocation }
}

