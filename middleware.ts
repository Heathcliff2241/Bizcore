import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add middleware logic here
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}