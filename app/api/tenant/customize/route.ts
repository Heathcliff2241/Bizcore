import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface CustomizeTenantPayload {
  industry?: string
  primaryColor?: string
  secondaryColor?: string
  description?: string
  services?: unknown
}

interface ComponentProps extends Record<string, unknown> {
  backgroundColor?: string
  subheading?: string
  text?: string
}

interface ComponentNode {
  id: string
  type: string
  props: ComponentProps
  children?: ComponentNode[]
}

interface CustomizationOptions {
  primaryColor?: string
  secondaryColor?: string
  description?: string
  services: string[]
}

async function getTenantId(userId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    include: { tenantUsers: true }
  })

  return user?.tenantUsers[0]?.tenantId ?? null
}

function isComponentArray(value: unknown): value is ComponentNode[] {
  return Array.isArray(value)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const payload = await request.json() as CustomizeTenantPayload & { subdomain?: string }

    let tenantId: number | null = null

    // If subdomain is provided (from onboarding), use that
    if (payload.subdomain) {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain: payload.subdomain }
      })
      tenantId = tenant?.id ?? null
    } else if (session?.user?.id) {
      // Otherwise use session-based auth
      tenantId = await getTenantId(session.user.id)
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }

    const {
      industry,
      primaryColor,
      secondaryColor,
      description,
      services
    } = payload

    const serviceList = Array.isArray(services)
      ? services.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []

    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          primaryColor,
          secondaryColor,
          industry,
          description
        }
      })

      const pages = await tx.pageDesign.findMany({
        where: { tenantId }
      })

      for (const page of pages) {
        const components = isComponentArray(page.content) ? page.content : []
        const updatedComponents = applyCustomizationsToComponents(components, {
          primaryColor,
          secondaryColor,
          description,
          services: serviceList
        })
        const updatedJson = updatedComponents as unknown as Prisma.InputJsonValue

        await tx.pageDesign.update({
          where: { id: page.id },
          data: {
            content: updatedJson,
            publishedContent: updatedJson
          }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Customization error:', error)
    return NextResponse.json(
      { error: 'Failed to apply customizations' },
      { status: 500 }
    )
  }
}

function applyCustomizationsToComponents(
  components: ComponentNode[],
  customizations: CustomizationOptions
): ComponentNode[] {
  return components.map((component) => {
    const updatedProps: ComponentProps = { ...(component.props ?? {}) }

    if (customizations.primaryColor && ['hero-default', 'hero-minimal'].includes(component.type)) {
      updatedProps.backgroundColor = customizations.primaryColor
    }

    if (customizations.secondaryColor && ['cta-default', 'cta-split', 'cta-banner'].includes(component.type)) {
      updatedProps.backgroundColor = customizations.secondaryColor
    }

    if (customizations.description && component.type === 'hero-default') {
      updatedProps.subheading = customizations.description
    }

    if (
      customizations.services.length > 0 &&
      typeof updatedProps.text === 'string' &&
      updatedProps.text.includes('Our Services')
    ) {
      updatedProps.text = `Our Services: ${customizations.services.join(', ')}`
    }

    const updatedChildren = component.children
      ? applyCustomizationsToComponents(component.children, customizations)
      : undefined

    return {
      ...component,
      props: updatedProps,
      children: updatedChildren
    }
  })
}