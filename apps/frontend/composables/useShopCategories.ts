export interface Category {
  id: string
  tenantId: string
  name: string
  description: string | null
  slug: string
  imageUrl: string | null
  sortOrder: number | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  productCount: number
}

export function useShopCategories(tenantId: string) {
  const config = useRuntimeConfig()
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCategories() {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<{ categories: Category[] }>(
        `/shop/${tenantId}/categories`,
        {
          baseURL: config.public.backendUrl,
          credentials: 'include',
        }
      )
      categories.value = data.categories || []
    } catch (e: any) {
      error.value = e.data?.error || e.message || 'Failed to fetch categories'
      categories.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    categories: readonly(categories),
    loading: readonly(loading),
    error: readonly(error),
    fetchCategories,
  }
}

