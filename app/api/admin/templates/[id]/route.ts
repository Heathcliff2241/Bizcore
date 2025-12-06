import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const pageId = parseInt(params.id, 10)
    if (isNaN(pageId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    })

    if (!page || page.tenantId !== null) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const template = {
      id: page.id.toString(),
      name: page.title,
      description: page.slug,
      content: page.content,
      isActive: page.isPublished,
      createdBy: `${page.user.firstName} ${page.user.lastName}`,
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const pageId = parseInt(params.id, 10)
    if (isNaN(pageId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    })

    if (!page || page.tenantId !== null) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const { name, description, isActive, content } = await req.json()

    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        ...(name !== undefined && { title: name.trim() }),
        ...(description !== undefined && { slug: description.trim() }),
        ...(isActive !== undefined && { isPublished: isActive }),
        ...(content !== undefined && { content }),
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    })

    const template = {
      id: updatedPage.id.toString(),
      name: updatedPage.title,
      description: updatedPage.slug,
      content: updatedPage.content,
      isActive: updatedPage.isPublished,
      createdBy: `${updatedPage.user.firstName} ${updatedPage.user.lastName}`,
      createdAt: updatedPage.createdAt.toISOString(),
      updatedAt: updatedPage.updatedAt.toISOString(),
    }

    return NextResponse.json({
      message: 'Template updated successfully',
      template,
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const pageId = parseInt(params.id, 10)
    if (isNaN(pageId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
    })

    if (!page || page.tenantId !== null) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    await prisma.page.delete({
      where: { id: pageId },
    })

    return NextResponse.json({
      message: 'Template deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
