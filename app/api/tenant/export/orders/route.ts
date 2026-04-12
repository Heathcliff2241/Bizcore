import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tenant/export/orders?subdomain=xxx
 * Export all orders for a tenant as CSV
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
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: {
      tenantId: number
      status?: string
      OR?: Array<{ orderNumber?: { contains: string; mode: 'insensitive' } }>
      createdAt?: { gte?: Date; lte?: Date }
    } = {
      tenantId: tenant.id,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [{ orderNumber: { contains: search, mode: 'insensitive' } }]
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Fetch all orders (no pagination for export)
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format data for export
    const exportData = orders.map((order) => {
      const itemsList = order.items
        .map((item) => `${item.product?.name || 'Unknown'} (x${item.quantity})`)
        .join('; ')

      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

      return {
        order_number: order.orderNumber,
        status: order.status,
        customer_name: order.customer?.name || 'Guest',
        customer_email: order.customer?.email || 'N/A',
        customer_phone: order.customer?.phone || 'N/A',
        subtotal: order.subtotal,
        tax: order.tax,
        discount: order.discount || 0,
        shipping: order.shipping || 0,
        total: order.total,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        total_items: totalItems,
        items: itemsList,
        notes: order.notes || 'N/A',
        created_at: order.createdAt.toISOString(),
        updated_at: order.updatedAt.toISOString(),
      }
    })

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Export orders error:', error)
    return NextResponse.json({ error: 'Failed to export orders' }, { status: 500 })
  }
}


