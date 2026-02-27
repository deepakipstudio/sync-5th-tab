<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Breadcrumb -->
    <div class="px-4 py-4 bg-white border-b">
      <nav class="flex items-center space-x-2 text-sm">
        <NuxtLink
          :to="`/shop/${tenantId}`"
          class="text-gray-600 hover:text-[var(--tenant-primary)]"
        >
          Home
        </NuxtLink>
        <span v-if="product?.categories?.[0]" class="text-gray-400">/</span>
        <NuxtLink
          v-if="product?.categories?.[0]"
          :to="`/shop/${tenantId}/categories/${product.categories[0].slug}`"
          class="text-gray-600 hover:text-[var(--tenant-primary)]"
        >
          {{ product.categories[0].name }}
        </NuxtLink>
        <span v-if="product" class="text-gray-400">/</span>
        <span v-if="product" class="text-gray-900 font-medium">{{ productName }}</span>
      </nav>
    </div>

    <div v-if="loading" class="px-4 py-8">
      <div class="animate-pulse">
        <div class="h-96 bg-gray-200 rounded-lg mb-4"></div>
        <div class="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>

    <div v-else-if="error" class="px-4 py-8 text-center">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <div v-else-if="product" class="px-4 py-8 max-w-6xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Product Images with Swiper -->
        <div>
          <Swiper
            v-if="product.images.length > 0"
            :modules="[SwiperNavigation, SwiperThumbs]"
            :navigation="true"
            :thumbs="{ swiper: thumbsSwiper }"
            :space-between="10"
            class="product-main-swiper mb-4"
          >
            <SwiperSlide
              v-for="(image, index) in product.images"
              :key="image.id"
            >
              <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  :src="getFullImageUrl(image.imageUrl, 'medium')"
                  :alt="`${productName} - Image ${index + 1}`"
                  class="w-full h-full object-contain"
                />
              </div>
            </SwiperSlide>
          </Swiper>

          <!-- Thumbnail Swiper -->
          <Swiper
            v-if="product.images.length > 1"
            @swiper="setThumbsSwiper"
            :space-between="10"
            :slides-per-view="4"
            :free-mode="true"
            :watch-slides-progress="true"
            class="product-thumbs-swiper"
          >
            <SwiperSlide
              v-for="(image, index) in product.images"
              :key="image.id"
            >
              <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 transition-all"
                   :class="selectedImageIndex === index ? 'border-[var(--tenant-primary)]' : 'border-transparent hover:border-gray-300'"
                   @click="selectedImageIndex = index">
                <img
                  :src="getFullImageUrl(image.imageUrl, 'thumbnail')"
                  :alt="`Thumbnail ${index + 1}`"
                  class="w-full h-full object-contain"
                />
              </div>
            </SwiperSlide>
          </Swiper>
        </div>

        <!-- Product Info -->
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ productName }}</h1>
          
          <div class="mb-6">
            <p
              v-if="displayPrice"
              class="text-3xl font-bold"
              :style="{ color: 'var(--tenant-primary)' }"
            >
              {{ displayPrice }}
            </p>
            <p v-else class="text-lg text-gray-500">Price not available</p>
          </div>

          <div v-if="productDescription" class="mb-6">
            <h2 class="text-lg font-semibold mb-2">Details</h2>
            <p class="text-gray-700 whitespace-pre-line">{{ productDescription }}</p>
          </div>

          <!-- Variant Selection by Attributes -->
          <div v-if="product.variants.length > 0" class="mb-6">
            <div v-if="availableAttributes.length > 0" class="space-y-4">
              <!-- Attribute Selectors (Size, Color, etc.) -->
              <div
                v-for="attrType in availableAttributes"
                :key="attrType.code"
                class="space-y-2"
              >
                <h3 class="text-sm font-semibold text-gray-700">{{ attrType.name }}</h3>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="option in attrType.options"
                    :key="option.value"
                    @click="selectAttribute(attrType.code, option.value)"
                    :disabled="!option.available"
                    :class="[
                      'px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium',
                      selectedAttributes[attrType.code] === option.value
                        ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white'
                        : 'border-gray-300 hover:border-gray-400',
                      !option.available ? 'opacity-50 cursor-not-allowed line-through' : ''
                    ]"
                  >
                    {{ option.value || 'N/A' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Fallback: No attribute selectors -->
            <div v-else>
              <!-- Single variant → read-only chip (option b) -->
              <div v-if="product.variants.length === 1" class="flex items-center gap-2 mb-2">
                <span
                  class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border"
                  :style="{ borderColor: 'var(--tenant-primary)', color: 'var(--tenant-primary)' }"
                >
                  {{ product.variants[0]?.description || product.variants[0]?.sku }}
                </span>
              </div>

              <!-- Multiple variants without attributes → selectable list -->
              <div v-else class="space-y-2">
                <h2 class="text-base font-semibold mb-2">Select Variant</h2>
                <button
                  v-for="variant in product.variants"
                  :key="variant.id"
                  @click="selectedVariantId = variant.id"
                  :disabled="variant.mtStock !== null && variant.mtStock !== undefined && variant.mtStock <= 0"
                  :class="[
                    'w-full text-left p-3 rounded-lg border-2 transition-all',
                    selectedVariantId === variant.id
                      ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)]/5'
                      : 'border-gray-200 hover:border-gray-300',
                    (variant.mtStock !== null && variant.mtStock !== undefined && variant.mtStock <= 0) ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium">{{ variant.description || variant.sku }}</div>
                    </div>
                    <div class="text-right">
                      <div v-if="variant.mtPrice != null" class="font-semibold" :style="{ color: 'var(--tenant-primary)' }">
                        ${{ variant.mtPrice.toFixed(2) }}
                      </div>
                      <div v-if="variant.mtStock != null" class="text-xs" :class="variant.mtStock > 0 ? 'text-green-600' : 'text-red-600'">
                        {{ variant.mtStock > 0 ? `${variant.mtStock} in stock` : 'Out of stock' }}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Selected Variant Info (attribute-based selection) -->
            <div v-if="selectedVariant && availableAttributes.length > 0" class="mt-4 p-3 rounded-lg border bg-gray-50" :style="{ borderColor: 'var(--tenant-primary)' }">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-gray-900">{{ selectedVariant.description || selectedVariant.sku }}</div>
                </div>
                <div class="text-right">
                  <div v-if="selectedVariant.mtPrice != null" class="text-lg font-bold" :style="{ color: 'var(--tenant-primary)' }">
                    ${{ selectedVariant.mtPrice.toFixed(2) }}
                  </div>
                  <div v-if="selectedVariant.mtStock != null" class="text-xs mt-0.5" :class="selectedVariant.mtStock > 0 ? 'text-green-600' : 'text-red-600'">
                    {{ selectedVariant.mtStock > 0 ? `${selectedVariant.mtStock} in stock` : 'Out of stock' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Add to Cart Button -->
          <button
            :disabled="!canAddToCart"
            class="w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            :style="{
              backgroundColor: canAddToCart ? 'var(--tenant-primary)' : '#ccc',
              color: canAddToCart ? 'var(--tenant-primary-foreground)' : '#666'
            }"
            @click="handleAddToCart"
          >
            {{ canAddToCart ? 'Add to Cart' : 'Out of Stock' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Thumbs } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'

definePageMeta({ layout: 'shop' })

const route = useRoute()
const config = useRuntimeConfig()
const tenantId = computed(() => route.params.tenant as string)
const productId = computed(() => route.params.id as string)

const { product, loading, error, fetchProduct } = useShopProducts(tenantId.value)
const { getFullImageUrl } = useImageUrl()
const selectedImageIndex = ref(0)
const selectedVariantId = ref<string | null>(null)
const selectedAttributes = ref<Record<string, string>>({})
const thumbsSwiper = ref<any>(null)

const SwiperNavigation = Navigation
const SwiperThumbs = Thumbs

const productName = computed(() => {
  return product.value?.mtTitle || product.value?.description || product.value?.mtProductId || 'Product'
})

const productDescription = computed(() => {
  return product.value?.mtDescription || product.value?.description || null
})

// Extract available attributes from all variants
const availableAttributes = computed(() => {
  if (!product.value || !product.value.variants.length) return []
  
  // Collect all unique attribute types (Size, Color, etc.)
  const attributeMap = new Map<string, { name: string; code: string; options: Set<string> }>()
  
  product.value.variants.forEach(variant => {
    if (variant.mtAttributes && Array.isArray(variant.mtAttributes)) {
      variant.mtAttributes.forEach(attr => {
        if (!attributeMap.has(attr.code)) {
          attributeMap.set(attr.code, {
            name: attr.name,
            code: attr.code,
            options: new Set()
          })
        }
        const attrType = attributeMap.get(attr.code)!
        if (attr.value) {
          attrType.options.add(attr.value)
        }
      })
    }
  })
  
  // Convert to array and check availability for each option
  return Array.from(attributeMap.values()).map(attrType => {
    const options = Array.from(attrType.options).map(value => {
      // Check if this option is available (has at least one variant with stock > 0)
      const available = product.value!.variants.some(variant => {
        const hasAttribute = variant.mtAttributes?.some(
          attr => attr.code === attrType.code && attr.value === value
        )
        if (!hasAttribute) return false
        // Check stock
        if (variant.mtStock !== null && variant.mtStock !== undefined) {
          return variant.mtStock > 0
        }
        return true // If stock is unknown, consider available
      })
      
      return { value, available }
    }).sort((a, b) => {
      // Sort options naturally (e.g., sizes: XS, S, M, L, XL)
      return a.value.localeCompare(b.value, undefined, { numeric: true, sensitivity: 'base' })
    })
    
    return {
      ...attrType,
      options
    }
  })
})

// Find variant based on selected attributes
const findVariantByAttributes = (attributes: Record<string, string>) => {
  if (!product.value) return null
  
  return product.value.variants.find(variant => {
    if (!variant.mtAttributes || !Array.isArray(variant.mtAttributes)) return false
    
    // Check if variant matches all selected attributes
    return Object.entries(attributes).every(([code, value]) => {
      return variant.mtAttributes?.some(
        attr => attr.code === code && attr.value === value
      )
    })
  }) || null
}

const selectedVariant = computed(() => {
  // If attributes are selected, find matching variant
  if (availableAttributes.value.length > 0 && Object.keys(selectedAttributes.value).length > 0) {
    const variant = findVariantByAttributes(selectedAttributes.value)
    if (variant) return variant
  }
  
  // Fallback to selectedVariantId
  if (!product.value || !selectedVariantId.value) {
    return product.value?.variants[0] || null
  }
  return product.value.variants.find(v => v.id === selectedVariantId.value) || product.value.variants[0] || null
})

const displayPrice = computed(() => {
  if (!selectedVariant.value) return null
  
  if (selectedVariant.value.mtPrice !== null && selectedVariant.value.mtPrice !== undefined) {
    return `$${selectedVariant.value.mtPrice.toFixed(2)}`
  }
  
  // If multiple variants, show price range
  if (product.value && product.value.variants.length > 1) {
    const prices = product.value.variants
      .map(v => v.mtPrice)
      .filter((p): p is number => p !== null && p !== undefined)
    
    if (prices.length === 0) return null
    if (prices.length === 1 && prices[0] !== undefined) return `$${prices[0].toFixed(2)}`
    
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    if (minPrice === maxPrice) {
      return `$${minPrice.toFixed(2)}`
    }
    return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
  }
  
  return null
})

const canAddToCart = computed(() => {
  if (!selectedVariant.value) return false
  if (selectedVariant.value.mtStock === null || selectedVariant.value.mtStock === undefined) return true // If stock is unknown, allow adding
  return selectedVariant.value.mtStock > 0
})

function setThumbsSwiper(swiper: any) {
  if (swiper) {
    thumbsSwiper.value = swiper
  }
}

function selectAttribute(attrCode: string, value: string) {
  selectedAttributes.value[attrCode] = value
  
  // Update selectedVariantId when attributes change
  const variant = findVariantByAttributes(selectedAttributes.value)
  if (variant) {
    selectedVariantId.value = variant.id
  } else {
    selectedVariantId.value = null
  }
}

function handleAddToCart() {
  if (!canAddToCart.value) return
  
  // TODO: Implement add to cart functionality
  console.log('Add to cart:', {
    productId: product.value?.id,
    variantId: selectedVariantId.value || product.value?.variants[0]?.id,
    variant: selectedVariant.value,
  })
}

onMounted(() => {
  fetchProduct(productId.value)
})

watch(() => product.value, (newProduct) => {
  if (newProduct?.variants && newProduct.variants.length > 0) {
    // If we have attributes, try to auto-select first available combination
    if (availableAttributes.value.length > 0) {
      // Auto-select first option for each attribute
      const autoSelected: Record<string, string> = {}
      availableAttributes.value.forEach(attrType => {
        const firstAvailable = attrType.options.find(opt => opt.available)
        if (firstAvailable) {
          autoSelected[attrType.code] = firstAvailable.value
        }
      })
      if (Object.keys(autoSelected).length > 0) {
        selectedAttributes.value = autoSelected
        const variant = findVariantByAttributes(autoSelected)
        if (variant) {
          selectedVariantId.value = variant.id
        }
      }
    } else if (!selectedVariantId.value) {
      // Fallback: select first variant
      selectedVariantId.value = newProduct.variants[0]?.id || null
    }
  }
})

watch(() => selectedImageIndex.value, (newIndex) => {
  if (thumbsSwiper.value && thumbsSwiper.value.slideTo) {
    thumbsSwiper.value.slideTo(newIndex)
  }
})
</script>

<style scoped>
.product-main-swiper {
  width: 100%;
  height: auto;
}

.product-main-swiper :deep(.swiper-slide) {
  display: flex;
  justify-content: center;
  align-items: center;
}

.product-thumbs-swiper {
  width: 100%;
  height: auto;
  margin-top: 10px;
}

.product-thumbs-swiper :deep(.swiper-slide) {
  opacity: 0.6;
  transition: opacity 0.3s;
}

.product-thumbs-swiper :deep(.swiper-slide-thumb-active) {
  opacity: 1;
}
</style>

