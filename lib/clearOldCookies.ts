/**
 * Clear old domain-based session cookies that may conflict with new host-only cookies
 * This is needed because we migrated from domain-based to host-only cookies
 * 
 * IMPORTANT: Only clears OLD domain-based cookies (.bizcore.test format)
 * Does NOT clear the current host-only session cookies which are valid
 */
export function clearOldSessionCookies() {
  if (typeof document === 'undefined') return

  // List of old cookies to clear
  const cookiesToClear = [
    'next-auth.session-token',
    'next-auth.session-token.customer',
    'next-auth.csrf-token',
    'next-auth.callback-url',
  ]

  // Only clear OLD domain-based versions that might conflict
  // Do NOT clear the current host-only cookies
  const oldDomains = [
    '.bizcore.test',    // Old domain format
    'bizcore.test',     // Alternative format
  ]

  cookiesToClear.forEach(cookieName => {
    // ONLY clear with old domain formats, not host-only
    oldDomains.forEach(domain => {
      document.cookie = `${cookieName}=; domain=${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
    })
  })

  console.log('[CLEAR-OLD-COOKIES] Cleared old domain-based session cookies')
}
