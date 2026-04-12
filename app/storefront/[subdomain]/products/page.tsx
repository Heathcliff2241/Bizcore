import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/storefront/ProductGrid'
import { PageRenderer } from '@/components/storefront/PageRenderer'
import { HeaderSection } from '@/components/storefront/HeaderSection'
import { FooterSection } from '@/components/storefront/FooterSection'
import { getHomePageComponents } from '@/lib/getHomePageComponents'
import { buildStorefrontObject } from '@/lib/storefront-helper'

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

export default async function ProductsIndex({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (!tenant) return notFound()

  const session = await getServerSession(authOptions)

  const storefront = buildStorefrontObject(tenant)

  const products = await prisma.product.findMany({ where: { tenantId: tenant.id, isActive: true }, take: 50 })

  // Check if there's a BrandStudio page for "products" with header/footer components
  const productsPage = await prisma.pageDesign.findFirst({
    where: {
      tenantId: tenant.id,
      slug: 'products',
      isPublished: true
    },
    select: {
      content: true,
      publishedContent: true
    }
  })

  let headerComponents: ComponentData[] = []
  let footerComponents: ComponentData[] = []
  let bodyComponents: ComponentData[] = []

  if (productsPage) {
    try {
      const components = (productsPage.publishedContent ?? productsPage.content) as unknown as ComponentData[]
      headerComponents = components.filter(comp => comp.type?.toString().startsWith('header'))
      footerComponents = components.filter(comp => comp.type?.toString().startsWith('footer'))
      bodyComponents = components.filter(comp => 
        !comp.type?.toString().startsWith('header') && 
        !comp.type?.toString().startsWith('footer')
      )
    } catch (error) {
      console.error('Error parsing products page components:', error)
    }
  }

  // Fallback to home page header/footer if no custom products page
  const homeComponents = await getHomePageComponents(tenant.id)
  const useHomeHeader = headerComponents.length === 0 && homeComponents.hasCustomHeader
  const useHomeFooter = footerComponents.length === 0 && homeComponents.hasCustomFooter

  return (
    <>
      {headerComponents.length > 0 ? (
        <PageRenderer components={headerComponents} storefront={storefront} />
      ) : useHomeHeader ? (
        <PageRenderer components={homeComponents.header} storefront={storefront} />
      ) : (
        <HeaderSection storefront={storefront} fullWidth session={session} />
      )}
      {bodyComponents.length > 0 ? (
        <PageRenderer components={bodyComponents} storefront={storefront} />
      ) : (
        <main className="w-full">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
            <ProductGrid products={products.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), imageUrl: p.image ?? undefined, slug: p.name.toLowerCase().replace(/\s+/g, '-') }))} columns={4} showPrice />
          </div>
        </main>
      )}
      {footerComponents.length > 0 ? (
        <PageRenderer components={footerComponents} storefront={storefront} />
      ) : useHomeFooter ? (
        <PageRenderer components={homeComponents.footer} storefront={storefront} />
      ) : (
        <FooterSection storefront={storefront} companyName={storefront.name} />
      )}
    </>
  )
}
