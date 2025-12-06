import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Fetch all admin templates from Page table (tenantId = null)
    const allTemplates = await prisma.page.findMany({
      where: { tenantId: null },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const templates = allTemplates.map((t) => ({
      id: t.id.toString(),
      name: t.title,
      description: t.slug,
      content: t.content,
      isActive: t.isPublished,
      createdBy: `${t.user.firstName} ${t.user.lastName}`,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      templates,
      total: templates.length,
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { name, description } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    const userId = parseInt(session.user.id, 10)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Create template in Page table with tenantId = null (admin)
    const newPage = await prisma.page.create({
      data: {
        tenantId: null,
        userId,
        title: name.trim(),
        slug: `template-${Date.now()}`,
        content: JSON.stringify({ sections: [], colors: {}, fonts: {} }),
        isPublished: false,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    })

    const template = {
      id: newPage.id.toString(),
      name: newPage.title,
      description: description?.trim() || '',
      content: newPage.content,
      isActive: newPage.isPublished,
      createdBy: `${newPage.user.firstName} ${newPage.user.lastName}`,
      createdAt: newPage.createdAt.toISOString(),
      updatedAt: newPage.updatedAt.toISOString(),
    }

    return NextResponse.json(
      {
        message: 'Template created successfully',
        template,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
