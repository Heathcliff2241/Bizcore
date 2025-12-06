'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

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
export function CustomerProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      basePath="/api/customer-auth"
      refetchInterval={30} // 30 seconds for faster updates
      refetchOnWindowFocus={true}
      refetchOnReconnect={true}
    >
      {children}
      <Toaster position="bottom-right" />
    </SessionProvider>
  )
}