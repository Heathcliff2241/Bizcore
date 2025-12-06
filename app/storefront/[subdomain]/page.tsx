import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { customerAuthOptions } from '@/lib/customerAuth'
import { prisma } from '@/lib/prisma'
import { PageRenderer } from '@/components/storefront/PageRenderer'
import { HeaderSection } from '@/components/storefront/HeaderSection'
import { FooterSection } from '@/components/storefront/FooterSection'
import { buildStorefrontSettings } from '@/lib/storefront-helper'

interface ComponentData {
  id: string
  type: string
  props: Record<string, unknown>
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  rotation?: number
  zIndex?: number
  hidden?: boolean
  children?: ComponentData[]
}

interface Props {
  params: Promise<{
    subdomain: string
  }>
}

export default async function StorefrontHome(props: Props) {
  const params = await props.params
  const { subdomain } = params

  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (!tenant) {
    redirect('/404')
  }

  const session = await getServerSession(customerAuthOptions)

  try {
    // Find the home page (slug: 'home' or 'index')
    const homePage = await prisma.pageDesign.findFirst({
      where: {
        tenant: {
          subdomain
        },
        isPublished: true,
        OR: [
          { slug: 'home' },
          { slug: 'index' },
          { slug: '' }
        ]
      },
      include: {
        tenant: true
},
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (homePage) {
      const targetSlug = homePage.slug?.trim()
      const normalizedSlug = targetSlug?.toLowerCase()

      if (targetSlug && normalizedSlug && !['home', 'index', ''].includes(normalizedSlug)) {
        redirect(`/storefront/${subdomain}/${targetSlug}`)
      }

      // When the only published page is also the query slug (e.g. /home),
      // render it directly instead of redirecting to avoid infinite loops.
      const components = (homePage.publishedContent ?? homePage.content) as unknown as ComponentData[]
            
      const storefront = {
        id: homePage.tenant.id,
        subdomain: homePage.tenant.subdomain,
        name: homePage.tenant.name,
        settings: buildStorefrontSettings(homePage.tenant),
        primaryColor: homePage.tenant.primaryColor ?? undefined,
        secondaryColor: homePage.tenant.secondaryColor ?? undefined
      }
      
      return (
        <>
          {/* Render all components together (header, body, footer) to avoid gaps */}
          <PageRenderer
            components={components}
            storefront={storefront}
          />
        </>
      )
    }

    // If no home page found, show products for this tenant or a friendly message
    const products = await prisma.product.findMany({ where: { tenantId: tenant.id, isActive: true }, take: 20 })
    const hasHeader = false
        if (products && products.length > 0) {
      // Use the same ProductGrid for a nicer default home experience
      const { ProductGrid } = await import('@/components/storefront/ProductGrid')
      const storefront = {
        id: tenant.id,
        subdomain: tenant.subdomain,
        name: tenant.name,
        settings: buildStorefrontSettings(tenant),
        primaryColor: tenant.primaryColor ?? undefined,
        secondaryColor: tenant.secondaryColor ?? undefined
      }
      return (
        <>
          {!hasHeader && <HeaderSection storefront={storefront} fullWidth session={session} />}
          <main className="w-full">
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-6">{tenant.name} Menu</h1>
              <ProductGrid products={products.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), imageUrl: p.image ?? undefined, slug: p.name.toLowerCase().replace(/\s+/g, '-') }))} columns={3} showPrice />
            </div>
          </main>
          <FooterSection storefront={storefront} companyName={tenant.name} />
        </>
      )
    }

    return (
      <>
        <HeaderSection storefront={{
          id: tenant.id,
          subdomain: tenant.subdomain,
          name: tenant.name,
          settings: buildStorefrontSettings(tenant),
          primaryColor: tenant.primaryColor ?? undefined,
          secondaryColor: tenant.secondaryColor ?? undefined
        }} fullWidth={false} session={session} />
        <main className="w-full">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center max-w-2xl px-4">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Welcome to {tenant.name}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                This storefront is being set up. Check back soon!
              </p>
              <div className="flex items-center justify-center text-gray-400">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        </main>
        <FooterSection storefront={{
          id: tenant.id,
          subdomain: tenant.subdomain,
          name: tenant.name,
          settings: buildStorefrontSettings(tenant),
          primaryColor: tenant.primaryColor ?? undefined,
          secondaryColor: tenant.secondaryColor ?? undefined
        }} companyName={tenant.name} />
      </>
    )
  } catch (error) {
    console.error('Error loading storefront home:', error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-900 mb-2">Error Loading Storefront</h1>
          <p className="text-red-700">An error occurred while loading this page.</p>
        </div>
      </div>
    )
  }
}
