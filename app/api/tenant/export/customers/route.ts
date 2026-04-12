import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tenant/export/customers?subdomain=xxx
 * Export all customers for a tenant as CSV
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 })
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get optional filters
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: {
      tenantId: number
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
      }>
    } = {
      tenantId: tenant.id,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch all customers (no pagination for export)
    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
        orders: {
          select: {
            total: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format data for export
    const exportData = customers.map((customer) => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
      const avgOrderValue = customer.orders.length > 0 ? totalSpent / customer.orders.length : 0

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || 'N/A',
        address: customer.address || 'N/A',
        city: customer.city || 'N/A',
        state: customer.state || 'N/A',
        zip_code: customer.zipCode || 'N/A',
        country: customer.country || 'N/A',
        total_orders: customer._count.orders,
        total_spent: totalSpent.toFixed(2),
        average_order_value: avgOrderValue.toFixed(2),
        notes: customer.notes || 'N/A',
        created_at: customer.createdAt.toISOString(),
        updated_at: customer.updatedAt.toISOString(),
      }
    })

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Export customers error:', error)
    return NextResponse.json({ error: 'Failed to export customers' }, { status: 500 })
  }
}


