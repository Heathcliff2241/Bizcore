import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/stats/today
 * Get today's system-wide statistics for admin
 */
export async function GET(request: NextRequest) {
  try {
    // Get today's date range (start of day to now)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const now = new Date()

    // Get yesterday's date range for comparison
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const endOfYesterday = new Date(today)
    endOfYesterday.setMilliseconds(-1)

    // Today's orders count (system-wide)
    const todayOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: today,
          lte: now,
        },
      },
    })

    // Yesterday's orders count for comparison
    const yesterdayOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: yesterday,
          lte: endOfYesterday,
        },
      },
    })

    // Today's revenue (system-wide, only paid and completed orders)
    const todayRevenueResult = await prisma.order.aggregate({
      where: {
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

    // New tenants today
    const newCustomers = await prisma.tenant.count({
      where: {
        createdAt: {
          gte: today,
          lte: now,
        },
      },
    })

    // Active tenants requiring attention (no orders in last 7 days but active)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const activeTenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    // Count tenants with no recent orders
    const pendingOrdersCount = await Promise.all(
      activeTenants.map(async (tenant) => {
        const recentOrders = await prisma.order.count({
          where: {
            tenantId: tenant.id,
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        })
        return recentOrders === 0 ? 1 : 0
      })
    )

    const pendingOrders = pendingOrdersCount.reduce((sum, val) => sum + val, 0)

    return NextResponse.json({
      todayOrders,
      todayRevenue: todayRevenueResult._sum.total || 0,
      pendingOrders, // For admin: tenants needing attention
      newCustomers, // For admin: new tenants today
      yesterdayOrders,
      yesterdayRevenue: yesterdayRevenueResult._sum.total || 0,
    })
  } catch (error) {
    console.error('Get admin today stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch today stats' }, { status: 500 })
  }
}


