import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

type RouteParamsResult = { id: string } | Promise<{ id: string }>

interface RouteContext {
  params: RouteParamsResult
}

// POST /api/pages/[id]/publish - Publish page
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const paramsResult = context.params
    const params = (typeof (paramsResult as PromiseLike<{ id: string }>).then === 'function')
      ? await (paramsResult as PromiseLike<{ id: string }>)
      : (paramsResult as { id: string })
    const pageId = Number.parseInt(params.id, 10)
    if (Number.isNaN(pageId)) {
      return NextResponse.json({ message: 'Invalid page id' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const tenantId = Number(body?.tenantId)

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      return NextResponse.json(
        { message: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Get current page
    const page = await prisma.pageDesign.findUnique({
      where: { id: pageId }
    })

    if (!page) {
      return NextResponse.json({ message: 'Page not found' }, { status: 404 })
    }

    // Get tenant for revalidation
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
    }

    // Update page with published content
    const publishedPage = await prisma.pageDesign.update({
      where: { id: pageId },
      data: {
        publishedContent: page.content as Prisma.InputJsonValue,
        isPublished: true,
        isDraft: false,
        publishedAt: new Date()
      },
      include: {
        seoSettings: true
      }
    })

    // Revalidate the storefront page cache
    try {
      revalidatePath(`/storefront/${tenant.subdomain}/${page.slug}`)
      console.log(`Revalidated: /storefront/${tenant.subdomain}/${page.slug}`)
    } catch (revalidateError) {
      console.error('Error revalidating path:', revalidateError)
      // Don't fail the publish if revalidation fails
    }

    return NextResponse.json({
      success: true,
      data: publishedPage,
      message: 'Page published successfully'
    })
  } catch (error) {
    console.error('Error publishing page:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to publish page' },
      { status: 500 }
    )
  }
}
