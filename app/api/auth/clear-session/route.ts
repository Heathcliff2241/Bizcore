import { NextResponse } from 'next/server'
import { resolveCookieDomain } from '../../../../lib/utils'

export async function POST(req: Request) {
  // Determine cookie attributes to match those set by NextAuth
  const sessionCookieDomain = resolveCookieDomain()
  const cookieSecure = typeof process.env.NEXTAUTH_COOKIE_SECURE !== 'undefined'
    ? String(process.env.NEXTAUTH_COOKIE_SECURE).toLowerCase() === 'true'
    : process.env.NODE_ENV === 'production'

  const cookieDomainPart = sessionCookieDomain ? `Domain=${sessionCookieDomain}; ` : ''
  const securePart = cookieSecure ? 'Secure; ' : ''

  const cookieBase = `Path=/; HttpOnly; ${securePart}${cookieDomainPart}SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`

  const res = NextResponse.json({ success: true })
  
  // Clear both admin and customer session cookies
  res.headers.append('Set-Cookie', `next-auth.session-token=deleted; ${cookieBase}`)
  res.headers.append('Set-Cookie', `next-auth.session-token.customer=deleted; ${cookieBase}`)
  
  // Also clear CSRF and callback cookies for safety (non-httpOnly may exist)
  res.headers.append('Set-Cookie', `next-auth.csrf-token=deleted; Path=/; ${securePart}${cookieDomainPart}Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`)
  res.headers.append('Set-Cookie', `next-auth.callback-url=deleted; Path=/; ${securePart}${cookieDomainPart}Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`)
  
  // Also clear host-only versions (in case they were set without domain)
  res.headers.append('Set-Cookie', `next-auth.session-token=deleted; Path=/; HttpOnly; ${securePart}SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`)
  res.headers.append('Set-Cookie', `next-auth.session-token.customer=deleted; Path=/; HttpOnly; ${securePart}SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`)

  console.log('[CLEAR-SESSION] Cleared auth cookies with domain:', sessionCookieDomain)
  return res
}

export const dynamic = 'force-dynamic'
