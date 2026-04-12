"use client"

import { useSession } from 'next-auth/react'

interface SessionUser {
  id: string
  email: string
  name: string | null
  role: string
  tenantId?: string
  subdomain?: string
}

interface SessionData {
  user: SessionUser
  expires: string
}

/**
 * Hook for customer session - uses NextAuth useSession internally
 * Returns format compatible with NextAuth useSession
 */
export const useCustomerSession = () => {
  const { data: session, status } = useSession()

  // Convert NextAuth session to the expected format, filtering for customer role only
  const data: SessionData | null = session && (session.user as any)?.role === 'customer' ? {
    user: {
      id: (session.user as any)?.id || '',
      email: session.user?.email || '',
      name: session.user?.name || null,
      role: (session.user as any)?.role || 'customer',
      tenantId: (session.user as any)?.tenantId,
      subdomain: (session.user as any)?.subdomain
    },
    expires: session.expires || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  } : null

  return { 
    data,
    status: status === 'loading' ? 'loading' : data ? 'authenticated' : 'unauthenticated'
  }
}