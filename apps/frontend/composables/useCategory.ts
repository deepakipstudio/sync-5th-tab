import { useAdminCache } from './useAdminCache'

export interface Category {
  id: string
  name: string
  description: string | null
  slug: string
  imageUrl: string | null
  sortOrder: number | null
  productCount?: number
  deletedAt?: string | null
}

export interface CategoryCreateData {
  name: string
  description?: string
  slug?: string
  sortOrder?: number
  image?: File
}

export interface CategoryUpdateData {
  name?: string
  description?: string
  slug?: string
  sortOrder?: number
  image?: File
}

export function useCategory() {
  const config = useRuntimeConfig()
  const backendUrl = config.public.backendUrl
  const { fetchWithCache, invalidate, getCached } = useAdminCache()

  async function fetchCategories(tenantId: string): Promise<Category[]> {
    const cacheKey = `admin:categories:${tenantId}`
    const ttl = 5 * 60 * 1000 // 5 minutes

    const data = await fetchWithCache(
      cacheKey,
      async () => {
        const response = await $fetch<{ categories: Category[] }>(
          `${backendUrl}/admin/${tenantId}/categories`,
          {
            credentials: 'include',
          }
        )
        return response.categories || []
      },
      { ttl }
    )

    return data
  }

  async function fetchCategory(tenantId: string, categoryId: string): Promise<Category | null> {
    const cacheKey = `admin:category:${tenantId}:${categoryId}`
    const ttl = 5 * 60 * 1000 // 5 minutes

    const data = await fetchWithCache(
      cacheKey,
      async () => {
        const response = await $fetch<{ category: Category }>(
          `${backendUrl}/admin/${tenantId}/categories/${categoryId}`,
          {
            credentials: 'include',
          }
        )
        return response.category
      },
      { ttl }
    )

    return data
  }

  async function createCategory(
    tenantId: string,
    data: CategoryCreateData
  ): Promise<{ category: Category; slugWasAutoModified: boolean }> {
    const formData = new FormData()
    formData.append('name', data.name)
    
    // Always append description, even if empty (backend expects it)
    formData.append('description', data.description || '')
    
    if (data.slug) {
      formData.append('slug', data.slug)
    }
    
    if (data.sortOrder !== undefined) {
      formData.append('sortOrder', String(data.sortOrder))
    }
    
    if (data.image) {
      formData.append('image', data.image)
    }
    
    // Use native fetch to ensure FormData is sent correctly
    const response = await fetch(`${backendUrl}/admin/${tenantId}/categories`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw error
      }
      return res.json()
    }) as Promise<{ category: Category; slugWasAutoModified: boolean }>

    // Invalidate categories cache
    invalidate(`admin:categories:${tenantId}`)

    return response
  }

  async function updateCategory(
    tenantId: string,
    categoryId: string,
    data: CategoryUpdateData
  ): Promise<{ category: Category; slugWasAutoModified: boolean }> {
    // Debug: Log what we receive
    console.log('useCategory.updateCategory - Received data:', {
      name: data.name,
      description: data.description,
      slug: data.slug,
      sortOrder: data.sortOrder,
      hasImage: !!data.image,
      imageName: data.image?.name,
    })

    const formData = new FormData()
    
    // Always send all fields to ensure backend can update them properly
    // Send empty string if undefined to ensure field is present in FormData
    formData.append('name', data.name ?? '')
    formData.append('description', data.description ?? '')
    
    if (data.slug !== undefined) {
      formData.append('slug', data.slug)
    }
    
    if (data.sortOrder !== undefined) {
      formData.append('sortOrder', String(data.sortOrder))
    }
    
    if (data.image) {
      formData.append('image', data.image)
      console.log('useCategory.updateCategory - Appending image:', {
        name: data.image.name,
        size: data.image.size,
        type: data.image.type,
      })
    } else {
      console.log('useCategory.updateCategory - No image file provided')
    }
    
    // Debug: Log FormData contents
    console.log('useCategory.updateCategory - FormData entries:', Array.from(formData.entries()).map(([key, value]) => ({
      key,
      value: value instanceof File ? { name: value.name, size: value.size, type: value.type } : String(value)
    })))
    
    // Use native fetch to ensure FormData is sent correctly
    const response = await fetch(`${backendUrl}/admin/${tenantId}/categories/${categoryId}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw error
      }
      return res.json()
    }) as Promise<{ category: Category; slugWasAutoModified: boolean }>

    // Invalidate caches
    invalidate(`admin:categories:${tenantId}`)
    invalidate(`admin:category:${tenantId}:${categoryId}`)

    return response
  }

  async function deleteCategory(
    tenantId: string,
    categoryId: string,
    removeAssociations = false
  ): Promise<void> {
    const queryParams = removeAssociations ? '?removeAssociations=true' : ''
    await $fetch(`${backendUrl}/admin/${tenantId}/categories/${categoryId}${queryParams}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    // Invalidate caches
    invalidate(`admin:categories:${tenantId}`)
    invalidate(`admin:category:${tenantId}:${categoryId}`)
  }

  async function assignProductsToCategory(
    tenantId: string,
    categoryId: string,
    productIds: string[]
  ): Promise<void> {
    await $fetch(`${backendUrl}/admin/${tenantId}/categories/${categoryId}/products`, {
      method: 'POST',
      credentials: 'include',
      body: { productIds },
    })

    // Invalidate caches
    invalidate(`admin:categories:${tenantId}`)
    invalidate(`admin:category:${tenantId}:${categoryId}`)
  }

  async function checkSlugAvailability(
    tenantId: string,
    slug: string,
    excludeId?: string
  ): Promise<{ available: boolean; suggestedSlug?: string }> {
    const params = new URLSearchParams({ slug })
    if (excludeId) {
      params.append('excludeId', excludeId)
    }

    const response = await $fetch<{ available: boolean; suggestedSlug?: string }>(
      `${backendUrl}/admin/${tenantId}/categories/check-slug?${params.toString()}`,
      {
        credentials: 'include',
      }
    )

    return response
  }

  async function generateUniqueSlug(
    tenantId: string,
    name: string,
    excludeId?: string
  ): Promise<{ slug: string }> {
    const params = new URLSearchParams({ name })
    if (excludeId) {
      params.append('excludeId', excludeId)
    }

    const response = await $fetch<{ slug: string }>(
      `${backendUrl}/admin/${tenantId}/categories/generate-slug?${params.toString()}`,
      {
        credentials: 'include',
      }
    )

    return response
  }

  return {
    fetchCategories,
    fetchCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    assignProductsToCategory,
    checkSlugAvailability,
    generateUniqueSlug,
  }
}

