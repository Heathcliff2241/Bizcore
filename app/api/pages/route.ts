import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activityLogger'

// CORS headers - allow BrandStudio origins (both bizcore.test and localhost variants)
function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || ''
  
  // If no origin header, this is a same-origin request (from the same domain/port)
  // Don't apply CORS restrictions in this case
  if (!origin) {
    return {}
  }
  
  // Allowed origins - support bizcore.test and localhost variants
  const allowedOrigins = [
    'http://bizcore.test',
    'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost',
  ]
  
  const isAllowed = allowedOrigins.some(allowed => 
    origin === allowed || origin.startsWith(allowed)
  )
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  } as Record<string, string>
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(request) })
}

// GET /api/pages - Get all pages for tenant
export async function GET(request: NextRequest) {
  try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(request) })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json({ message: 'Tenant ID is required' }, { status: 400, headers: getCorsHeaders(request) })
    }

    const pages = await prisma.pageDesign.findMany({
      where: { tenantId: parseInt(tenantId) },
      include: {
        seoSettings: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: pages
    }, { headers: getCorsHeaders(request) })
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pages' },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

// POST /api/pages - Create new page
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      tenantId,
      slug,
      title,
      description,
      content,
      template,
      isDraft,
      seoSettings
    } = body

    if (!tenantId || !slug || !title || !template) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug already exists for this tenant
    const existing = await prisma.pageDesign.findFirst({
      where: {
        tenantId: parseInt(tenantId),
        slug
      }
    })

    if (existing) {
      return NextResponse.json(
        { message: 'A page with this slug already exists' },
        { status: 409 }
      )
    }

    // Create page
    const page = await prisma.pageDesign.create({
      data: {
        tenantId: parseInt(tenantId),
        slug,
        title,
        description,
        content: content || [],
        template,
        isDraft: isDraft !== undefined ? isDraft : true,
        isPublished: false,
        seoSettings: seoSettings ? {
          create: seoSettings
        } : undefined
      },
      include: {
        seoSettings: true
      }
    })

    // Log the activity
    await logActivity({
      userId: session.user.id,
      tenantId: parseInt(tenantId),
      action: 'PAGE_CREATED',
      details: {
        pageId: page.id,
        pageTitle: title,
        slug,
        template,
        isDraft: isDraft !== undefined ? isDraft : true
      }
    })

    return NextResponse.json({
      success: true,
      data: page
    }, { status: 201, headers: getCorsHeaders(request) })
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create page' },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}
