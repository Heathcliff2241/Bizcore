import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
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

  const cssVars: React.CSSProperties = {
    '--color-primary': storefront.primaryColor || '#3b82f6',
    '--color-secondary': storefront.secondaryColor || '#10b981'
  } as React.CSSProperties

  return (
    <CustomerProviders>
      <CartProvider>
        <div style={cssVars as React.CSSProperties} className="min-h-screen bg-white text-slate-900">
          {children}
        </div>
      </CartProvider>
    </CustomerProviders>
  )
}
