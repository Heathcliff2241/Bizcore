import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'
import { startOfDay, startOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
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
    const now = new Date()
    const todayStart = startOfDay(now)
    const monthStart = startOfMonth(now)

    const todayOrders = await prisma.order.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: todayStart }
      }
    })

    const todayRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: {
        tenantId: tenant.id,
        createdAt: { gte: todayStart },
        paymentStatus: 'paid',
        status: { in: ['completed', 'delivered'] }
      }
    })

    const pendingOrders = await prisma.order.count({
      where: {
        tenantId: tenant.id,
        status: 'pending'
      }
    })

    const monthRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: {
        tenantId: tenant.id,
        createdAt: { gte: monthStart },
        paymentStatus: 'paid',
        status: { in: ['completed', 'delivered'] }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        today_orders: todayOrders,
        today_revenue: todayRevenue._sum.total || 0,
        pending_orders: pendingOrders,
        month_revenue: monthRevenue._sum.total || 0
      }
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch stats' }, { status: 500 })
  }
}
