/**
 * Dynamic app URL resolver
 * Returns the appropriate app URL based on environment and context
 * Supports both bizcore.test (via nginx) and localhost:3000 (direct)
 */

export function getAppUrl(): string {
  // Always prefer the configured public URL if available
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Server-side fallback
  if (typeof window === 'undefined') {
    return 'http://bizcore.test'
  }

  // Client-side fallback - use window location
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    const port = window.location.port

    // Construct full URL based on current location
    if (port) {
      return `${protocol}//${hostname}:${port}`
    } else {
      return `${protocol}//${hostname}`
    }
  }

  return 'http://bizcore.test'
}

export function getBrandStudioUrl(): string {
  // Server-side fallback
  if (typeof window === 'undefined') {
    return 'http://bizcore.test/studio'
  }

  // Client-side: Use the current app URL + /studio path
  // This works because nginx serves BrandStudio at /studio path
  const appUrl = getAppUrl()
  return `${appUrl}/studio`
}

/**
 * Generate postMessage origin for iframe communication
 * Must match the BrandStudio iframe origin, not the parent app origin
 */
export function getPostMessageOrigin(): string {
  const brandStudioUrl = getBrandStudioUrl()
  // Extract origin from BrandStudio URL (protocol + hostname + port)
  try {
    const url = new URL(brandStudioUrl)
    return url.origin
  } catch {
    return brandStudioUrl
  }
}

/**
 * Get the BrandStudio iframe URL with query parameters
 */
export function getBrandStudioIframeUrl(params?: Record<string, string>): string {
  const baseUrl = getBrandStudioUrl()
  if (!params || Object.keys(params).length === 0) {
    console.log('[getBrandStudioIframeUrl] No params, returning base URL:', baseUrl)
    return baseUrl
  }

  const query = new URLSearchParams(params).toString()
  const fullUrl = `${baseUrl}?${query}`
  console.log('[getBrandStudioIframeUrl] Built URL:', fullUrl, 'params:', params)
  return fullUrl
}
