import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AccountNavigation } from '@/components/storefront/AccountNavigation'
import { AccountContent } from '@/components/storefront/AccountContent'

interface Props {
  params: Promise<{ subdomain: string }> | { subdomain: string }
}

export default async function AccountOrdersPage({ params }: Props) {
  const resolvedParams = params as PromiseLike<{ subdomain: string }> | { subdomain: string }
  const resolved = typeof (resolvedParams as PromiseLike<{ subdomain: string }>).then === 'function'
    ? await (resolvedParams as PromiseLike<{ subdomain: string }>)
    : (resolvedParams as { subdomain: string })
  const { subdomain } = resolved

  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (!tenant) return notFound()

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/auth/signin?redirect=/storefront/${subdomain}/account/orders`)
  }

  // Ensure the session's tenant matches
  if (session.user.tenantId && session.user.tenantId !== tenant.id.toString()) {
    redirect(`/storefront/${subdomain}/signin?redirect=/storefront/${subdomain}/account/orders`)
  }

  const customer = await prisma.customer.findFirst({ where: { email: session.user.email || '', tenantId: tenant.id } })
  if (!customer) {
    redirect(`/storefront/${subdomain}/signin?redirect=/storefront/${subdomain}/account/orders`)
  }

  const storefront = {
    id: tenant.id,
    subdomain: tenant.subdomain,
    name: tenant.name,
    settings: tenant.settings as Record<string, unknown> | undefined,
    primaryColor: tenant.primaryColor ?? undefined,
    secondaryColor: tenant.secondaryColor ?? undefined
  }

  const customerData = customer ?? {
    firstName: 'Customer',
    lastName: '',
    email: session.user.email || '',
  }

  return (
    <main className="w-full min-h-screen bg-white">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-20">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Your Orders</h1>
          <p className="text-gray-500 mt-2">Review your orders and track status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="md:col-span-1">
            <AccountNavigation storefront={{ subdomain: tenant.subdomain }} />
          </aside>
          <section className="md:col-span-3">
            <AccountContent storefront={storefront} customer={customerData} activeTab="orders" />
          </section>
        </div>
      </div>
    </main>
  )
}
