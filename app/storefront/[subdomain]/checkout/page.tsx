import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { HeaderSection } from '@/components/storefront/HeaderSection'
import { FooterSection } from '@/components/storefront/FooterSection'
import { CheckoutForm } from '@/components/storefront/CheckoutForm'
import { PageRenderer } from '@/components/storefront/PageRenderer'
import { getHomePageComponents } from '@/lib/getHomePageComponents'

export default async function CheckoutPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (!tenant) return notFound()

  const storefront = {
    id: tenant.id,
    subdomain: tenant.subdomain,
    name: tenant.name,
    settings: tenant.settings as Record<string, unknown> | undefined,
    primaryColor: tenant.primaryColor ?? undefined,
    secondaryColor: tenant.secondaryColor ?? undefined
  }

  // Get custom header/footer from home page
  const { header, footer, hasCustomHeader, hasCustomFooter } = await getHomePageComponents(tenant.id)

  return (
    <>
      {hasCustomHeader ? (
        <PageRenderer components={header} storefront={storefront} />
      ) : (
        <HeaderSection storefront={storefront} fullWidth />
      )}
      <CheckoutForm storefront={storefront} />
      {hasCustomFooter ? (
        <PageRenderer components={footer} storefront={storefront} />
      ) : (
        <FooterSection storefront={storefront} companyName={storefront.name} />
      )}
    </>
  )
}

