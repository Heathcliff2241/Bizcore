import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
const setCookieParser = require('set-cookie-parser')

const handler = NextAuth(authOptions)

export async function GET(req: Request, props: { params: Promise<{ nextauth: string[] }> }) {
  const params = await props.params
  // Sanitize invalid session token cookies to avoid JWE/JWS mismatch errors
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').map(c => c.trim()).filter(Boolean)
  const sessionCookie = cookies.find(c => c.startsWith('next-auth.session-token='))
  if (sessionCookie) {
    const token = sessionCookie.split('=')[1] || ''
    const dotCount = (token.match(/\./g) || []).length
    // If the token is not a JWE (4 dots) then it's likely stale or JWS; remove to prevent decrypt errors
    if (dotCount !== 4) {
      console.log('[AUTH_ROUTE] Removing invalid next-auth.session-token cookie (not JWE) to prevent decrypt errors')
      const newHeaders = new Headers(req.headers)
      // Remove cookie header entirely to avoid NextAuth reading invalid tokens
      newHeaders.delete('cookie')
      const sanitizedReq = new Request(req.url, { headers: newHeaders, method: req.method })
      return handler(sanitizedReq as Request, { params })
    }
  }
  const response = await handler(req, { params })
  return response
}

export async function POST(req: Request, props: { params: Promise<{ nextauth: string[] }> }) {
  const params = await props.params
  // Sanitize invalid session token cookies to avoid JWE/JWS mismatch errors
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').map(c => c.trim()).filter(Boolean)
  const sessionCookie = cookies.find(c => c.startsWith('next-auth.session-token='))
  if (sessionCookie) {
    const token = sessionCookie.split('=')[1] || ''
    const dotCount = (token.match(/\./g) || []).length
    if (dotCount !== 4) {
      console.log('[AUTH_ROUTE] Removing invalid next-auth.session-token cookie (not JWE) to prevent decrypt errors')
      const newHeaders = new Headers(req.headers)
      newHeaders.delete('cookie')
      const sanitizedReq = new Request(req.url, { headers: newHeaders, method: req.method, body: req.body as any })
      return handler(sanitizedReq as Request, { params })
    }
  }
  const response = await handler(req, { params })
  return response
}

// Prevent static generation for this dynamic route
export const dynamic = 'force-dynamic'