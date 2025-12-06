import { NextRequest, NextResponse } from 'next/server'

/**
 * This route signs out the user and redirects to signin
 * Used to break infinite redirect loops caused by stale session cookies
 */
export async function GET(request: NextRequest) {
  // Create response that redirects to signin
  const response = NextResponse.redirect(new URL('/auth/signin', request.url))
  
  // Clear the NextAuth session token cookie
  const domain = process.env.NEXTAUTH_COOKIE_DOMAIN || 'localhost'
  response.cookies.set({
    name: 'next-auth.session-token',
    value: '',
    maxAge: 0,
    path: '/',
    domain,
  })
  
  // Also try to clear any CSRF tokens
  response.cookies.set({
    name: 'next-auth.csrf-token',
    value: '',
    maxAge: 0,
    path: '/',
    domain,
  })
  
  return response
}
