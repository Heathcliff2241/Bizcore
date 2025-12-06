import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { customerAuthOptions } from '@/lib/customerAuth'
import { prisma } from '@/lib/prisma'
import { PageRenderer } from '@/components/storefront/PageRenderer'
import { AuthContainer } from '@/components/storefront/AuthContainer'
import { LoginForm } from '@/components/storefront/LoginForm'
import { HeaderSection } from '@/components/storefront/HeaderSection'
import { FooterSection } from '@/components/storefront/FooterSection'
import { getHomePageComponents } from '@/lib/getHomePageComponents'
import type { Metadata } from 'next'

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

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Sign in' }
}

export default async function SignInPage({ params }: { params: { subdomain: string } }) {
  const { subdomain } = await params
  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (!tenant) return notFound()

  const session = await getServerSession(customerAuthOptions)

  const storefront = {
    id: tenant.id,
    subdomain: tenant.subdomain,
    name: tenant.name,
    settings: tenant.settings as Record<string, unknown>,
    primaryColor: tenant.primaryColor || undefined,
    secondaryColor: tenant.secondaryColor || undefined
  }

  const page = await prisma.pageDesign.findFirst({
    where: { slug: 'signin', isPublished: true, tenant: { subdomain } },
    include: { tenant: true }
  })

  if (page && (page.publishedContent ?? page.content)) {
    return (
      <PageRenderer
        components={(page.publishedContent ?? page.content) as unknown as ComponentData[]}
        storefront={storefront}
      />
    )
  }

  // Get home page header/footer for consistent branding
  const { header, footer, hasCustomHeader, hasCustomFooter } = await getHomePageComponents(tenant.id)

  return (
    <>
      {hasCustomHeader ? (
        <PageRenderer components={header} storefront={storefront} />
      ) : (
        <HeaderSection storefront={storefront} fullWidth session={session} />
      )}
      <main className="w-full">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
          <AuthContainer>
            <LoginForm storefront={storefront} />
          </AuthContainer>
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
