import { useAdminCache } from './useAdminCache'

const { fetchWithCache, invalidate, getCached } = useAdminCache()

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
    if (data.description) {
      formData.append('description', data.description)
    }
    if (data.slug) {
      formData.append('slug', data.slug)
    }
    if (data.sortOrder !== undefined) {
      formData.append('sortOrder', String(data.sortOrder))
    }
    if (data.image) {
      formData.append('image', data.image)
    }

    const response = await $fetch<{ category: Category; slugWasAutoModified: boolean }>(
      `${backendUrl}/admin/${tenantId}/categories`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }
    )

    // Invalidate categories cache
    invalidate(`admin:categories:${tenantId}`)

    return response
  }

  async function updateCategory(
    tenantId: string,
    categoryId: string,
    data: CategoryUpdateData
  ): Promise<{ category: Category; slugWasAutoModified: boolean }> {
    const formData = new FormData()
    if (data.name !== undefined) {
      formData.append('name', data.name)
    }
    if (data.description !== undefined) {
      formData.append('description', data.description || '')
    }
    if (data.slug !== undefined) {
      formData.append('slug', data.slug)
    }
    if (data.sortOrder !== undefined) {
      formData.append('sortOrder', String(data.sortOrder))
    }
    if (data.image) {
      formData.append('image', data.image)
    }

    const response = await $fetch<{ category: Category; slugWasAutoModified: boolean }>(
      `${backendUrl}/admin/${tenantId}/categories/${categoryId}`,
      {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      }
    )

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

  return {
    fetchCategories,
    fetchCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    assignProductsToCategory,
  }
}

