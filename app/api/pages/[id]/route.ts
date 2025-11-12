import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// CORS headers for Vite dev server
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5174',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

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

// GET /api/pages/[id] - Get single page
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await resolveParams(context.params)
    const pageId = Number.parseInt(id, 10)
    if (Number.isNaN(pageId)) {
      return NextResponse.json({ message: 'Invalid page id' }, { status: 400, headers: corsHeaders })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const page = await prisma.pageDesign.findUnique({
      where: { id: pageId },
      include: {
        seoSettings: true,
        revisions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!page) {
      return NextResponse.json({ message: 'Page not found' }, { status: 404, headers: corsHeaders })
    }

    return NextResponse.json({
      success: true,
      data: page
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch page' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// PUT /api/pages/[id] - Update page
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await resolveParams(context.params)
    const pageId = Number.parseInt(id, 10)
    if (Number.isNaN(pageId)) {
      return NextResponse.json({ message: 'Invalid page id' }, { status: 400, headers: corsHeaders })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const body = await request.json()
    const {
      title,
      slug,
      description,
      content,
      template,
      isDraft,
      seoSettings
    } = body

    // Check if page exists
    const existingPage = await prisma.pageDesign.findUnique({
      where: { id: pageId }
    })

    if (!existingPage) {
      return NextResponse.json({ message: 'Page not found' }, { status: 404, headers: corsHeaders })
    }

    // Create a revision before updating
    if (content && existingPage.content) {
      const lastRevision = await prisma.pageDesignRevision.findFirst({
        where: { pageDesignId: pageId },
        orderBy: { revisionNumber: 'desc' }
      })

      await prisma.pageDesignRevision.create({
        data: {
          pageDesignId: pageId,
          content: existingPage.content,
          revisionNumber: (lastRevision?.revisionNumber || 0) + 1,
          createdBy: parseInt(session.user.id)
        }
      })
    }

    // Update page
    const updateData: Prisma.PageDesignUpdateInput = {
      updatedAt: new Date()
    }

    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (content !== undefined) updateData.content = content
    if (template !== undefined) updateData.template = template
    if (isDraft !== undefined) updateData.isDraft = isDraft

    const page = await prisma.pageDesign.update({
      where: { id: pageId },
      data: updateData,
      include: {
        seoSettings: true
      }
    })

    // Update SEO settings if provided
    if (seoSettings && page.id) {
      await prisma.seoSettings.upsert({
        where: { pageDesignId: page.id },
        create: {
          pageDesignId: page.id,
          ...seoSettings
        },
        update: seoSettings
      })
    }

    return NextResponse.json({
      success: true,
      data: page
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update page' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// DELETE /api/pages/[id] - Delete page
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await resolveParams(context.params)
    const pageId = Number.parseInt(id, 10)
    if (Number.isNaN(pageId)) {
      return NextResponse.json({ message: 'Invalid page id' }, { status: 400, headers: corsHeaders })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const page = await prisma.pageDesign.findUnique({
      where: { id: pageId }
    })

    if (!page) {
      return NextResponse.json({ message: 'Page not found' }, { status: 404, headers: corsHeaders })
    }

    // Delete related records first
    await prisma.seoSettings.deleteMany({
      where: { pageDesignId: pageId }
    })

    await prisma.pageDesignRevision.deleteMany({
      where: { pageDesignId: pageId }
    })

    // Delete page
    await prisma.pageDesign.delete({
      where: { id: pageId }
    })

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully'
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete page' },
      { status: 500, headers: corsHeaders }
    )
  }
}
