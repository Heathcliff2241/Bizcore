import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// 🚨 CRITICAL: Add security headers to all responses
function addSecurityHeaders(response: NextResponse, request?: NextRequest) {
  // Add HSTS only when the request appears to be secure (https) or when explicitly forced
  const forwardedProto = request?.headers.get('x-forwarded-proto') || ''
  const isSecureRequest = forwardedProto === 'https' || (request?.nextUrl?.protocol === 'https')
  if (isSecureRequest || process.env.FORCE_HSTS === 'true') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}

export async function middleware(request: NextRequest) {
  // Look for admin session token
  // getToken needs the cookieName to match what's configured in authOptions
  let token
  try {
    token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: 'next-auth.session-token'
    })
  } catch (err) {
    console.warn('[MIDDLEWARE] Error decoding session token - ignoring and treating as unauthenticated')
    console.debug('[MIDDLEWARE] Token decode error:', err && (err as Error).message)
    token = null
  }
  
  const pathname = request.nextUrl.pathname

  // Allow public routes
  if (pathname === '/' || pathname.startsWith('/auth/') || pathname === '/brandstudio') {
    const response = NextResponse.next()
    return addSecurityHeaders(response, request)
  }

  // Admin routes require admin role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin?role=admin', request.url))
    }
    if (token.role !== 'admin') {
      // Redirect non-admins away from admin routes
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  // Dashboard routes require authentication and valid tenant context
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    
    // For non-admin users, ensure they have a tenant context
    // The client-side will handle the full tenant lookup
    if (token.role === 'admin') {
      // Admins shouldn't access tenant dashboards - redirect to admin
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // POS routes require authentication and employee role
  if (pathname.startsWith('/pos')) {
    // Allow /pos/login for unauthenticated access
    if (pathname.match(/^\/pos\/[^\/]+\/login$/)) {
      const response = NextResponse.next()
      return addSecurityHeaders(response, request)
    }

    // All other /pos routes require authentication
    if (!token) {
      // Extract subdomain from pathname (e.g., /pos/tenant-name/... -> tenant-name)
      const subdomainMatch = pathname.match(/^\/pos\/([^\/]+)/)
      const subdomain = subdomainMatch ? subdomainMatch[1] : 'default'
      return NextResponse.redirect(new URL(`/pos/${subdomain}/login`, request.url))
    }
    
    // Only POS employees (and admins) can access POS routes
    const userType = (token as { userType?: string }).userType
    const isPosEmployee = userType === 'pos_employee'
    const isAdmin = token.role === 'admin'
    
    if (!isPosEmployee && !isAdmin) {
      // Redirect non-POS users away from POS routes
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  const response = NextResponse.next()
  return addSecurityHeaders(response, request)
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/pos/:path*'],
}
