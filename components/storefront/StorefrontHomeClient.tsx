'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { LoginModal, SignupModal } from './AuthModals'
import type { StorefrontContext } from './types'

interface StorefrontHomeClientProps {
  children: React.ReactNode
  storefront?: StorefrontContext
}

export function StorefrontHomeClient({ children, storefront }: StorefrontHomeClientProps) {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)

  useEffect(() => {
    // Show signup modal if auth=signup param and user is not logged in
    if (searchParams.get('auth') === 'signup' && status === 'unauthenticated') {
      setSignupModalOpen(true)
    }
    // Show login modal if loginModal=true is in query params
    else if (searchParams.get('loginModal') === 'true' && status === 'unauthenticated') {
      setLoginModalOpen(true)
    }
  }, [searchParams, status])

  return (
    <>
      {children}
      {loginModalOpen && (
        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          storefront={storefront}
        />
      )}
      {signupModalOpen && (
        <SignupModal
          isOpen={signupModalOpen}
          onClose={() => setSignupModalOpen(false)}
          storefront={storefront}
        />
      )}
    </>
  )
}
