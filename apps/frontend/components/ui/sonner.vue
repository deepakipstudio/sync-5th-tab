<template>
  <SonnerToaster 
    :position="position || 'bottom-right'"
    :expand="expand"
    :rich-colors="richColors"
    :close-button="closeButton"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { Toaster as SonnerToaster } from 'vue-sonner'

interface SonnerProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  expand?: boolean
  richColors?: boolean
  closeButton?: boolean
}

withDefaults(defineProps<SonnerProps>(), {
  position: 'bottom-right',
  expand: false,
  richColors: false,
  closeButton: false,
})
</script>

