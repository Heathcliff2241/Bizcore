import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)

  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  }

  try {
    const categoryId = Number(params.id)
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid category ID' }, { status: 400 })
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, tenantId: tenant.id }
    })

    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { category } })
  } catch (error) {
    console.error('Failed to fetch category:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)

  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  }

  try {
    const categoryId = Number(params.id)
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid category ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, image, isActive, sortOrder } = body

    // Verify category belongs to tenant
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, tenantId: tenant.id }
    })

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 })
    }

    // Build update data - only include fields that were provided
    const updateData: Record<string, unknown> = {}

    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim()
    } else if (name === undefined) {
      // name not provided, keep existing
    } else if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      )
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (image !== undefined) {
      updateData.image = image
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }

    if (typeof sortOrder === 'number') {
      updateData.sortOrder = sortOrder
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData
    })

    return NextResponse.json({ success: true, data: { category } })
  } catch (error) {
    console.error('Failed to update category:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)

  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  }

  try {
    const categoryId = Number(params.id)
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid category ID' }, { status: 400 })
    }

    // Verify category belongs to tenant
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, tenantId: tenant.id }
    })

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 })
    }

    // Delete the category
    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
