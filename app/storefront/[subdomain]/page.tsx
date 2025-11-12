import { redirect } from 'next/navigation'
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
  children?: ComponentData[]
}

interface Props {
  params: Promise<{
    subdomain: string
  }> | {
    subdomain: string
  }
}

export default async function StorefrontHome({ params }: Props) {
  const paramsResult = params as Promise<{ subdomain: string }> | { subdomain: string }
  const resolvedParams = typeof (paramsResult as PromiseLike<{ subdomain: string }>).then === 'function'
    ? await (paramsResult as PromiseLike<{ subdomain: string }>)
    : (paramsResult as { subdomain: string })
  const { subdomain } = resolvedParams

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
      return (
        <PageRenderer
          components={(homePage.publishedContent ?? homePage.content) as unknown as ComponentData[]}
          storefront={{
            id: homePage.tenant.id,
            subdomain: homePage.tenant.subdomain,
            name: homePage.tenant.name,
            settings: homePage.tenant.settings as Record<string, unknown> | undefined
          }}
        />
      )
    }

    // If no home page found, show a simple message
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-2xl px-4">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to {subdomain}
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
