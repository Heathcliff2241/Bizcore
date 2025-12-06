import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { resolveCookieDomain } from '../../../../lib/utils'

export async function GET() {
  // Restrict debug endpoint in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ROUTES !== 'true') {
    return NextResponse.json({ error: 'Debug endpoints are disabled in production' }, { status: 403 })
  }

  const providers = authOptions.providers?.map((p: any) => ({ id: p.id, name: p.name })) || []
  const cookieDomain = resolveCookieDomain()
  const cookieSecure = typeof process.env.NEXTAUTH_COOKIE_SECURE !== 'undefined'
    ? String(process.env.NEXTAUTH_COOKIE_SECURE).toLowerCase() === 'true'
    : process.env.NODE_ENV === 'production'

  const body = {
    providers,
    cookieDomain: cookieDomain ?? null,
    cookieSecure,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || null,
    NODE_ENV: process.env.NODE_ENV || null
  }

  return NextResponse.json(body)
}

export const dynamic = 'force-dynamic'
