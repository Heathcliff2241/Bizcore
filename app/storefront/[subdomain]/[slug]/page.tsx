import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { PageRenderer } from '@/components/storefront/PageRenderer'
import { Suspense } from 'react'

interface ComponentData {
  id: string
  type: string
  props: Record<string, unknown>
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  rotation?: number
  zIndex?: number
  hidden?: boolean
}

type RouteParams = { subdomain: string; slug: string }
type RouteParamsInput = RouteParams | Promise<RouteParams>

async function resolveParams(params: RouteParamsInput): Promise<RouteParams> {
  if (typeof (params as Promise<RouteParams>).then === 'function') {
    return params as Promise<RouteParams>
  }
  return params as RouteParams
}

// Generate static params for all published pages (including system pages that have been customized)
export async function generateStaticParams() {
  try {
    const pages = await prisma.pageDesign.findMany({
      where: { isPublished: true },
      include: {
        tenant: true
      }
    })

    return pages.map((page) => ({
      subdomain: page.tenant.subdomain,
      slug: page.slug
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: RouteParamsInput }): Promise<Metadata> {
  const { subdomain, slug } = await resolveParams(params)
  
  try {
    const page = await prisma.pageDesign.findFirst({
      where: {
        slug,
        isPublished: true,
        tenant: {
          subdomain
        }
      },
      include: {
        seoSettings: true,
        tenant: true
      }
    })

    if (!page) {
      return {
        title: 'Page Not Found',
        description: 'The requested page could not be found'
      }
    }

    const seo = page.seoSettings

    return {
      title: seo?.metaTitle || page.title || 'Page',
      description: seo?.metaDescription || '',
      keywords: seo?.metaKeywords || '',
      openGraph: {
        title: seo?.metaTitle || page.title || 'Page',
        description: seo?.metaDescription || '',
        images: seo?.ogImage ? [seo.ogImage] : [],
        type: 'website',
        siteName: page.tenant.name
      },
      twitter: {
        card: 'summary_large_image',
        title: seo?.metaTitle || page.title || 'Page',
        description: seo?.metaDescription || '',
        images: seo?.ogImage ? [seo.ogImage] : []
      },
      robots: {
        index: true,
        follow: true
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Error',
      description: 'An error occurred loading the page'
    }
  }
}

// Main page component
export default async function StorefrontPage({ params }: { params: RouteParamsInput }) {
  const { subdomain, slug } = await resolveParams(params)

  // Prevent catch-all route from matching empty slug (root)
  if (!slug) {
    notFound()
  }

  // Check if there's a published page with this slug (including system pages that have been customized)
  const publishedPage = await prisma.pageDesign.findFirst({
    where: {
      slug,
      isPublished: true,
      tenant: {
        subdomain
      }
    },
    include: {
      tenant: true
    }
  })

  if (!publishedPage) {
    notFound()
  }

  try {
    // Use publishedContent if available, otherwise fall back to content
    const componentsJson = publishedPage.publishedContent ?? publishedPage.content
    if (!componentsJson) {
      notFound()
    }

    const components = componentsJson as unknown as ComponentData[]

    // Filter components for header and footer
    const headerComponents = components.filter(comp => comp.type?.toString().startsWith('header'))
    const footerComponents = components.filter(comp => comp.type?.toString().startsWith('footer'))
    const bodyComponents = components.filter(comp => 
      !comp.type?.toString().startsWith('header') && 
      !comp.type?.toString().startsWith('footer')
    )
    
    const storefront = {
      id: publishedPage.tenant.id,
      subdomain: publishedPage.tenant.subdomain,
      name: publishedPage.tenant.name,
      settings: publishedPage.tenant.settings as Record<string, unknown> | undefined,
      primaryColor: publishedPage.tenant.primaryColor ?? undefined,
      secondaryColor: publishedPage.tenant.secondaryColor ?? undefined
    }
    
    return (
      <Suspense fallback={<div>Loading...</div>}>
        {headerComponents.length > 0 && (
          <PageRenderer components={headerComponents} storefront={storefront} />
        )}
        <PageRenderer
          components={bodyComponents}
          storefront={storefront}
        />
        {footerComponents.length > 0 && (
          <PageRenderer components={footerComponents} storefront={storefront} />
        )}
      </Suspense>
    )
  } catch (error) {
    console.error('Error loading storefront page:', error)
    notFound()
  }
}

// Enable ISR with revalidation
export const revalidate = 3600 // Revalidate every hour
