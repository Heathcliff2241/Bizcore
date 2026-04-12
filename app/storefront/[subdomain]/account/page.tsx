import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AccountHeader } from '@/components/storefront/AccountHeader'
import { AccountPageClient } from '@/components/storefront/AccountPageClient'

interface Props {
  params: Promise<{ subdomain: string }> | { subdomain: string }
}

export default async function AccountPage({ params }: Props) {
  const resolvedParams = typeof (params as PromiseLike<{ subdomain: string }>).then === 'function'
    ? await (params as PromiseLike<{ subdomain: string }>)
    : (params as { subdomain: string })
  const { subdomain } = resolvedParams

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

  return (
    <>
      <AccountHeader storefront={storefront} />
      <AccountPageClient storefront={storefront} subdomain={subdomain} tenantId={String(tenant.id)} />
    </>
  )
}
