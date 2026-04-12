import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

/**
 * Clear corrupted session cookies when JWT decryption fails
 * This prevents the "Invalid Compact JWE" error loop
 */
function clearCorruptedCookies(): NextResponse {
  const cookieSecure = process.env.NEXTAUTH_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'
  const securePart = cookieSecure ? 'Secure; ' : ''
  const cookieBase = `Path=/; HttpOnly; ${securePart}SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`

  const response = NextResponse.json({ 
    error: 'Session expired or invalid. Please sign in again.',
    cleared: true 
  }, { status: 401 })
  
  // Clear all auth cookies
  response.headers.append('Set-Cookie', `next-auth.session-token=; ${cookieBase}`)
  response.headers.append('Set-Cookie', `next-auth.csrf-token=; Path=/; ${securePart}SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`)
  response.headers.append('Set-Cookie', `next-auth.callback-url=; Path=/; ${securePart}SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`)
  
  console.log('[AUTH] Cleared corrupted session cookies')
  return response
}

// Simply pass requests through to NextAuth handler
// Note: Cookie sanitization happens inside NextAuth if needed
export async function GET(req: Request, props: { params: Promise<{ nextauth: string[] }> }) {
  const params = await props.params
  
  try {
    return await handler(req, { params })
  } catch (error: unknown) {
    // Check if this is a JWT decryption error (corrupted cookie)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Invalid Compact JWE') || errorMessage.includes('JWE')) {
      console.warn('[AUTH] JWT decryption failed - clearing corrupted cookies')
      return clearCorruptedCookies()
    }
    throw error
  }
}

export async function POST(req: Request, props: { params: Promise<{ nextauth: string[] }> }) {
  const params = await props.params
  
  try {
    return await handler(req, { params })
  } catch (error: unknown) {
    // Check if this is a JWT decryption error (corrupted cookie)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Invalid Compact JWE') || errorMessage.includes('JWE')) {
      console.warn('[AUTH] JWT decryption failed - clearing corrupted cookies')
      return clearCorruptedCookies()
    }
    throw error
  }
}

// Prevent static generation for this dynamic route
export const dynamic = 'force-dynamic'