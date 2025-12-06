import ForgotPage from '@/app/auth/forgot/page'
import { getServerSession } from 'next-auth'
import { customerAuthOptions } from '@/lib/customerAuth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { HeaderSection } from '@/components/storefront/HeaderSection'
import { FooterSection } from '@/components/storefront/FooterSection'
import { PageRenderer } from '@/components/storefront/PageRenderer'
import { getHomePageComponents } from '@/lib/getHomePageComponents'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Forgot password' }

export default async function StorefrontForgot({ params }: { params: { subdomain: string } }) {
  const { subdomain } = await params
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (!tenant) return notFound()

  const session = await getServerSession(customerAuthOptions)

  const storefront = {
    id: tenant.id,
    subdomain: tenant.subdomain,
    name: tenant.name,
    settings: tenant.settings as Record<string, unknown>,
    primaryColor: tenant.primaryColor || undefined,
    secondaryColor: tenant.secondaryColor || undefined
  }

  // Get home page header/footer for consistent branding
  const { header, footer, hasCustomHeader, hasCustomFooter } = await getHomePageComponents(tenant.id)

  return (
    <>
      {hasCustomHeader ? (
        <PageRenderer components={header} storefront={storefront} />
      ) : (
        <HeaderSection storefront={storefront} fullWidth session={session} />
      )}
      <main className="w-full">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
          <div className="w-full max-w-3xl mx-auto">
            <ForgotPage />
          </div>
        </div>
      </main>
      {hasCustomFooter ? (
        <PageRenderer components={footer} storefront={storefront} />
      ) : (
        <FooterSection storefront={storefront} companyName={storefront.name} />
      )}
    </>
  )
}
