export interface Banner {
  id: string
  tenantId: string
  productClass: string | null
  expiresAt: string | null
  sortOrder: number | null
  visible: boolean
  createdAt: string
  filename: string
  mimeType: string
  originalName: string
  size: number
  categoryId: string | null
  imageUrl: string
  category?: {
    id: string
    name: string
    slug: string
  } | null
}

export function useShopBanners(tenantId: string) {
  const config = useRuntimeConfig()
  const banners = ref<Banner[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBanners() {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<{ banners: Banner[] }>(
        `/shop/${tenantId}/banners`,
        {
          baseURL: config.public.backendUrl,
          credentials: 'include',
        }
      )
      banners.value = data.banners || []
    } catch (e: any) {
      error.value = e.data?.error || e.message || 'Failed to fetch banners'
      banners.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchBanners()
  })

  return {
    banners: readonly(banners),
    loading: readonly(loading),
    error: readonly(error),
    fetchBanners,
  }
}

