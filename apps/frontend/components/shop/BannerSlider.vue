<template>
  <div class="relative w-full overflow-hidden" v-if="banners.length > 0">
    <div
      ref="sliderRef"
      class="flex transition-transform duration-500 ease-in-out"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
    >
      <div
        v-for="(banner, index) in banners"
        :key="banner.id"
        class="w-full flex-shrink-0 relative"
      >
        <NuxtLink
          v-if="banner.categoryId && banner.category"
          :to="`/shop/${tenantId}/categories/${banner.category.slug}`"
          class="block"
        >
          <img
            :src="getFullImageUrl(banner.imageUrl)"
            :alt="banner.originalName"
            class="w-full h-auto object-cover"
            style="max-height: 400px;"
          />
        </NuxtLink>
        <img
          v-else
          :src="getFullImageUrl(banner.imageUrl)"
          :alt="banner.originalName"
          class="w-full h-auto object-cover"
          style="max-height: 400px;"
        />

        <!-- Text overlay -->
        <div
          v-if="storeName || locationName"
          class="absolute bottom-0 left-0 right-0 px-4 py-5"
          style="background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)"
        >
          <p v-if="storeName" class="text-white font-bold text-2xl leading-tight">{{ storeName }}</p>
          <NuxtLink
            v-if="locationName"
            :to="`/shop/${tenantId}/location`"
            class="text-white/90 text-sm underline underline-offset-2 mt-1 inline-block"
          >Pickup at {{ locationName }}</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Navigation dots -->
    <div v-if="banners.length > 1" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
      <button
        v-for="(banner, index) in banners"
        :key="banner.id"
        @click="goToSlide(index)"
        :class="[
          'w-2 h-2 rounded-full transition-all',
          index === currentIndex
            ? 'bg-[var(--tenant-primary)] w-8'
            : 'bg-white/50 hover:bg-white/75'
        ]"
        :aria-label="`Go to slide ${index + 1}`"
      />
    </div>

    <!-- Navigation arrows -->
    <button
      v-if="banners.length > 1"
      @click="previousSlide"
      class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
      aria-label="Previous slide"
    >
      <svg class="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <button
      v-if="banners.length > 1"
      @click="nextSlide"
      class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
      aria-label="Next slide"
    >
      <svg class="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Banner } from '~/composables/useShopBanners'

const props = defineProps<{
  banners: Banner[]
  tenantId: string
  autoPlay?: boolean
  autoPlayInterval?: number
  storeName?: string | null
  locationName?: string | null
}>()

const { getFullImageUrl } = useImageUrl()
const currentIndex = ref(0)
const sliderRef = ref<HTMLElement | null>(null)
let autoPlayTimer: ReturnType<typeof setInterval> | null = null

function nextSlide() {
  currentIndex.value = (currentIndex.value + 1) % props.banners.length
}

function previousSlide() {
  currentIndex.value = (currentIndex.value - 1 + props.banners.length) % props.banners.length
}

function goToSlide(index: number) {
  currentIndex.value = index
}

onMounted(() => {
  if (props.autoPlay && props.banners.length > 1) {
    autoPlayTimer = setInterval(() => {
      nextSlide()
    }, props.autoPlayInterval || 5000)
  }
})

onUnmounted(() => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
  }
})
</script>

