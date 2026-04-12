import { notFound, redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getServerSession } from 'next-auth/next'
import { signOut } from 'next-auth/react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CustomerProviders } from '@/lib/providers'
import { CartProvider } from '@/components/storefront/hooks/useCart'
import { buildStorefrontObject } from '@/lib/storefront-helper'

interface Props {
  children: ReactNode
  params: Promise<{ subdomain: string }>
}

// List of reserved paths that should NOT be caught by the [subdomain] catch-all
const RESERVED_PATHS = ['_next', 'api', 'auth', 'admin', 'dashboard', 'pos', 'brandstudio', 'studio', 'onboarding']

export default async function StorefrontLayout(props: Props) {
  const params = await props.params
  const { subdomain } = params
  const { children } = props

  // Don't process reserved system paths
  if (RESERVED_PATHS.includes(subdomain)) {
    return notFound()
  }

  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (!tenant) return notFound()

  const storefront = buildStorefrontObject(tenant)
  
  // Get server session to pass to SessionProvider for instant client-side availability
  const session = await getServerSession(authOptions)

  // If customer is logged in, validate they belong to this tenant
  if (session?.user?.id && session?.user?.role === 'customer') {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(session.user.id) }
    })

    // If customer doesn't exist or doesn't belong to this tenant, redirect to auth with sign out
    if (!customer || customer.tenantId !== tenant.id) {
      // Use redirect to sign out and go to login
      redirect(`/auth/signin?callbackUrl=/storefront/${subdomain}`)
    }
  }

  const cssVars: React.CSSProperties = {
    '--color-primary': storefront.primaryColor || '#3b82f6',
    '--color-secondary': storefront.secondaryColor || '#10b981'
  } as React.CSSProperties

  return (
    <CustomerProviders session={session}>
      <CartProvider>
        <div style={cssVars as React.CSSProperties} className="min-h-screen bg-white text-slate-900">
          {children}
        </div>
      </CartProvider>
    </CustomerProviders>
  )
}
