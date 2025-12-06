import NextAuth from 'next-auth'
import { customerAuthOptions } from '@/lib/customerAuth'
const setCookieParser = require('set-cookie-parser')

// Prevent static generation for this dynamic route
export const dynamic = 'force-dynamic'

const handler = NextAuth(customerAuthOptions)

export async function GET(req: Request, props: { params: Promise<{ nextauth: string[] }> }) {
  const params = await props.params
  // Sanitize invalid customer session cookies to avoid errors
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').map(c => c.trim()).filter(Boolean)
  const customerSessionCookie = cookies.find(c => c.startsWith('next-auth.session-token.customer='))
  if (customerSessionCookie) {
    const token = customerSessionCookie.split('=')[1] || ''
    const dotCount = (token.match(/\./g) || []).length
    if (dotCount !== 4) {
      const newHeaders = new Headers(req.headers)
      newHeaders.delete('cookie')
      const sanitizedReq = new Request(req.url, { headers: newHeaders, method: req.method })
      return await handler(sanitizedReq as Request, { params })
    }
  }
  const response = await handler(req, { params })
  return response
}

export async function POST(req: Request, props: { params: Promise<{ nextauth: string[] }> }) {
  const params = await props.params
  console.log('[CUSTOMER_AUTH_ROUTE] POST handler invoked, path:', new URL(req.url).pathname)
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').map(c => c.trim()).filter(Boolean)
  const customerSessionCookie = cookies.find(c => c.startsWith('next-auth.session-token.customer='))
  if (customerSessionCookie) {
    const token = customerSessionCookie.split('=')[1] || ''
    const dotCount = (token.match(/\./g) || []).length
    console.log('[CUSTOMER_AUTH] POST session cookie check - token length:', token.length, 'dot count:', dotCount)
    if (dotCount !== 4) {
      console.log('[CUSTOMER_AUTH] POST Invalid token format, removing cookie')
      const newHeaders = new Headers(req.headers)
      newHeaders.delete('cookie')
      const sanitizedReq = new Request(req.url, { headers: newHeaders, method: req.method, body: req.body as any })
      return await handler(sanitizedReq as Request, { params })
    }
  }
  const response = await handler(req, { params })
  try {
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      const parsed = setCookieParser.parse(setCookieHeader)
      const cookieNames = parsed.map((c: { name: string }) => c.name)
      console.log('[CUSTOMER_AUTH_ROUTE] Set-Cookie in response (POST):', cookieNames.join(', '))
    } else {
      console.log('[CUSTOMER_AUTH_ROUTE] No Set-Cookie in response (POST)')
    }
  } catch (err) {
    console.warn('[CUSTOMER_AUTH_ROUTE] Failed to parse set-cookie header (POST)', err)
  }
  console.log('[CUSTOMER_AUTH_ROUTE] Response status (POST):', response.status, response.statusText)
  return response
}