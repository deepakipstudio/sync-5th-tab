<script setup lang="ts">
/**
 * Universal OAuth Callback Handler
 * 
 * This page handles the OAuth callback from Marianatek.
 * It extracts the code/state, exchanges them via backend, 
 * and redirects to the appropriate tenant route based on role.
 */

const route = useRoute()
const config = useRuntimeConfig()

const error = ref<string | null>(null)
const processing = ref(true)

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string

  if (!code || !state) {
    error.value = 'Missing OAuth parameters (code or state)'
    processing.value = false
    return
  }

  try {
    // The role is stored in the backend PKCE state, so we only need to send code & state
    // userId will be extracted from the Marianatek token in the future
    const response = await $fetch<{
      ok: boolean
      role: 'admin' | 'customer'
      tenantId: string
      tenant: string
      error?: string
    }>(`${config.public.backendUrl}/auth/mt/callback`, {
      method: 'POST',
      credentials: 'include',
      body: {
        code,
        state,
      },
    })

    if (!response.ok) {
      throw new Error(response.error || 'OAuth callback failed')
    }

    // Redirect based on role
    const basePath = response.role === 'admin' ? '/admin' : '/shop'
    await navigateTo(`${basePath}/${response.tenantId}`)
  } catch (e: any) {
    console.error('OAuth callback error:', e)
    error.value = e.data?.error || e.message || 'Failed to complete authentication'
    processing.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full p-8">
      <!-- Processing State -->
      <div v-if="processing" class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-900">Completing sign in...</h2>
        <p class="text-gray-500 mt-2">Please wait while we authenticate you.</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900">Authentication Failed</h2>
        <p class="text-red-600 mt-2">{{ error }}</p>
        <button 
          @click="navigateTo('/')"
          class="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Return Home
        </button>
      </div>
    </div>
  </div>
</template>
