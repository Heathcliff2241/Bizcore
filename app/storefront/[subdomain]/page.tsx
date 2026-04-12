import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageRenderer } from '@/components/storefront/PageRenderer'
import { HeaderSection } from '@/components/storefront/HeaderSection'
import { FooterSection } from '@/components/storefront/FooterSection'
import { StorefrontHomeClient } from '@/components/storefront/StorefrontHomeClient'

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
  }> | {
    subdomain: string
  }
}

export default async function StorefrontRoot({ params }: Props) {
  const paramsResult = params as Promise<{ subdomain: string }> | { subdomain: string }
  const resolvedParams = typeof (paramsResult as PromiseLike<{ subdomain: string }>).then === 'function'
    ? await (paramsResult as PromiseLike<{ subdomain: string }>)
    : (paramsResult as { subdomain: string })
  const { subdomain } = resolvedParams

  // Get server session once to pass down to components
  const session = await getServerSession(authOptions)

  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (!tenant) {
    notFound()
  }

  // Build storefront object once to reuse throughout
  const storefrontContext = {
    id: tenant.id,
    subdomain: tenant.subdomain,
    name: tenant.name,
    settings: tenant.settings as Record<string, unknown> | undefined,
    primaryColor: tenant.primaryColor ?? undefined,
    secondaryColor: tenant.secondaryColor ?? undefined
  }

  try {
    // Find the home page - prioritize 'home' slug, then fall back to 'menu', 'products', or empty
    const homePage = await prisma.pageDesign.findFirst({
      where: {
        tenant: {
          subdomain
        },
        isPublished: true,
        slug: 'home'  // Explicitly look for 'home' slug first
      },
      include: {
        tenant: true
      }
    })

    // If no 'home' page, try other slugs
    let pageToRender = homePage
    if (!pageToRender) {
      pageToRender = await prisma.pageDesign.findFirst({
        where: {
          tenant: {
            subdomain
          },
          isPublished: true,
          OR: [
            { slug: 'menu' },
            { slug: 'products' },
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
    }

    if (pageToRender) {
      // Ensure publishedContent is treated as ComponentData[]
      const components = (pageToRender.publishedContent ?? pageToRender.content ?? []) as unknown as ComponentData[]
      
      console.log('[Storefront] Home page found:', {
        pageId: pageToRender.id,
        slug: pageToRender.slug,
        isPublished: pageToRender.isPublished,
        hasPublishedContent: !!pageToRender.publishedContent,
        publishedContentType: typeof pageToRender.publishedContent,
        publishedContentLength: Array.isArray(pageToRender.publishedContent) ? (pageToRender.publishedContent as unknown[]).length : 'not-array',
        contentType: typeof pageToRender.content,
        contentLength: Array.isArray(pageToRender.content) ? (pageToRender.content as unknown[]).length : 'not-array',
        componentsType: typeof components,
        componentsIsArray: Array.isArray(components),
        componentsLength: Array.isArray(components) ? components.length : 'not-array'
      })
      
      // Skip rendering if no valid components
      if (!Array.isArray(components)) {
        console.warn('[Storefront] Invalid components format:', typeof components)
        // Fall through to fallback rendering
      } else {
        const hasHeader = components.some(comp => comp.type === 'header' || comp.type === 'HeaderSection' || comp.type.toLowerCase().includes('header'))
        const hasFooter = components.some(comp => comp.type === 'footer' || comp.type === 'FooterSection' || comp.type.toLowerCase().includes('footer'))
              
        const storefront = {
          id: pageToRender.tenant.id,
          subdomain: pageToRender.tenant.subdomain,
          name: pageToRender.tenant.name,
          settings: pageToRender.tenant.settings as Record<string, unknown> | undefined,
          primaryColor: pageToRender.tenant.primaryColor ?? undefined,
          secondaryColor: pageToRender.tenant.secondaryColor ?? undefined
        }
        
        return (
          <StorefrontHomeClient storefront={storefrontContext}>
            <>
              {!hasHeader && <HeaderSection storefront={storefront} fullWidth session={session} />}
              <PageRenderer
                components={components}
                storefront={storefront}
              />
              {!hasFooter && <FooterSection storefront={storefront} companyName={storefront.name} />}
            </>
          </StorefrontHomeClient>
        )
      }
    }

    // If no home page found, show products for this tenant or a friendly message
    const products = await prisma.product.findMany({ where: { tenantId: tenant.id, isActive: true }, take: 20 })
    if (products && products.length > 0) {
      const { ProductGrid } = await import('@/components/storefront/ProductGrid')
      const storefront = {
        id: tenant.id,
        subdomain: tenant.subdomain,
        name: tenant.name,
        settings: tenant.settings as Record<string, unknown> | undefined,
        primaryColor: tenant.primaryColor ?? undefined,
        secondaryColor: tenant.secondaryColor ?? undefined
      }
      return (
        <StorefrontHomeClient storefront={storefrontContext}>
          <>
            <HeaderSection storefront={storefront} fullWidth session={session} />
            <main className="w-full">
              <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-6">{tenant.name} Menu</h1>
                <ProductGrid products={products.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), imageUrl: p.image ?? undefined, slug: p.name.toLowerCase().replace(/\s+/g, '-') }))} columns={3} showPrice />
              </div>
            </main>
            <FooterSection storefront={storefront} companyName={tenant.name} />
          </>
        </StorefrontHomeClient>
      )
    }

    return (
      <StorefrontHomeClient storefront={storefrontContext}>
        <>
          <HeaderSection storefront={{
            id: tenant.id,
            subdomain: tenant.subdomain,
            name: tenant.name,
            settings: tenant.settings as Record<string, unknown> | undefined,
            primaryColor: tenant.primaryColor ?? undefined,
            secondaryColor: tenant.secondaryColor ?? undefined
          }} fullWidth />
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
            settings: tenant.settings as Record<string, unknown> | undefined,
            primaryColor: tenant.primaryColor ?? undefined,
            secondaryColor: tenant.secondaryColor ?? undefined
          }} companyName={tenant.name} />
        </>
      </StorefrontHomeClient>
    )
  } catch (error) {
    console.error('Error loading storefront home:', error)
    return (
      <StorefrontHomeClient storefront={storefrontContext}>
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-900 mb-2">Error Loading Storefront</h1>
            <p className="text-red-700">An error occurred while loading this page.</p>
          </div>
        </div>
      </StorefrontHomeClient>
    )
  }
}
