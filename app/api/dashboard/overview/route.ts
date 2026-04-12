import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { addDays, format, startOfDay, subDays } from 'date-fns'

export const dynamic = 'force-dynamic'

import type { Ingredient } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'

interface TrendSourceRecord {
  createdAt: Date
}

type IngredientSummary = Pick<Ingredient, 'currentStock' | 'minStock' | 'name' | 'unit'>

type RecentOrderRecord = {
  id: number
  orderNumber: string
  status: string
  total: number
  customer: {
    firstName: string | null
    lastName: string | null
  } | null
}

type ProductIngredientLink = {
  quantity: number | null
  ingredient: {
    currentStock: number | null
  } | null
}

type ProductListRecord = {
  id: number
  name: string
  price: number
  productIngredients: ProductIngredientLink[] | null
}

type RevenueAggregate = {
  _sum: {
    total: number | null
  }
}

type IngredientCoverageEntry = {
  name: string | null
  unit: string | null
  current: number
  minimum: number
  ratio: number | null
}

function buildSevenDayTrend(records: TrendSourceRecord[]): number[] {
  const today = new Date()
  const start = startOfDay(subDays(today, 6))
  const dayKeys = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index)
    return format(day, 'yyyy-MM-dd')
  })

  const counter = new Map<string, number>()
  for (const record of records) {
    const key = format(startOfDay(record.createdAt), 'yyyy-MM-dd')
    if (!counter.has(key)) {
      counter.set(key, 0)
    }
    counter.set(key, (counter.get(key) ?? 0) + 1)
  }

  return dayKeys.map((key) => counter.get(key) ?? 0)
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)
  if (!tenant) {
    return NextResponse.json({ success: false, message: 'Tenant not found' }, { status: 404 })
  }

  try {
    const tenantId = tenant.id
    const now = new Date()
    const todayStart = startOfDay(now)
    const sevenDaysAgo = startOfDay(subDays(now, 6))

    // Fetch current subscription to get actual plan (not the deprecated tenant.subscriptionPlan)
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      select: { planId: true }
    });

    const [
      ordersCount,
      productsCount,
      customersCount,
      ingredientRecords,
      productLowStockRecords,
      revenueAggregate,
      todayRevenueAggregate,
      pendingOrdersCount,
      recentOrdersRaw,
      productsListRaw,
      orderTrendSource,
      productTrendSource,
      customerTrendSource,
      inventoryTrendSource
    ] = (await Promise.all([
      prisma.order.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.ingredient.findMany({
        where: { tenantId },
        select: { currentStock: true, minStock: true, name: true, unit: true }
      }),
      prisma.product.findMany({
        where: { tenantId, trackInventory: true },
        select: { currentStock: true, lowStockThreshold: true, name: true }
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { tenantId, paymentStatus: 'paid', status: { in: ['completed', 'delivered'] } }
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { tenantId, createdAt: { gte: todayStart }, paymentStatus: 'paid', status: { in: ['completed', 'delivered'] } }
      }),
      prisma.order.count({
        where: { tenantId, status: 'pending' }
      }),
      prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          customer: {
            select: { firstName: true, lastName: true }
          }
        }
      }),
      prisma.product.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          productIngredients: {
            select: {
              quantity: true,
              ingredient: {
                select: {
                  currentStock: true
                }
              }
            }
          }
        }
      }),
      prisma.order.findMany({
        where: { tenantId, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true }
      }),
      prisma.product.findMany({
        where: { tenantId, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true }
      }),
      prisma.customer.findMany({
        where: { tenantId, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true }
      }),
      prisma.ingredient.findMany({
        where: { tenantId, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true }
      })
    ])) as [
      number,
      number,
      number,
      IngredientSummary[],
      Array<{ currentStock: number | null; lowStockThreshold: number | null; name: string }>,
      RevenueAggregate,
      RevenueAggregate,
      number,
      RecentOrderRecord[],
      ProductListRecord[],
      TrendSourceRecord[],
      TrendSourceRecord[],
      TrendSourceRecord[],
      TrendSourceRecord[]
    ]

    const coverageEntries: IngredientCoverageEntry[] = ingredientRecords.map((ingredient) => {
      const current = Number(ingredient.currentStock ?? 0)
      const minimum = Number(ingredient.minStock ?? 0)
      const ratio = minimum > 0 && Number.isFinite(current) ? Math.max(current / minimum, 0) : null

      return {
        name: ingredient.name,
        unit: ingredient.unit,
        current,
        minimum,
        ratio
      }
    })
    const hasNumericRatio = (
      entry: IngredientCoverageEntry
    ): entry is IngredientCoverageEntry & { ratio: number } => typeof entry.ratio === 'number'

    const validRatios = coverageEntries.filter(hasNumericRatio)
    const averageCoverage = validRatios.length
      ? validRatios.reduce<number>((sum, entry) => sum + entry.ratio, 0) / validRatios.length
      : 0

    const understockCount = validRatios.filter((entry) => entry.ratio <= 1).length
    const worstIngredient = validRatios.reduce<{ name: string | null; ratio: number } | null>((worst, entry) => {
      if (!worst || entry.ratio < worst.ratio) {
        return { name: entry.name ?? null, ratio: entry.ratio }
      }
      return worst
    }, null)

    const inventoryHealthSummary = {
      averageCoverage,
      understockCount,
      worstIngredientName: worstIngredient?.name ?? null,
      worstCoverage: worstIngredient?.ratio ?? null
    }

  const totalInventoryQuantity = ingredientRecords.reduce<number>((total, ingredient) => total + Number(ingredient.currentStock ?? 0), 0)
    
    // Count low stock ingredients
    const lowStockIngredients = ingredientRecords.filter((ingredient) => {
      if (ingredient.minStock === null || ingredient.minStock === undefined) {
        return false
      }
      const current = Number(ingredient.currentStock ?? 0)
      const minimum = Number(ingredient.minStock ?? 0)
      return Number.isFinite(current) && Number.isFinite(minimum) && current <= minimum
    }).length

    // Count low stock products
    const lowStockProducts = productLowStockRecords.filter((product) => {
      if (product.lowStockThreshold === null || product.lowStockThreshold === undefined) {
        return false
      }
      const current = Number(product.currentStock ?? 0)
      const threshold = Number(product.lowStockThreshold ?? 0)
      return Number.isFinite(current) && Number.isFinite(threshold) && current <= threshold
    }).length

    // Total low stock count (ingredients + products)
    const lowStockCount = lowStockIngredients + lowStockProducts

    const recentOrders = recentOrdersRaw.map((order) => ({
      id: order.id,
      order_number: order.orderNumber,
      customer_name: order.customer
        ? [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ') || 'Customer'
        : 'Customer',
      order_status: order.status,
      total_amount: order.total
    }))

    let inventoryFromProducts = 0

    const productsList = productsListRaw.map((product) => {
      const capacityCandidates = Array.isArray(product.productIngredients)
        ? product.productIngredients
            .map((link) => {
              const required = Number(link.quantity ?? 0)
              const available = Number(link.ingredient?.currentStock ?? 0)

              if (!Number.isFinite(required) || required <= 0) {
                return Number.POSITIVE_INFINITY
              }

              if (!Number.isFinite(available) || available < 0) {
                return 0
              }

              return Math.floor(available / required)
            })
            .filter((value) => Number.isFinite(value))
        : []

      const computedStock = capacityCandidates.length
        ? Math.max(Math.min(...capacityCandidates), 0)
        : 0

      inventoryFromProducts += computedStock

      return {
        id: product.id,
        name: product.name,
        current_stock: computedStock,
        price: product.price
      }
    })

    const inventoryTotal = inventoryFromProducts > 0 ? inventoryFromProducts : totalInventoryQuantity

    const payload = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        subscriptionPlan: subscription?.planId || tenant.subscriptionPlan || 'free',
        isActive: tenant.isActive,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        settings: tenant.settings ?? null
      },
      stats: {
        orders: ordersCount,
        products: productsCount,
        inventory: inventoryTotal,
        customers: customersCount,
        revenue: revenueAggregate._sum.total ?? 0,
        todayRevenue: todayRevenueAggregate._sum.total ?? 0,
        lowStock: lowStockCount,
        pendingOrders: pendingOrdersCount,
        activePromos: 0,
        recentOrders,
        productsList,
        ordersTrend: buildSevenDayTrend(orderTrendSource),
        productsTrend: buildSevenDayTrend(productTrendSource),
        inventoryTrend: buildSevenDayTrend(inventoryTrendSource),
        customersTrend: buildSevenDayTrend(customerTrendSource),
        inventoryHealth: inventoryHealthSummary
      }
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    console.error('Failed to fetch dashboard overview:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      tenantId: tenant?.id
    })
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to load dashboard overview',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
