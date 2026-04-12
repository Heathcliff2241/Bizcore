import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/admin/export/tenants
 * Export all tenants as CSV
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[EXPORT TENANTS] Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email
    })
    
    if (!session?.user?.id) {
      console.error('[EXPORT TENANTS] No user ID in session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin') {
      console.error('[EXPORT TENANTS] User role is not admin:', session.user.role)
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
    }
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const plan = searchParams.get('plan') || ''
    const status = searchParams.get('status') || ''

    // Build where clause
    const where: {
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; subdomain?: { contains: string; mode: 'insensitive' } }>
      subscriptionPlan?: string
      isActive?: boolean
    } = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (plan && plan !== 'all') {
      where.subscriptionPlan = plan
    }

    if (status && status !== 'all') {
      where.isActive = status === 'active'
    }

    // Fetch all tenants (no pagination for export)
    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            tenantUsers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate revenue for each tenant
    const tenantsWithRevenue = await Promise.all(
      tenants.map(async (tenant) => {
        const orders = await prisma.order.aggregate({
          where: {
            tenantId: tenant.id,
          },
          _sum: {
            total: true,
          },
        })

        const ownerName = tenant.owner
          ? `${tenant.owner.firstName} ${tenant.owner.lastName}`.trim()
          : 'N/A'

        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          plan: tenant.subscriptionPlan,
          status: tenant.isActive ? 'Active' : 'Inactive',
          owner_name: ownerName,
          owner_email: tenant.owner?.email || 'N/A',
          users_count: tenant._count.tenantUsers,
          revenue: orders._sum.total || 0,
          industry: tenant.industry || 'N/A',
          contact_email: tenant.contactEmail || 'N/A',
          contact_phone: tenant.contactPhone || 'N/A',
          created_at: tenant.createdAt.toISOString(),
          updated_at: tenant.updatedAt.toISOString(),
        }
      })
    )

    return NextResponse.json(tenantsWithRevenue)
  } catch (error) {
    console.error('[EXPORT TENANTS] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to export tenants',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

