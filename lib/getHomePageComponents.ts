import { prisma } from '@/lib/prisma'

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

export interface HomePageComponents {
  header: ComponentData[]
  footer: ComponentData[]
  hasCustomHeader: boolean
  hasCustomFooter: boolean
}

/**
 * Fetch the home page's header and footer components from PageDesign
 * This allows consistent branding across all hardcoded pages
 */
export async function getHomePageComponents(tenantId: number): Promise<HomePageComponents> {
  try {
    const homePage = await prisma.pageDesign.findFirst({
      where: {
        tenantId,
        isPublished: true,
        OR: [
          { slug: 'home' },
          { slug: 'index' },
          { slug: '' }
        ]
      },
      select: {
        content: true,
        publishedContent: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (!homePage) {
      return {
        header: [],
        footer: [],
        hasCustomHeader: false,
        hasCustomFooter: false
      }
    }

    const components = (homePage.publishedContent ?? homePage.content) as unknown as ComponentData[]
    
    if (!Array.isArray(components)) {
      return {
        header: [],
        footer: [],
        hasCustomHeader: false,
        hasCustomFooter: false
      }
    }

    const headerComponents = components.filter(comp => 
      comp.type === 'header' || 
      comp.type === 'HeaderSection' || 
      comp.type.toLowerCase().includes('header')
    )
    
    const footerComponents = components.filter(comp => 
      comp.type === 'footer' || 
      comp.type === 'FooterSection' || 
      comp.type.toLowerCase().includes('footer')
    )

    return {
      header: headerComponents,
      footer: footerComponents,
      hasCustomHeader: headerComponents.length > 0,
      hasCustomFooter: footerComponents.length > 0
    }
  } catch (error) {
    console.error('Error fetching home page components:', error)
    return {
      header: [],
      footer: [],
      hasCustomHeader: false,
      hasCustomFooter: false
    }
  }
}
