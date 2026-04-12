import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tenant/stats/today?subdomain=xxx
 * Get today's statistics for a tenant
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

    // Get today's date range (start of day to now)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const now = new Date()

    // Get yesterday's date range for comparison
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const endOfYesterday = new Date(today)
    endOfYesterday.setMilliseconds(-1)

    // Today's orders count
    const todayOrders = await prisma.order.count({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: today,
          lte: now,
        },
      },
    })

    // Yesterday's orders count for comparison
    const yesterdayOrders = await prisma.order.count({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: yesterday,
          lte: endOfYesterday,
        },
      },
    })

    // Today's revenue (only paid and completed orders)
    const todayRevenueResult = await prisma.order.aggregate({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: today,
          lte: now,
        },
        paymentStatus: 'paid',
        status: { in: ['completed', 'delivered'] }
      },
      _sum: {
        total: true,
      },
    })

    // Yesterday's revenue for comparison (only paid and completed orders)
    const yesterdayRevenueResult = await prisma.order.aggregate({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: yesterday,
          lte: endOfYesterday,
        },
        paymentStatus: 'paid',
        status: { in: ['completed', 'delivered'] }
      },
      _sum: {
        total: true,
      },
    })

    // Pending orders count
    const pendingOrders = await prisma.order.count({
      where: {
        tenantId: tenant.id,
        status: 'pending',
      },
    })

    // New customers today
    const newCustomers = await prisma.customer.count({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: today,
          lte: now,
        },
      },
    })

    return NextResponse.json({
      todayOrders,
      todayRevenue: todayRevenueResult._sum.total || 0,
      pendingOrders,
      newCustomers,
      yesterdayOrders,
      yesterdayRevenue: yesterdayRevenueResult._sum.total || 0,
    })
  } catch (error) {
    console.error('Get tenant today stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch today stats' }, { status: 500 })
  }
}


