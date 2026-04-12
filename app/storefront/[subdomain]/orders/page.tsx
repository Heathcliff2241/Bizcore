import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FooterSection } from '@/components/storefront/FooterSection'
import { HeaderSection } from '@/components/storefront/HeaderSection'
import { PageRenderer } from '@/components/storefront/PageRenderer'
import { getHomePageComponents } from '@/lib/getHomePageComponents'
import { buildStorefrontObject } from '@/lib/storefront-helper'
import Link from 'next/link'

interface Props {
  params: Promise<{
    subdomain: string
  }> | {
    subdomain: string
  }
}

export default async function OrdersPage({ params }: Props) {
  const paramsResult = params as Promise<{ subdomain: string }> | { subdomain: string }
  const resolvedParams = typeof (paramsResult as PromiseLike<{ subdomain: string }>).then === 'function'
    ? await (paramsResult as PromiseLike<{ subdomain: string }>)
    : (paramsResult as { subdomain: string })
  const { subdomain } = resolvedParams

  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (!tenant) {
    return notFound()
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
  redirect(`/auth/signin?redirect=/storefront/${subdomain}/orders`)
  }

  const storefront = buildStorefrontObject(tenant)

  // Get custom footer from home page
  const { footer, hasCustomFooter } = await getHomePageComponents(tenant.id)

  // Fetch customer orders
  const customer = await prisma.customer.findFirst({
    where: { email: session.user.email || '', tenantId: tenant.id }
  })

  const orders = customer
    ? await prisma.order.findMany({
        where: { customerId: customer.id, tenantId: tenant.id },
        include: { orderItems: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
      })
    : []

  // Get tax rate from tenant settings
  const taxRate = tenant.settings && typeof tenant.settings === 'object' && 'tax' in tenant.settings
    ? ((tenant.settings as Record<string, unknown>).tax as Record<string, unknown>).defaultTaxPercent || 0
    : 0

  return (
    <>
      <HeaderSection storefront={storefront} fullWidth />
      <main className="w-full min-h-screen bg-white">
        {/* Hero Section */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-20">
          <div className="mb-16">
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 mb-4">
              Your Orders
            </h1>
            <p className="text-xl text-gray-500">Track and manage your purchases</p>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-2xl bg-gray-50">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2z" />
                </svg>
                <p className="text-lg text-gray-600 mb-6">No orders yet</p>
                <Link href={`/storefront/${subdomain}/products`}>
                  <button className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-900 transition-colors">
                    Start Shopping
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-gray-900">₱{order.total.toFixed(2)}</p>
                      <span className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-sm font-medium text-gray-900 mb-4">Items</p>
                    <div className="space-y-3">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2">
                          <span className="text-gray-600">
                            {item.product?.name} <span className="text-gray-500">× {item.quantity}</span>
                          </span>
                          <span className="font-medium text-gray-900">₱{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 mt-6 pt-6 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">
                        ₱{order.orderItems.reduce((sum: number, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Tax ({taxRate}%)</span>
                      <span className="text-gray-900">₱{order.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base font-semibold border-t border-gray-100 pt-3">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">₱{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
