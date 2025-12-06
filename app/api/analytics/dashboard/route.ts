import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('[Analytics API] Unauthorized - no session')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const subdomain = searchParams.get('subdomain')
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const statuses = searchParams.getAll('statuses')

    // Parse dates
    let startDate: Date
    let endDate: Date

    if (startDateStr) {
      startDate = new Date(startDateStr)
      // Set to start of day
      startDate.setHours(0, 0, 0, 0)
    } else {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
    }

    if (endDateStr) {
      endDate = new Date(endDateStr)
      // Set to end of day
      endDate.setHours(23, 59, 59, 999)
    } else {
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
    }

    console.log('[Analytics API] Request params:', {
      subdomain,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      statuses
    })

    // Resolve tenant
    const tenant = await resolveTenant(session, subdomain)
    if (!tenant) {
      console.log('[Analytics API] Tenant not found:', subdomain)
      return NextResponse.json(
        { success: false, error: 'Tenant not found or unauthorized' },
        { status: 404 }
      )
    }

    console.log('[Analytics API] Tenant resolved:', { tenantId: tenant.id, subdomain: tenant.subdomain })

    // Build where clause
    const whereClause = {
      tenantId: tenant.id,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    // Apply status filter if provided
    const orderWhereClause = {
      ...whereClause,
      ...(statuses.length > 0 && { status: { in: statuses } })
    }

    // Fetch orders with all relationships
    console.log('[Analytics API] Fetching orders...')
    const orders = await prisma.order.findMany({
      where: orderWhereClause,
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
                productIngredients: {
                  include: {
                    ingredient: true
                  }
                }
              }
            }
          }
        },
        customer: true
      }
    })

    console.log('[Analytics API] Orders fetched:', { count: orders.length })

    // Calculate KPIs
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const totalTax = orders.reduce((sum, order) => sum + (order.tax || 0), 0)
    const amountPaid = orders.reduce((sum, order) => sum + (order.amountPaid || 0), 0)
    const outstandingAmount = totalRevenue - amountPaid
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    console.log('[Analytics API] KPIs calculated:', {
      totalOrders,
      totalRevenue,
      averageOrderValue
    })

    // Status breakdown
    const statusBreakdown: Record<string, number> = {}
    orders.forEach(order => {
      const status = order.status || 'unknown'
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1
    })

    // Payment status breakdown
    const paymentBreakdown: Record<string, number> = {}
    orders.forEach(order => {
      const status = order.paymentStatus || 'unpaid'
      paymentBreakdown[status] = (paymentBreakdown[status] || 0) + 1
    })

    // Top products analysis
    interface ProductSalesData {
      id: number
      name: string
      image: string | null
      quantity: number
      revenue: number
      orders: Set<number>
    }
    const productSales: Record<number, ProductSalesData> = {}
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const productId = item.product.id
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            name: item.product.name,
            image: item.product.image || null,
            quantity: 0,
            revenue: 0,
            orders: new Set<number>()
          }
        }
        productSales[productId].quantity += item.quantity
        productSales[productId].revenue += item.price * item.quantity
        productSales[productId].orders.add(item.orderId)
      })
    })

    const topProducts = Object.values(productSales)
      .map(p => ({
        ...p,
        orders: p.orders.size
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(p => ({
        ...p,
        percent: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0
      }))

    console.log('[Analytics API] Top products:', { count: topProducts.length })

    // Category sales
    interface CategorySalesData {
      id: number | string | null
      name: string
      quantity: number
      revenue: number
    }
    const categorySales: Record<string, CategorySalesData> = {}
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const categoryId = item.product.categoryId || 'uncategorized'
        const categoryName = item.product.category?.name || 'Uncategorized'
        const key = categoryId.toString()

        if (!categorySales[key]) {
          categorySales[key] = {
            id: categoryId === 'uncategorized' ? null : categoryId,
            name: categoryName,
            quantity: 0,
            revenue: 0
          }
        }
        categorySales[key].quantity += item.quantity
        categorySales[key].revenue += item.price * item.quantity
      })
    })

    const categoryData = Object.values(categorySales).sort((a, b) => b.revenue - a.revenue)
      .map(c => ({
        ...c,
        percent: totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0
      }))

    // Daily revenue trend
    interface DailyRevenueData {
      date: string
      orders: number
      revenue: number
      transactions: number
    }
    const dailyRevenue: Record<string, DailyRevenueData> = {}
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      if (!dailyRevenue[dateKey]) {
        dailyRevenue[dateKey] = {
          date: dateKey,
          orders: 0,
          revenue: 0,
          transactions: 0
        }
      }
      dailyRevenue[dateKey].orders += 1
      dailyRevenue[dateKey].revenue += order.total || 0
      if (order.paymentStatus === 'paid') {
        dailyRevenue[dateKey].transactions += 1
      }
    })

    const revenueTrend = Object.values(dailyRevenue)
      .sort((a, b) => a.date.localeCompare(b.date))

    console.log('[Analytics API] Revenue trend:', { days: revenueTrend.length })

    // Inventory analytics
    console.log('[Analytics API] Fetching inventory...')
    const inventory = await prisma.ingredient.findMany({
      where: { tenantId: tenant.id }
    })

    const totalInventoryValue = inventory.reduce(
      (sum, item) => sum + ((item.costPerUnit || 0) * (item.currentStock || 0)),
      0
    )

    const lowStockItems = inventory
      .filter(item => item.currentStock < (item.minStock || 5))
      .map(item => ({
        id: item.id,
        name: item.name,
        currentStock: item.currentStock,
        minStock: item.minStock,
        unit: item.unit
      }))

    const outOfStockItems = inventory
      .filter(item => item.currentStock <= 0)
      .map(item => ({
        id: item.id,
        name: item.name,
        unit: item.unit
      }))

    // Fetch all products for catalog total (unfiltered)
    console.log('[Analytics API] Fetching product count...')
    const allProducts = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, isActive: true }
    })

    const catalogTotalProducts = allProducts.length
    const outOfStockCount = outOfStockItems.length
    const lowStockCount = lowStockItems.length

    console.log('[Analytics API] Inventory stats:', {
      totalInventoryValue,
      lowStockCount,
      outOfStockCount
    })

    // Compute product-level inventory status (based on productIngredients included in orders)
    const productInventoryStatus: Record<number, { isOutOfStock: boolean; isLowStock: boolean }> = {}
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const product = item.product
        if (!product) return
        if (productInventoryStatus[product.id]) return

        const ingList = product.productIngredients || []
        let isOut = false
        let isLow = false
        ingList.forEach(pi => {
          const ingredient = pi.ingredient
          if (!ingredient) return
          if ((ingredient.currentStock || 0) <= 0) {
            isOut = true
          }
          if ((ingredient.currentStock || 0) < (ingredient.minStock || 5)) {
            isLow = true
          }
        })
        productInventoryStatus[product.id] = { isOutOfStock: isOut, isLowStock: isLow }
      })
    })

    // Product IDs present in filtered orders
    const filteredProductIds = Object.keys(productSales).map(k => Number(k))
    const outOfStockProductsFiltered = filteredProductIds
      .filter(id => productInventoryStatus[id]?.isOutOfStock)
      .map(id => {
        // Attempt to find the product metadata in the aggregated productSales
        const p = productSales[id]
        return p ? { id: p.id, name: p.name } : { id }
      })
    const lowStockProductsFiltered = filteredProductIds
      .filter(id => productInventoryStatus[id]?.isLowStock)
      .map(id => {
        const p = productSales[id]
        return p ? { id: p.id, name: p.name } : { id }
      })

    // Build response
    const analyticsData = {
      success: true,
      data: {
        kpis: {
          totalOrders,
          totalRevenue,
          totalTax,
          amountPaid,
          averageOrderValue,
          outstandingAmount,
          inventoryValue: totalInventoryValue,
          // Keep kpi totalProducts for catalog-wide product count
          totalProducts: catalogTotalProducts,
          outOfStockCount,
          lowStockCount
        },
        orders: {
          statusBreakdown,
          paymentBreakdown,
          total: totalOrders,
          list: orders.slice(0, 50).map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            paymentStatus: o.paymentStatus,
            total: o.total,
            tax: o.tax,
            amountPaid: o.amountPaid,
            createdAt: o.createdAt,
            itemCount: o.orderItems.length
          }))
        },
        products: {
          // Catalog total (unfiltered)
          catalogTotal: catalogTotalProducts,
          // Filtered totals & breakdowns computed from orders
          total: Object.keys(productSales).length,
          topProducts,
          categoryData,
          // Inventory lists (ingredient-level) are catalog-level by nature
          outOfStock: outOfStockItems,
          lowStock: lowStockItems,
          // Product-level stock status derived from products in filtered orders
          outOfStockFiltered: outOfStockProductsFiltered,
          lowStockFiltered: lowStockProductsFiltered
        },
        inventory: {
          items: inventory.map(item => ({
            id: item.id,
            name: item.name,
            currentStock: item.currentStock,
            minStock: item.minStock,
            unit: item.unit,
            costPerUnit: item.costPerUnit || 0,
            value: ((item.costPerUnit || 0) * (item.currentStock || 0))
          })),
          lowStockItems,
          totalValue: totalInventoryValue,
          totalItems: inventory.length
        },
        revenue: {
          dailyTrend: revenueTrend,
          totalRevenue,
          averagePerOrder: averageOrderValue
        }
      }
    }

    console.log('[Analytics API] Response prepared successfully')
    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('[Analytics API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
