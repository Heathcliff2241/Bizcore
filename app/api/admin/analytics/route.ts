import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'month'

    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'month':
      default:
        startDate.setDate(now.getDate() - 30)
        break
    }

    // Fetch metrics
    const [totalTenants, adminUsers, customerUsers, employeeUsers, totalOrders, totalRevenue] =
      await Promise.all([
        prisma.tenant.count({
          where: { isActive: true },
        }),
        prisma.user.count({
          where: { isActive: true, role: 'admin' }, // Only count actual admins, not tenant_owners
        }),
        prisma.customer.count({
          where: { isActive: true },
        }),
        prisma.employee.count({
          where: { isActive: true },
        }),
        prisma.order.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: now,
            },
            paymentStatus: 'paid',
            status: { in: ['completed', 'delivered'] }
          },
        }),
        prisma.order.aggregate({
          where: {
            createdAt: {
              gte: startDate,
              lte: now,
            },
            paymentStatus: 'paid',
            status: { in: ['completed', 'delivered'] }
          },
          _sum: {
            total: true,
          },
        }),
      ])

    // Combine all active users (admin + customers + employees + tenants)
    // NOTE: tenants already includes tenant_owners, so we don't count them separately
    const activeUsers = adminUsers + customerUsers + employeeUsers + totalTenants

    // Mock growth calculations (in production, fetch actual previous period data)
    const revenueGrowth = Math.floor(Math.random() * 40 - 10) // -10% to +30%
    const userGrowth = Math.floor(Math.random() * 30 - 5) // -5% to +25%
    const tenantGrowth = Math.floor(Math.random() * 25 - 3) // -3% to +22%

    const avgOrderValue =
      totalOrders > 0 ? (totalRevenue._sum.total || 0) / totalOrders : 0
    const conversionRate = activeUsers > 0 ? (totalTenants / activeUsers) * 100 : 0

    // Generate revenue trend data from actual orders
    const revenueTrend = await generateRevenueTrend(startDate, now)

    return NextResponse.json({
      period: period.charAt(0).toUpperCase() + period.slice(1),
      revenue: totalRevenue._sum.total || 0,
      users: activeUsers,
      tenants: totalTenants,
      orders: totalOrders,
      avgOrderValue,
      conversionRate,
      growth: {
        revenue: revenueGrowth,
        users: userGrowth,
        tenants: tenantGrowth,
      },
      revenueTrend,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

async function generateRevenueTrend(startDate: Date, endDate: Date) {
  // Fetch all orders in the period grouped by day
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      total: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group orders by date
  const dailyRevenue = new Map<string, number>()
  
  for (const order of orders) {
    const dateKey = order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const current = dailyRevenue.get(dateKey) || 0
    dailyRevenue.set(dateKey, current + (order.total || 0))
  }

  // Generate trend array with all days in range
  const trend = []
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysToShow = Math.min(Math.max(daysDiff, 7), 30)
  
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(endDate)
    date.setDate(date.getDate() - (daysToShow - i - 1))
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    trend.push({
      date: dateKey,
      amount: Math.round(dailyRevenue.get(dateKey) || 0)
    })
  }
  
  return trend
}
