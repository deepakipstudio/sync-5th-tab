export interface ProductImage {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  isFeatured: boolean
  sortOrder: number
  imageUrl: string
}

export interface VariantAttribute {
  name: string
  value: string | null
  code: string
}

export interface ProductVariant {
  id: string
  productId: string
  mtVariantId: string
  sku: string
  description: string | null
  visible: boolean
  sortOrder: number | null
  createdAt: string
  updatedAt: string
  images?: ProductImage[]
  mtPrice?: number | null
  mtStock?: number | null
  mtData?: any
  mtAttributes?: VariantAttribute[]
}

import type { Category } from './useShopCategories'

export interface Product {
  id: string
  tenantId: string
  description: string | null
  visible: boolean
  sortOrder: number | null
  createdAt: string
  updatedAt: string
  mtProductId: string
  images: ProductImage[]
  variants: ProductVariant[]
  categories: Category[]
  mtTitle?: string | null
  mtDescription?: string | null
}

export function useShopProducts(tenantId: string) {
  const config = useRuntimeConfig()
  const products = ref<Product[]>([])
  const product = ref<Product | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProducts(categoryId?: string) {
    loading.value = true
    error.value = null

    try {
      const params: Record<string, string> = {}
      if (categoryId) {
        params.categoryId = categoryId
      }

      const data = await $fetch<{ products: Product[] }>(
        `/shop/${tenantId}/products`,
        {
          baseURL: config.public.backendUrl,
          credentials: 'include',
          params,
        }
      )
      products.value = data.products || []
    } catch (e: any) {
      error.value = e.data?.error || e.message || 'Failed to fetch products'
      products.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchProduct(productId: string) {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<{ product: Product }>(
        `/shop/${tenantId}/products/${productId}`,
        {
          baseURL: config.public.backendUrl,
          credentials: 'include',
        }
      )
      product.value = data.product
    } catch (e: any) {
      error.value = e.data?.error || e.message || 'Failed to fetch product'
      product.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    products: readonly(products),
    product: readonly(product),
    loading: readonly(loading),
    error: readonly(error),
    fetchProducts,
    fetchProduct,
  }
}

