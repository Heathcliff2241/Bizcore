import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activityLogger'
import type { Prisma } from '@prisma/client'

// Revalidate the storefront page cache with retry and collect status
async function revalidateWithRetry(path: string, attempts = 3, delay = 250): Promise<{ success: boolean; attempts: number; error?: string }> {
  let lastError: Error | null = null
  for (let i = 1; i <= attempts; i++) {
    try {
      revalidatePath(path)
      console.log(`Revalidated (attempt ${i}): ${path}`)
      return { success: true, attempts: i }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`Revalidate attempt ${i} failed for ${path}:`, err)
      // Try again after a short delay
      await new Promise((r) => setTimeout(r, delay * i))
    }
  }
  console.error('All revalidation attempts failed for:', path, lastError)
  return { success: false, attempts, error: lastError?.message || String(lastError) }
}

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

    // Log the activity
    await logActivity({
      userId: session.user.id,
      tenantId,
      action: 'PAGE_PUBLISHED',
      details: {
        pageId,
        pageTitle: publishedPage.title,
        slug: page.slug,
        revalidated: true
      }
    })

    const revalidateResult = await revalidateWithRetry(`/storefront/${tenant.subdomain}/${page.slug}`)

    return NextResponse.json({
      success: true,
      data: publishedPage,
      message: 'Page published successfully',
      revalidation: revalidateResult
    })
  } catch (error) {
    console.error('Error publishing page:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to publish page' },
      { status: 500 }
    )
  }
}
