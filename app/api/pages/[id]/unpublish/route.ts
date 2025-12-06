import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { revalidatePath } from 'next/cache'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'
import { Prisma } from '@prisma/client'

type RouteParamsResult = { id: string } | Promise<{ id: string }>

interface RouteContext {
  params: RouteParamsResult
}

async function resolveParams(params: RouteParamsResult) {
  if (typeof (params as Promise<{ id: string }>).then === 'function') {
    return params as Promise<{ id: string }>
  }
  return params as { id: string }
}

export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await resolveParams(context.params)
    const pageId = Number.parseInt(id, 10)
    if (Number.isNaN(pageId)) {
      return NextResponse.json({ message: 'Invalid page id' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await resolveTenant(session)
    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
    }

    const page = await prisma.pageDesign.findFirst({
      where: { id: pageId, tenantId: tenant.id }
    })

    if (!page) {
      return NextResponse.json({ message: 'Page not found' }, { status: 404 })
    }

    const unpublishedPage = await prisma.pageDesign.update({
      where: { id: pageId },
      data: {
        isPublished: false,
        isDraft: true,
        publishedContent: Prisma.JsonNull,
        publishedAt: null,
        updatedAt: new Date()
      },
      include: {
        seoSettings: true
      }
    })

    // Revalidate the storefront cache with retry and report summary
    async function revalidateWithRetry(path: string, attempts = 3, delay = 250) {
      let lastError: any = null
      for (let i = 1; i <= attempts; i++) {
        try {
          revalidatePath(path)
          console.log(`Revalidated (attempt ${i}): ${path}`)
          return { success: true, attempts: i }
        } catch (err) {
          lastError = err
          console.warn(`Revalidate attempt ${i} failed for ${path}:`, err)
          await new Promise((r) => setTimeout(r, delay * i))
        }
      }
      console.error('All revalidation attempts failed for:', path, lastError)
      return { success: false, attempts, error: (lastError || {}).message || String(lastError) }
    }

    const revalidateResult = await revalidateWithRetry(`/storefront/${tenant.subdomain}/${page.slug}`)

    return NextResponse.json({
      success: true,
      data: unpublishedPage,
      message: 'Page unpublished successfully',
      revalidation: revalidateResult
    })
  } catch (error) {
    console.error('Error unpublishing page:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to unpublish page' },
      { status: 500 }
    )
  }
}