/**
 * Determines the most appropriate cookie domain for NextAuth session cookies.
 * Priority order:
 * 1. NEXTAUTH_COOKIE_DOMAIN (or AUTH_COOKIE_DOMAIN for backward compat)
 * 2. Hostname derived from NEXTAUTH_URL / NEXT_PUBLIC_APP_URL / APP_URL
 * 3. undefined => host-only cookies (works for both localhost and custom dev domains)
 */
export function resolveCookieDomain(): string | undefined {
  const explicitDomain = process.env.NEXTAUTH_COOKIE_DOMAIN?.trim() || process.env.AUTH_COOKIE_DOMAIN?.trim()
  if (explicitDomain) {
    return explicitDomain
  }

  const fallbackHost = deriveHostname(
    process.env.NEXTAUTH_URL
      || process.env.NEXT_PUBLIC_APP_URL
      || process.env.APP_URL
  )

  return fallbackHost ?? undefined
}

function deriveHostname(value?: string | null): string | undefined {
  if (!value) {
    return undefined
  }

  const normalised = value.includes('://') ? value : `https://${value}`

  try {
    const hostname = new URL(normalised).hostname
    // If hostname is an IP address or localhost, prefer host-only cookies (no domain attribute)
    // This ensures cookies work when site accessed via IPs (e.g., 192.168.1.8)
    if (hostname === 'localhost' || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname === '127.0.0.1' || hostname === '::1') {
      return undefined
    }
    return hostname
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.warn('[auth] Unable to derive cookie domain from value:', value, reason)
    return undefined
  }
}