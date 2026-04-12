import { prisma } from '@/lib/prisma'
import { logTenantActivity } from '@/lib/activityLogger'
import { sendTenantDeactivationEmail } from '@/lib/email/tenantEmails'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const tenantId = parseInt(id)

    if (isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      )
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        tenantUsers: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            products: true,
            orders: true,
            employees: true,
            customers: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Calculate recent revenue
    const last30DaysOrders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      select: { total: true }
    })
    const monthlyRevenue = last30DaysOrders.reduce((sum, order) => sum + order.total, 0)

    const response = {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      domain: tenant.domain,
      description: tenant.description,
      logo: tenant.logo,
      favicon: tenant.favicon,
      isActive: tenant.isActive,
      isPremium: tenant.isPremium,
      plan: tenant.subscriptionPlan,
      subscriptionExpires: tenant.subscriptionExpires,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      owner: tenant.owner,
      team: tenant.tenantUsers.map(tu => ({
        id: tu.id,
        user: tu.user,
        role: tu.role
      })),
      employees: tenant.employees.map(emp => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        role: emp.role
      })),
      stats: {
        products: tenant._count.products,
        orders: tenant._count.orders,
        employees: tenant._count.employees,
        customers: tenant._count.customers,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100
      },
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}

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

    // Log the activity
    await logTenantActivity(
      tenantId,
      'TENANT_UPDATED',
      undefined,
      {
        changes: Object.keys(updateData),
        newValues: updateData
      }
    )

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

    // Get tenant info before hard deletion (including ownerId)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Hard delete - removes all tenant data permanently
    // First delete related data in correct order due to foreign keys
    await prisma.activityLog.deleteMany({
      where: { tenantId }
    })

    await prisma.adminNotification.deleteMany({
      where: { tenantId }
    })

    await prisma.order.deleteMany({
      where: { tenantId }
    })

    await prisma.product.deleteMany({
      where: { tenantId }
    })

    await prisma.employee.deleteMany({
      where: { tenantId }
    })

    await prisma.customer.deleteMany({
      where: { tenantId }
    })

    await prisma.category.deleteMany({
      where: { tenantId }
    })

    await prisma.page.deleteMany({
      where: { tenantId }
    })

    await prisma.pageDesign.deleteMany({
      where: { tenantId }
    })

    await prisma.storefrontSettings.deleteMany({
      where: { tenantId }
    })

    await prisma.billingPreference.deleteMany({
      where: { tenantId }
    })

    await prisma.subscription.deleteMany({
      where: { tenantId }
    })

    await prisma.tenantUser.deleteMany({
      where: { tenantId }
    })

    await prisma.inventoryTransaction.deleteMany({
      where: { tenantId }
    })

    await prisma.ingredient.deleteMany({
      where: { tenantId }
    })

    await prisma.media.deleteMany({
      where: { tenantId }
    })

    // Delete the tenant itself
    await prisma.tenant.delete({
      where: { id: tenantId }
    })

    // Delete tenant owner user and their associated data
    if (tenant.owner) {
      const ownerId = tenant.owner.id

      // Delete user-related data
      await prisma.pageDesignRevision.deleteMany({
        where: { createdBy: ownerId }
      })

      await prisma.project.deleteMany({
        where: { userId: ownerId }
      })

      await prisma.pageRevision.deleteMany({
        where: { userId: ownerId }
      })

      await prisma.tenantRegistration.deleteMany({
        where: { userId: ownerId }
      })

      // Finally delete the user
      await prisma.user.delete({
        where: { id: ownerId }
      })
    }

    // Log to a system log (not in tenant activity since tenant is deleted)
    console.log(`[ADMIN] Tenant #${tenantId} (${tenant.name}) permanently deleted by admin - User #${tenant.owner?.id} (${tenant.owner?.email}) also deleted`)

    return NextResponse.json({
      success: true,
      message: `Tenant "${tenant.name}" and owner account have been permanently deleted`
    })
  } catch (error) {
    console.error('Error deleting tenant:', error)
    return NextResponse.json(
      { error: 'Failed to delete tenant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
