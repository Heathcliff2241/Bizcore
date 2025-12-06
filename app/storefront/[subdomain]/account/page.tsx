import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { AuthContainer } from '@/components/storefront/AuthContainer'
import { LoginForm } from '@/components/storefront/LoginForm'
import { AccountNavigation } from '@/components/storefront/AccountNavigation'
import { AccountContent } from '@/components/storefront/AccountContent'
import { getServerSession } from 'next-auth/next'
import { customerAuthOptions } from '@/lib/customerAuth'

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

  const session = await getServerSession(customerAuthOptions)
  console.log('[STOREFRONT_ACCOUNT] session check for subdomain:', subdomain, 'sessionUser:', session?.user?.email, 'sessionTenant:', session?.user?.tenantId)

  // If the user isn't logged in, show the sign-in form
  if (!session?.user?.id) {
    return (
      <>
        {/* No header for account page; login UI is inline */}
        <main className="w-full">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
            <AuthContainer>
              <LoginForm storefront={storefront} />
            </AuthContainer>
          </div>
        </main>
        {/* No footer for account page */}
      </>
    )
  }

  // If the session belongs to a customer for a different tenant, redirect to signin for this subdomain
  const sessionTenantId = session?.user?.tenantId
  if (sessionTenantId && sessionTenantId !== tenant.id.toString()) {
    redirect(`/storefront/${subdomain}/signin?redirect=/storefront/${subdomain}/account`)
  }

  // Load real customer via session
  const customer = await prisma.customer.findFirst({ where: { email: session.user.email || '', tenantId: tenant.id } })
  if (!customer) {
    // If the session exists but the customer isn't found for this tenant, ask the user to sign in
    redirect(`/storefront/${subdomain}/signin?redirect=/storefront/${subdomain}/account`)
  }
  const customerData = customer ?? {
    firstName: 'Customer',
    lastName: '',
    email: session.user.email ?? '',
    phone: '',
    address: ''
  }

  return (
    <>
      {/* No header on account page */}
      <main className="w-full min-h-screen bg-white">
        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-20">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Your Account</h1>
              <p className="text-gray-500 mt-2">Manage your details and view your recent activity</p>
            </div>
            <div className="flex-shrink-0">
              <Link href={`/storefront/${subdomain}/products`} aria-label="Order more products">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">
                  Order More
                </button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside className="md:col-span-1">
              <AccountNavigation storefront={{ subdomain: tenant.subdomain }} />
            </aside>
            <section className="md:col-span-3">
              <AccountContent storefront={storefront} customer={customerData} activeTab="profile" />
            </section>
          </div>
        </div>
      </main>

      {/* No footer on account page */}
    </>
  )
}
