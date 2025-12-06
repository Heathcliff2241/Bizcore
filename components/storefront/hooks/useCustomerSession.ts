"use client"

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export const useCustomerSession = () => {
  const session = useSession()

  // Just return the session directly
  // NextAuth handles session persistence automatically via JWT cookies
  // No need to manually refresh - the session will be available on subsequent renders
  useEffect(() => {
    // Session is automatically available when a valid JWT token exists
    // No additional refresh logic needed
  }, [])

  return session
}