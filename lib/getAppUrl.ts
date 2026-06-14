/**
 * Dynamic app URL resolver
 * Returns the appropriate app URL based on environment and context
 * For Vercel deployments, set NEXT_PUBLIC_APP_URL to your Vercel domain.
 */

export function getAppUrl(): string {
  // Always prefer the configured public URL if available
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Server-side fallback
  if (typeof window === 'undefined') {
    return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
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

  return 'http://localhost:3000'
}

export function getBrandStudioUrl(): string {
  // BrandStudio is deactivated in this build. Returns a stub URL.
  return ''
}

/**
 * Generate postMessage origin for iframe communication
 * BrandStudio is deactivated; returns empty string.
 */
export function getPostMessageOrigin(): string {
  return ''
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
