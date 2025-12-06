import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface ComponentData {
  id: string
  type: string
  props: Record<string, unknown>
  children?: ComponentData[]
  hidden?: boolean
}

export async function GET(
  req: Request,
  { params }: { params: { subdomain: string } }
) {
  try {
    const paramsResult =
      typeof (params as unknown as PromiseLike<{ subdomain: string }>).then === 'function'
        ? await (params as unknown as PromiseLike<{ subdomain: string }>)
        : (params as { subdomain: string });
    const { subdomain } = paramsResult

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const landingPage = await prisma.pageDesign.findFirst({
      where: {
        tenantId: tenant.id,
        isPublished: true as boolean
      }
    })

    if (!landingPage) {
      return NextResponse.json({ error: 'No landing page published' }, { status: 404 })
    }

    const rawComponents = (landingPage.publishedContent ?? landingPage.content) as unknown
    const components = Array.isArray(rawComponents) ? (rawComponents as ComponentData[]) : []

    return NextResponse.json({
      components,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor
      }
    })
  } catch (error) {
    console.error('Error fetching landing page design:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
