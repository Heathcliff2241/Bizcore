'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import type { Session } from 'next-auth'

// Root provider for admin/dashboard areas
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      {children}
      <Toaster position="bottom-right" />
    </SessionProvider>
  )
}

// Storefront provider for customer areas
export function CustomerProviders({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      session={session}
    >
      {children}
      <Toaster position="bottom-right" />
    </SessionProvider>
  )
}