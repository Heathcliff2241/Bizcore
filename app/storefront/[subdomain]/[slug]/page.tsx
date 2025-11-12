import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { PageRenderer } from '@/components/storefront/PageRenderer'

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

// Generate static params for all published pages
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

  try {
    // Fetch the published page
    const page = await prisma.pageDesign.findFirst({
      where: {
        slug,
        isPublished: true,
        tenant: {
          subdomain
        }
      },
      include: {
        tenant: true,
        seoSettings: true
      }
    })

    // If page not found or not published, show 404
    if (!page) {
      notFound()
    }

    // Use publishedContent if available, otherwise fall back to content
    const componentsJson = page.publishedContent ?? page.content
    if (!componentsJson) {
      notFound()
    }

    const components = componentsJson as unknown as ComponentData[]

    // Render the page with components
    return (
      <PageRenderer 
        components={components}
        storefront={{
          id: page.tenant.id,
          subdomain: page.tenant.subdomain,
          name: page.tenant.name,
          settings: page.tenant.settings as Record<string, unknown> | undefined
        }}
      />
    )
  } catch (error) {
    console.error('Error loading storefront page:', error)
    notFound()
  }
}

// Enable ISR with revalidation
export const revalidate = 3600 // Revalidate every hour
