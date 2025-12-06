import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const tenantId = parseInt(id)

    if (isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      logo,
      primaryColor,
      secondaryColor,
      plan,
      isActive,
      subscriptionExpires
    } = body

    // Verify tenant exists
    const existing = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (logo !== undefined) updateData.logo = logo
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor
    if (plan !== undefined) updateData.subscriptionPlan = plan
    if (isActive !== undefined) updateData.isActive = isActive
    if (subscriptionExpires !== undefined) updateData.subscriptionExpires = subscriptionExpires ? new Date(subscriptionExpires) : null

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      subdomain: updated.subdomain,
      description: updated.description,
      logo: updated.logo,
      isActive: updated.isActive,
      plan: updated.subscriptionPlan,
      subscriptionExpires: updated.subscriptionExpires,
      primaryColor: updated.primaryColor,
      secondaryColor: updated.secondaryColor,
      owner: updated.owner,
      updatedAt: updated.updatedAt
    })
  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const tenantId = parseInt(id)

    if (isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      )
    }

    // Instead of deleting, deactivate the tenant
    // This preserves data for historical records
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tenant:', error)
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    )
  }
}
