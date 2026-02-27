/**
 * Composable to convert relative image URLs to absolute URLs
 * Prepends backend URL to relative paths
 * Supports resized image URLs when size parameter is provided
 */
export function useImageUrl() {
  const config = useRuntimeConfig()
  const backendUrl = config.public.backendUrl

  function getFullImageUrl(url: string | null | undefined, size?: string): string | undefined {
    if (!url) return undefined
    // If already absolute URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    // If size is provided, convert to resized image URL
    if (size) {
      // Parse the original URL to extract type and filename
      // Expected format: /uploads/{type}/{filename}
      const match = url.match(/^\/uploads\/(products|variants|categories|banners)\/(.+)$/)
      if (match) {
        const [, type, filename] = match
        return `${backendUrl}/images/${type}/${size}/${filename}`
      }
      // If URL doesn't match expected pattern, fall back to original behavior
    }
    
    // Prepend backend URL to relative paths
    return `${backendUrl}${url}`
  }

  return {
    getFullImageUrl,
  }
}

