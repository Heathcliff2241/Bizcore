'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

import { useTheme } from '../theme-context'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip, Legend)

type ThemeColors = {
  primary: string
  secondary: string
  accent?: string
  background?: string
  surface?: string
  text?: string
}

type BrandColorSettings = {
  brandColors?: Partial<ThemeColors>
}

interface TenantInfo {
  id: number
  name: string
  subdomain: string
  subscriptionPlan?: string
  isActive: boolean
  primaryColor?: string
  secondaryColor?: string
  settings?: Record<string, unknown>
}

interface Order {
  id: number
  order_number: string
  customer_name: string
  order_status: string
  total_amount: number
}

interface Product {
  id: string
  name: string
  current_stock: number
  price: number
}

interface InventoryHealth {
  averageCoverage: number
  understockCount: number
  worstIngredientName: string | null
  worstCoverage: number | null
}

interface Summary {
  orders: number
  products: number
  inventory: number
  customers: number
  revenue: number
  todayRevenue: number
  lowStock: number
  pendingOrders: number
  activePromos: number
  recentOrders: Order[]
  productsList: Product[]
  ordersTrend: number[]
  productsTrend: number[]
  inventoryTrend: number[]
  customersTrend: number[]
  inventoryHealth: InventoryHealth
}

const defaultInventoryHealth: InventoryHealth = {
  averageCoverage: 0,
  understockCount: 0,
  worstIngredientName: null,
  worstCoverage: null
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2
})

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return currencyFormatter.format(0)
  }
  return currencyFormatter.format(value)
}

const isFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const formatMultiplier = (value: number) => {
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded}`.replace(/\.0$/, '')
}

const formatCoverageHeadline = (ratio: number | null) => {
  if (!isFiniteNumber(ratio)) {
    return '—'
  }
  if (ratio <= 0) {
    return '0%'
  }
  return `${Math.round(Math.max(ratio, 0) * 100)}%`
}

const formatCoverageDetail = (ratio: number | null) => {
  if (!isFiniteNumber(ratio)) {
    return 'No data available'
  }
  if (ratio <= 0) {
    return 'No stock on hand'
  }
  if (ratio < 1) {
    return `${Math.round(ratio * 100)}% of minimum stock`
  }
  return `${formatMultiplier(ratio)}× minimum stock`
}

const describeCoverageStatus = (ratio: number | null) => {
  if (!isFiniteNumber(ratio)) {
    return 'No data'
  }
  if (ratio <= 0) {
    return 'Out of stock'
  }
  if (ratio < 0.75) {
    return 'Critical'
  }
  if (ratio < 1) {
    return 'Below minimum'
  }
  if (ratio < 1.25) {
    return 'At target'
  }
  if (ratio < 2.5) {
    return 'Comfortable'
  }
  return 'Plenty in stock'
}

const formatCoverageFull = (ratio: number | null) => {
  if (!isFiniteNumber(ratio)) {
    return 'No data available'
  }
  if (ratio <= 0) {
    return 'No stock on hand'
  }
  const headline = formatCoverageHeadline(ratio)
  if (ratio < 1) {
    return `${headline} of minimum stock`
  }
  return `${formatCoverageDetail(ratio)} (${headline})`
}

const SummaryTile = ({
  title,
  value,
  subtitle,
  trendData,
  theme
}: {
  title: string
  value: number | string
  subtitle?: string
  trendData?: number[]
  theme: ThemeColors
}) => {
  const chartData = {
    labels: trendData?.map((_, index) => `Day ${index + 1}`) ?? [],
    datasets: [
      {
        data: trendData ?? [],
        borderColor: theme.secondary,
        backgroundColor: `${theme.secondary}20`,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="p-6 border rounded-2xl shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${theme.primary}12, ${theme.secondary}08)`,
        borderColor: `${theme.primary}20`
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: theme.text ?? '#6b7280' }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}70` : '#9ca3af' }}>
            {subtitle}
          </p>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold" style={{ color: theme.text ?? '#111827' }}>
        {value}
      </p>
      {trendData && trendData.length > 0 && (
        <div className="mt-4 h-16">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </motion.div>
  )
}

const fallbackTheme: ThemeColors = {
  primary: '#0ea5e9',
  secondary: '#06b6d4',
  accent: '#38bdf8',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827'
}

const InventoryHealthCard = ({
  health,
  theme
}: {
  health: InventoryHealth
  theme: ThemeColors
}) => {
  const coverageHeadline = formatCoverageHeadline(health.averageCoverage)
  const coverageDetail = formatCoverageDetail(health.averageCoverage)
  const hasWorstData = isFiniteNumber(health.worstCoverage)
  const worstIngredientLabel = hasWorstData
    ? health.worstIngredientName ?? 'Ingredient'
    : 'No ingredient data'
  const worstStatus = describeCoverageStatus(health.worstCoverage)
  const worstInfoLine = hasWorstData
    ? `${worstStatus} · ${formatCoverageFull(health.worstCoverage)}`
    : 'Add ingredient minimums to track coverage'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 border rounded-2xl shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${theme.primary}10, ${theme.secondary}10)`,
        borderColor: `${theme.primary}20`
      }}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold" style={{ color: theme.text ?? '#6b7280' }}>
          Inventory Coverage
        </p>
        {hasWorstData && (
          <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ background: `${theme.primary}14`, color: theme.text ?? '#0f172a' }}>
            {worstStatus}
          </span>
        )}
      </div>
      <p className="mt-1 text-4xl font-bold" style={{ color: theme.text ?? '#111827' }}>
        {coverageHeadline}
      </p>
      <p className="text-xs tracking-wide" style={{ color: theme.text ? `${theme.text}70` : '#9ca3af' }}>
        {coverageDetail}
      </p>
      <div className="mt-4 space-y-1 text-sm" style={{ color: theme.text ?? '#374151' }}>
        <p>
          Understock items: <span className="font-semibold">{health.understockCount}</span>
        </p>
        <div>
          <p>
            Closest to minimum: <span className="font-semibold">{worstIngredientLabel}</span>
          </p>
          <p className="text-xs" style={{ color: theme.text ? `${theme.text}80` : '#6b7280' }}>
            {worstInfoLine}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

const OrdersTable = ({ data, theme }: { data: Order[]; theme: ThemeColors }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="p-6 border rounded-2xl shadow-xl"
    style={{
      background: theme.surface ?? '#ffffff',
      borderColor: `${theme.primary}15`
    }}
  >
    <h3 className="mb-4 text-lg font-semibold" style={{ color: theme.text ?? '#111827' }}>
      Recent Orders
    </h3>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left" style={{ color: theme.text ?? '#374151' }}>
        <thead>
          <tr className="border-b" style={{ borderColor: `${theme.primary}15` }}>
            <th className="py-3 font-medium">Order ID</th>
            <th className="py-3 font-medium">Customer</th>
            <th className="py-3 font-medium">Status</th>
            <th className="py-3 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((order, index) => (
            <motion.tr
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="border-b"
              style={{ borderColor: `${theme.primary}10` }}
            >
              <td className="py-3">{order.order_number}</td>
              <td className="py-3">{order.customer_name}</td>
              <td className="py-3 capitalize">{order.order_status}</td>
              <td className="py-3">{formatCurrency(order.total_amount)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
)

const ProductsTable = ({ data, theme }: { data: Product[]; theme: ThemeColors }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.2 }}
    className="p-6 border rounded-2xl shadow-xl"
    style={{
      background: theme.surface ?? '#ffffff',
      borderColor: `${theme.secondary}10`
    }}
  >
    <h3 className="mb-4 text-lg font-semibold" style={{ color: theme.text ?? '#111827' }}>
      Recent Products
    </h3>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left" style={{ color: theme.text ?? '#374151' }}>
        <thead>
          <tr className="border-b" style={{ borderColor: `${theme.secondary}15` }}>
            <th className="py-3 font-medium">Product</th>
            <th className="py-3 font-medium">Stock</th>
            <th className="py-3 font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {data.map((product, index) => (
            <motion.tr
              key={product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="border-b"
              style={{ borderColor: `${theme.secondary}10` }}
            >
              <td className="py-3">{product.name}</td>
              <td className="py-3">{product.current_stock}</td>
              <td className="py-3">{formatCurrency(product.price)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
)

export default function TenantDashboardPage() {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
  const [summary, setSummary] = useState<Summary>({
    orders: 0,
    products: 0,
    inventory: 0,
    customers: 0,
    revenue: 0,
    todayRevenue: 0,
    lowStock: 0,
    pendingOrders: 0,
    activePromos: 0,
    recentOrders: [],
    productsList: [],
    ordersTrend: [],
    productsTrend: [],
    inventoryTrend: [],
    customersTrend: [],
    inventoryHealth: defaultInventoryHealth
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const params = useParams<{ subdomain?: string | string[] }>()
  const { theme, setTheme } = useTheme()

  const subdomain = useMemo(() => {
    const raw = params?.subdomain
    return Array.isArray(raw) ? raw[0] : raw ?? ''
  }, [params])

  useEffect(() => {
    let isActive = true

    const fetchOverview = async () => {
      setLoading(true)
      setError(null)

      try {
        const query = subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : ''
        const response = await fetch(`/api/dashboard/overview${query}`, {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload = await response.json()

        if (!payload?.success) {
          throw new Error(payload?.message || 'Failed to load dashboard overview')
        }

        if (!isActive) {
          return
        }

        const { tenant, stats } = payload.data

        setTenantInfo({
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          subscriptionPlan: tenant.subscriptionPlan,
          isActive: tenant.isActive,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          settings: tenant.settings ?? null
        })

        const inventoryHealthPayload = stats.inventoryHealth
          ? {
              averageCoverage:
                typeof stats.inventoryHealth.averageCoverage === 'number'
                  ? stats.inventoryHealth.averageCoverage
                  : 0,
              understockCount:
                typeof stats.inventoryHealth.understockCount === 'number'
                  ? stats.inventoryHealth.understockCount
                  : 0,
              worstIngredientName:
                typeof stats.inventoryHealth.worstIngredientName === 'string'
                  ? stats.inventoryHealth.worstIngredientName
                  : null,
              worstCoverage:
                typeof stats.inventoryHealth.worstCoverage === 'number'
                  ? stats.inventoryHealth.worstCoverage
                  : null
            }
          : defaultInventoryHealth

        setSummary({
          orders: stats.orders ?? 0,
          products: stats.products ?? 0,
          inventory: stats.inventory ?? 0,
          customers: stats.customers ?? 0,
          revenue: stats.revenue ?? 0,
          todayRevenue: stats.todayRevenue ?? 0,
          lowStock: stats.lowStock ?? 0,
          pendingOrders: stats.pendingOrders ?? 0,
          activePromos: stats.activePromos ?? 0,
          recentOrders: Array.isArray(stats.recentOrders) ? stats.recentOrders : [],
          productsList: Array.isArray(stats.productsList) ? stats.productsList : [],
          ordersTrend: Array.isArray(stats.ordersTrend) ? stats.ordersTrend : [],
          productsTrend: Array.isArray(stats.productsTrend) ? stats.productsTrend : [],
          inventoryTrend: Array.isArray(stats.inventoryTrend) ? stats.inventoryTrend : [],
          customersTrend: Array.isArray(stats.customersTrend) ? stats.customersTrend : [],
          inventoryHealth: inventoryHealthPayload
        })

        try {
          const nextTenantValue = {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            subscriptionPlan: tenant.subscriptionPlan,
            isActive: tenant.isActive,
            primaryColor: tenant.primaryColor,
            secondaryColor: tenant.secondaryColor,
            settings: tenant.settings ?? null
          }
          localStorage.setItem('tenant', JSON.stringify(nextTenantValue))
        } catch (storageError) {
          console.error('Failed to persist tenant data in localStorage:', storageError)
        }

        const tenantSettings = tenant.settings ?? {}
        const brandColors =
          tenantSettings && typeof tenantSettings === 'object' && 'brandColors' in tenantSettings
            ? (tenantSettings as BrandColorSettings).brandColors
            : undefined

        const updatedTheme: ThemeColors = {
          primary: brandColors?.primary ?? tenant.primaryColor ?? fallbackTheme.primary,
          secondary: brandColors?.secondary ?? tenant.secondaryColor ?? fallbackTheme.secondary,
          accent: brandColors?.accent ?? fallbackTheme.accent,
          background: brandColors?.background ?? fallbackTheme.background,
          surface: brandColors?.surface ?? fallbackTheme.surface,
          text: brandColors?.text ?? fallbackTheme.text
        }

        setTheme(updatedTheme)
      } catch (fetchError) {
        console.error('Dashboard overview error:', fetchError)
        if (isActive) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unexpected error')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    fetchOverview()

    return () => {
      isActive = false
    }
  }, [setTheme, subdomain])

  // Show error state if loading failed
  if (error && !tenantInfo) {
    return (
      <main className="flex items-center justify-center min-h-screen" style={{ backgroundColor: theme.background ?? '#f3f4f6' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 border border-red-100 rounded-2xl shadow-sm bg-white"
        >
          <h2 className="text-xl font-semibold text-red-600">Unable to load dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </motion.div>
      </main>
    )
  }

  // Render immediately with skeleton UI while loading in background
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex-1 p-8"
      style={{ backgroundColor: theme.background ?? '#f9fafb' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-2 mb-6"
      >
        <div className={loading ? 'h-9 w-64 rounded-lg bg-gray-200 animate-pulse' : ''}>
          {!loading && (
            <h2 className="text-3xl font-semibold" style={{ color: theme.text ?? '#111827' }}>
              {tenantInfo ? `Welcome back, ${tenantInfo.name}` : 'Dashboard Overview'}
            </h2>
          )}
        </div>
        <div className={loading ? 'h-4 w-40 rounded bg-gray-200 animate-pulse' : ''}>
          {!loading && (
            <p className="text-sm" style={{ color: theme.text ? `${theme.text}80` : '#6b7280' }}>
              Subdomain: {tenantInfo?.subdomain || 'Global'}
            </p>
          )}
        </div>
        {!loading && tenantInfo && (
          <p className="text-sm text-[13px]" style={{ color: theme.text ? `${theme.text}70` : '#9ca3af' }}>
            Plan: {tenantInfo.subscriptionPlan ?? 'N/A'}  Customers: {summary.customers}
          </p>
        )}
      </motion.div>

      {/* 🚨 CRITICAL: Low-Stock Alerts Banner */}
      {!loading && summary.lowStock > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 p-4 border-l-4 rounded-lg shadow-sm"
          style={{
            backgroundColor: '#fef2f2',
            borderColor: '#ef4444'
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-1 text-lg font-bold flex-shrink-0"
              style={{ color: '#dc2626' }}
            >
              ⚠️
            </div>
            <div className="flex-1">
              <h3 className="font-semibold" style={{ color: '#7f1d1d' }}>
                Low Stock Alert
              </h3>
              <p className="mt-1 text-sm" style={{ color: '#991b1b' }}>
                {summary.lowStock} ingredient{summary.lowStock !== 1 ? 's are' : ' is'} running low on stock. 
                Please check your inventory management dashboard to reorder.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {loading ? (
          <>
            <div className="h-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-32 rounded-lg bg-gray-200 animate-pulse" />
          </>
        ) : (
          <>
            <SummaryTile title="Orders" value={summary.orders} trendData={summary.ordersTrend} theme={theme} />
            <SummaryTile title="Products" value={summary.products} trendData={summary.productsTrend} theme={theme} />
            <SummaryTile title="Inventory" value={summary.inventory} trendData={summary.inventoryTrend} theme={theme} />
            <SummaryTile title="Customers" value={summary.customers} trendData={summary.customersTrend} theme={theme} />
            <SummaryTile
              title="Revenue"
              value={formatCurrency(summary.todayRevenue)}
              subtitle={`Month: ${formatCurrency(summary.revenue)}`}
              theme={theme}
            />
            <InventoryHealthCard health={summary.inventoryHealth} theme={theme} />
            <SummaryTile title="Low Stock Items" value={summary.lowStock} theme={theme} />
            <SummaryTile title="Pending Orders" value={summary.pendingOrders} theme={theme} />
            <SummaryTile title="Active Promotions" value={summary.activePromos} theme={theme} />
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {loading ? (
          <>
            <div className="h-96 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-96 rounded-lg bg-gray-200 animate-pulse" />
          </>
        ) : (
          <>
            <OrdersTable data={summary.recentOrders} theme={theme} />
            <ProductsTable data={summary.productsList} theme={theme} />
          </>
        )}
      </motion.div>
    </motion.main>
  )
}
