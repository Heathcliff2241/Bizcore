'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const redirectedRef = useRef(false)

  useEffect(() => {
    // Skip if already redirected or still loading
    if (redirectedRef.current || status === 'loading') {
      return
    }

    // If unauthenticated, redirect to signin
    if (status === 'unauthenticated') {
      console.log('[ADMIN_AUTH_GUARD] No session, redirecting to signin')
      redirectedRef.current = true
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    // If authenticated but not admin, redirect to dashboard
    if (session && session.user?.role !== 'admin') {
      console.log('[ADMIN_AUTH_GUARD] User is not admin, redirecting to dashboard')
      redirectedRef.current = true
      router.push('/dashboard')
      return
    }
  }, [status, session, router, pathname])

  // Show loading state while checking auth or redirecting
  if (status === 'loading' || redirectedRef.current) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen bg-slate-50"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-3 border-emerald-200 border-t-emerald-600 rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </motion.div>
    )
  }

  // Only render if authenticated and admin
  if (status === 'authenticated' && session?.user?.role === 'admin') {
    return <>{children}</>
  }

  // Render nothing while redirecting
  return null
}

