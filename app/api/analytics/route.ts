import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const subdomain = searchParams.get('subdomain')
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    // Parse dates
    let startDate: Date
    let endDate: Date

    if (startDateStr) {
      startDate = new Date(startDateStr)
      startDate.setHours(0, 0, 0, 0)
    } else {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
    }

    if (endDateStr) {
      endDate = new Date(endDateStr)
      endDate.setHours(23, 59, 59, 999)
    } else {
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
    }

    // Get previous period for comparison
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff)
    const prevEndDate = new Date(startDate)
    prevEndDate.setHours(23, 59, 59, 999)

    // Resolve tenant
    const tenant = await resolveTenant(session, subdomain || undefined)
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found or unauthorized' },
        { status: 404 }
      )
    }

    // Fetch current period orders
    const orders = await prisma.order.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000
    })

    // Fetch previous period orders for comparison
    const prevOrders = await prisma.order.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      }
    })

    // Calculate current period KPIs
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length

    // Calculate previous period metrics
    const prevTotalOrders = prevOrders.length
    const prevTotalRevenue = prevOrders.reduce((sum, order) => sum + (order.total || 0), 0)

    // Calculate changes
    const revenueChange = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0
    const ordersChange = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0

    // Get unique customers
    const uniqueCustomers = new Set(orders.map(o => o.customerId).filter(id => id !== null))

    // Status breakdown
    const orderStatusBreakdown: Record<string, number> = {}
    orders.forEach(order => {
      const status = order.status || 'unknown'
      orderStatusBreakdown[status] = (orderStatusBreakdown[status] || 0) + 1
    })

    // Top products
    interface ProductData {
      id: number
      name: string
      quantity: number
      revenue: number
    }
    const productMap: Record<number, ProductData> = {}
    
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const productId = item.product.id
        const itemRevenue = item.price * item.quantity
        if (!productMap[productId]) {
          productMap[productId] = {
            id: productId,
            name: item.product.name,
            quantity: 0,
            revenue: 0
          }
        }
        productMap[productId].quantity += item.quantity || 0
        productMap[productId].revenue += itemRevenue
      })
    })

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Daily revenue trend
    const dailyRevenue: Record<string, number> = {}
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + (order.total || 0)
    })

    const revenue = {
      dailyTrend: Object.entries(dailyRevenue)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({
          date,
          revenue: parseFloat(revenue.toFixed(2))
        }))
    }

    // Recent orders (last 10)
    const recentOrders = orders
      .slice(0, 10)
      .map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer?.firstName ? `${order.customer.firstName} ${order.customer.lastName}`.trim() : 'Guest',
        total: order.total || 0,
        status: order.status || 'unknown',
        createdAt: order.createdAt.toISOString()
      }))

    // Response
    const data = {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      kpis: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        revenueChange: parseFloat(revenueChange.toFixed(1)),
        totalOrders,
        ordersChange: parseFloat(ordersChange.toFixed(1)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        completedOrders,
        uniqueCustomers: uniqueCustomers.size
      },
      comparison: {
        prevRevenue: parseFloat(prevTotalRevenue.toFixed(2)),
        prevOrders: prevTotalOrders
      },
      revenue,
      topProducts,
      orderStatusBreakdown,
      recentOrders
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Analytics API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
