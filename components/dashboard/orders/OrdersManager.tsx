'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { useSettings } from '@/lib/settings-context'
import { exportFromAPI } from '@/lib/csv-export'
import { useRecentItems } from '@/hooks/useRecentItems'

interface OrderItem {
  id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_email: string | null
  customer_phone?: string | null
  delivery_address?: string | null
  delivery_city?: string | null
  delivery_state?: string | null
  delivery_postal_code?: string | null
  created_at: string
  total_amount: number
  subtotal_amount?: number
  tax_amount?: number
  delivery_fee?: number
  order_status: string
  payment_status?: string
  payment_method?: string
  amount_paid?: number
  order_type?: string
  paymentProof?: string
  employee_name?: string | null
  employee_email?: string | null
  employee_role?: string | null
  OrderItems?: OrderItem[]
}

interface Stats {
  today_orders: number
  today_revenue: number
  pending_orders: number
  month_revenue: number
}

interface OrdersManagerProps {
  subdomain?: string
}

const statusColors = {
  pending: { bg: '#FEF3C7', text: '#92400E', icon: ClockIcon },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF', icon: CheckCircleIcon },
  preparing: { bg: '#E0E7FF', text: '#3730A3', icon: ClockIcon },
  ready: { bg: '#D1FAE5', text: '#065F46', icon: CheckCircleIcon },
  out_for_delivery: { bg: '#FCE7F3', text: '#831843', icon: TruckIcon },
  delivered: { bg: '#D1FAE5', text: '#065F46', icon: CheckCircleIcon },
  completed: { bg: '#E5E7EB', text: '#1F2937', icon: CheckCircleIcon },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', icon: XCircleIcon },
  refunded: { bg: '#FEE2E2', text: '#991B1B', icon: XCircleIcon }
} as const

const paymentColors = {
  unpaid: { bg: '#FEE2E2', text: '#991B1B', label: 'Unpaid' },
  partial: { bg: '#FEF3C7', text: '#92400E', label: 'Partial' },
  paid: { bg: '#D1FAE5', text: '#065F46', label: 'Paid' },
  refunded: { bg: '#F3E8FF', text: '#6B21A8', label: 'Refunded' }
} as const

type OrderStatus = keyof typeof statusColors

type StatusFilter = OrderStatus | 'all'

const defaultStats: Stats = {
  today_orders: 0,
  today_revenue: 0,
  pending_orders: 0,
  month_revenue: 0
}

function formatCurrency(amount: number | null | undefined) {
  const value = typeof amount === 'number' ? amount : Number(amount ?? 0)
  return `₱${value.toFixed(2)}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function OrdersManager({ subdomain }: OrdersManagerProps) {
  useSession({ required: true })
  const { settings } = useSettings()
  const theme = {
    primary: settings.brandColors.primary,
    secondary: settings.brandColors.secondary,
    accent: settings.brandColors.accent,
    background: settings.brandColors.background,
    surface: settings.brandColors.surface,
    text: settings.brandColors.text
  }

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [stats, setStats] = useState<Stats>(defaultStats)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)

  // Recent items tracking
  const { addRecentItem } = useRecentItems(subdomain)

  const querySuffix = useMemo(
    () => (subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : ''),
    [subdomain]
  )

  const ordersEndpoint = useMemo(() => `/api/orders${querySuffix}`, [querySuffix])
  const statsEndpoint = useMemo(() => `/api/orders/stats/dashboard${querySuffix}`, [querySuffix])
  const orderEndpoint = useCallback(
    (id: number) => `/api/orders/${id}${querySuffix}`,
    [querySuffix]
  )

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(ordersEndpoint)

      if (!response.ok) {
        throw new Error('Failed to load orders')
      }

      const payload = await response.json()
      const data: Order[] = payload?.data?.orders ?? []
      setOrders(data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }, [ordersEndpoint])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(statsEndpoint)

      if (!response.ok) {
        throw new Error('Failed to load stats')
      }

      const payload = await response.json()
      const data = payload?.data as Stats | undefined

      if (data) {
        setStats({
          today_orders: Number(data.today_orders ?? 0),
          today_revenue: Number(data.today_revenue ?? 0),
          pending_orders: Number(data.pending_orders ?? 0),
          month_revenue: Number(data.month_revenue ?? 0)
        })
      }
    } catch (error) {
      console.error('Failed to fetch order stats:', error)
    }
  }, [statsEndpoint])

  useEffect(() => {
    void fetchOrders()
    void fetchStats()
  }, [fetchOrders, fetchStats])

  const updateOrderStatus = useCallback(
    async (orderId: number, newStatus: OrderStatus) => {
      try {
        setUpdatingStatus(orderId)

        const response = await fetch(orderEndpoint(orderId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_status: newStatus })
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to update order status' }))
          throw new Error(error.error || 'Failed to update order status')
        }

        const payload = await response.json()
        const updated: Order | undefined = payload?.data?.order

        await Promise.all([fetchOrders(), fetchStats()])

        if (updated) {
          setSelectedOrder((previous) => (previous?.id === orderId ? updated : previous))
        }
      } catch (error) {
        console.error('Failed to update order status:', error)
        alert(error instanceof Error ? error.message : 'Failed to update order status')
      } finally {
        setUpdatingStatus(null)
      }
    },
    [fetchOrders, fetchStats, orderEndpoint]
  )

  const viewOrder = useCallback(
    async (orderId: number) => {
      try {
        const response = await fetch(orderEndpoint(orderId))

        if (!response.ok) {
          throw new Error('Failed to load order details')
        }

        const payload = await response.json()
        const data: Order | undefined = payload?.data?.order

        if (data) {
          setSelectedOrder(data)
          
          // Track as recent item
          addRecentItem({
            id: data.id,
            type: 'order',
            title: data.order_number,
            subtitle: data.customer_name,
            url: subdomain ? `/dashboard/${subdomain}/orders` : '/orders',
          })
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error)
        alert(error instanceof Error ? error.message : 'Failed to fetch order details')
      }
    },
    [orderEndpoint, addRecentItem, subdomain]
  )

  const updatePaymentStatus = useCallback(
    async (orderId: number, newPaymentStatus: string, amountPaid?: number) => {
      try {
        setUpdatingStatus(orderId)

        const body: Record<string, unknown> = { payment_status: newPaymentStatus }
        if (amountPaid !== undefined) {
          body.amount_paid = amountPaid
        }

        const response = await fetch(orderEndpoint(orderId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to update payment' }))
          throw new Error(error.error || 'Failed to update payment status')
        }

        const payload = await response.json()
        const updated: Order | undefined = payload?.data?.order

        await Promise.all([fetchOrders(), fetchStats()])

        if (updated) {
          setSelectedOrder((previous) => (previous?.id === orderId ? updated : previous))
        }
      } catch (error) {
        console.error('Failed to update payment:', error)
        alert(error instanceof Error ? error.message : 'Failed to update payment')
      } finally {
        setUpdatingStatus(null)
      }
    },
    [fetchOrders, fetchStats, orderEndpoint]
  )

  const handleExportCSV = useCallback(async () => {
    if (!subdomain) {
      alert('Subdomain is required for export')
      return
    }

    setExporting(true)
    try {
      const params = new URLSearchParams({
        subdomain,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      })

      const result = await exportFromAPI(
        `/api/tenant/export/orders?${params}`,
        `orders_export_${subdomain}_${new Date().toISOString().split('T')[0]}`
      )

      if (!result.success) {
        alert(result.error || 'Failed to export orders')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export orders')
    } finally {
      setExporting(false)
    }
  }, [subdomain, statusFilter, searchTerm])

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    if (!term && statusFilter === 'all') {
      return orders
    }

    return orders.filter((order) => {
      const matchesSearch = term
        ? order.order_number?.toLowerCase().includes(term) ||
          order.customer_name?.toLowerCase().includes(term) ||
          order.customer_email?.toLowerCase().includes(term)
        : true

      const matchesStatus = statusFilter === 'all' ? true : order.order_status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, searchTerm, statusFilter])

  const statusOptions: OrderStatus[] = useMemo(
    () => [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled',
      'refunded'
    ],
    []
  )

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex-1 p-8" 
      style={{ backgroundColor: theme.background || '#f9fafb' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 
            className="text-3xl font-bold tracking-tight"
            style={{ color: theme.text || '#111827' }}
          >
            {subdomain ? `${subdomain} Orders` : 'Orders'}
          </h2>
          <p 
            className="mt-2 text-sm"
            style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
          >
            Manage and track customer orders for {subdomain || 'your store'}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting || filteredOrders.length === 0}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          style={{
            borderColor: `${theme.primary}40`,
            color: theme.primary,
            backgroundColor: 'white',
          }}
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="p-6 bg-white border rounded-2xl shadow-sm backdrop-blur-xl"
          style={{ 
            background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary}08)`,
            borderColor: `${theme.primary}20`,
            boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                Today&apos;s Orders
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: theme.text || '#111827' }}>
                {stats.today_orders}
              </p>
            </div>
            <div 
              className="p-4 rounded-xl transition-transform duration-200"
              style={{ backgroundColor: `${theme.primary}15` }}
            >
              <ClockIcon className="w-7 h-7" style={{ color: theme.primary }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="p-6 bg-white border rounded-2xl shadow-sm backdrop-blur-xl"
          style={{ 
            background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary}08)`,
            borderColor: `${theme.primary}20`,
            boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                Today&apos;s Revenue
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: theme.primary }}>
                {formatCurrency(stats.today_revenue)}
              </p>
            </div>
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${theme.primary}15` }}
            >
              <span className="text-2xl font-bold" style={{ color: theme.primary }}>₱</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="p-6 bg-white border rounded-2xl shadow-sm backdrop-blur-xl"
          style={{ 
            background: `linear-gradient(135deg, ${theme.secondary}08, ${theme.accent}08)`,
            borderColor: `${theme.secondary}20`,
            boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.secondary}10`
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                Pending Orders
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: theme.secondary }}>
                {stats.pending_orders}
              </p>
            </div>
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${theme.secondary}15` }}
            >
              <ClockIcon className="w-7 h-7" style={{ color: theme.secondary }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="p-6 bg-white border rounded-2xl shadow-sm backdrop-blur-xl"
          style={{ 
            background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary}08)`,
            borderColor: `${theme.primary}20`,
            boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                Month Revenue
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: theme.secondary }}>
                {formatCurrency(stats.month_revenue)}
              </p>
            </div>
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${theme.secondary}15` }}
            >
              <span className="text-2xl font-bold" style={{ color: theme.secondary }}>₱</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <div className="relative">
          <MagnifyingGlassIcon 
            className="absolute w-5 h-5 top-3.5 left-4 transition-colors duration-200" 
            style={{ color: theme.text ? `${theme.text}60` : '#9ca3af' }} 
          />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full py-3 pl-12 pr-4 border rounded-xl focus:outline-none transition-all duration-200 font-medium"
            style={{ 
              borderColor: `${theme.primary}25`,
              color: theme.text || '#111827',
              backgroundColor: 'white',
              boxShadow: `0 1px 2px rgba(0,0,0,0.04)`
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.primary
              e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.primary}15, 0 1px 2px rgba(0,0,0,0.04)`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = `${theme.primary}25`
              e.currentTarget.style.boxShadow = `0 1px 2px rgba(0,0,0,0.04)`
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as OrderStatus | 'all')}
          className="w-full py-3 px-4 border rounded-xl focus:outline-none transition-all duration-200 font-medium"
          style={{ 
            borderColor: `${theme.primary}25`,
            color: theme.text || '#111827',
            backgroundColor: 'white',
            boxShadow: `0 1px 2px rgba(0,0,0,0.04)`
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.primary
            e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.primary}15, 0 1px 2px rgba(0,0,0,0.04)`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = `${theme.primary}25`
            e.currentTarget.style.boxShadow = `0 1px 2px rgba(0,0,0,0.04)`
          }}
        >
          <option value="all">All Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
            </option>
          ))}
        </select>
      </motion.div>

      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div 
            className="w-12 h-12 border-4 rounded-full animate-spin mb-4"
            style={{ 
              borderTopColor: 'transparent',
              borderRightColor: `${theme.primary}30`,
              borderBottomColor: `${theme.primary}30`,
              borderLeftColor: `${theme.primary}30`
            }}
          />
          <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
            Loading orders...
          </p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white border rounded-2xl shadow-sm overflow-hidden backdrop-blur-xl"
          style={{ 
            background: `linear-gradient(135deg, ${theme.primary}05, ${theme.secondary}05)`,
            borderColor: `${theme.primary}20`,
            boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead 
                className="border-b" 
                style={{ 
                  backgroundColor: `${theme.primary}08`, 
                  borderColor: `${theme.primary}20` 
                }}
              >
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}80` : '#6b7280' }}>
                        No orders found. Adjust your filters or try another search.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, index) => {
                    const statusConfig = statusColors[order.order_status as OrderStatus] ?? statusColors.pending
                    const StatusIcon = statusConfig.icon

                    return (
                      <motion.tr 
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="transition-all duration-200"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${theme.primary}08`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold" style={{ color: theme.text || '#111827' }}>
                            {order.order_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium" style={{ color: theme.text || '#111827' }}>
                            {order.customer_name || 'Guest'}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: theme.text ? `${theme.text}80` : '#6b7280' }}>
                            {order.customer_email ?? '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold" style={{ color: theme.primary }}>
                            {formatCurrency(order.total_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200"
                            style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {order.order_status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.payment_status && (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ 
                                backgroundColor: paymentColors[order.payment_status as keyof typeof paymentColors]?.bg || '#F3F4F6',
                                color: paymentColors[order.payment_status as keyof typeof paymentColors]?.text || '#6b7280'
                              }}
                            >
                              {paymentColors[order.payment_status as keyof typeof paymentColors]?.label || order.payment_status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => viewOrder(order.id)}
                            className="font-semibold flex items-center gap-1.5 transition-all duration-200 px-3 py-1.5 rounded-lg"
                            style={{ 
                              color: theme.primary,
                              backgroundColor: `${theme.primary}10`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${theme.primary}20`
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = `${theme.primary}10`
                            }}
                          >
                            <EyeIcon className="w-4 h-4" />
                            View
                          </motion.button>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl p-6 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Order {selectedOrder.order_number}</h3>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 text-gray-900">{selectedOrder.customer_name || 'Guest'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 text-gray-900">{selectedOrder.customer_email ?? '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2 text-gray-900">{selectedOrder.customer_phone ?? '—'}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.employee_name && (
                <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-2">Employee Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.employee_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.employee_email ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <span className="ml-2 capitalize text-gray-900">{selectedOrder.employee_role ?? '—'}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.delivery_address && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Address</h4>
                  <p className="text-sm text-gray-700">{selectedOrder.delivery_address}</p>
                  <p className="text-sm text-gray-700">
                    {selectedOrder.delivery_city}, {selectedOrder.delivery_state} {selectedOrder.delivery_postal_code}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.OrderItems?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(item.unit_price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">{formatCurrency(selectedOrder.subtotal_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-900">{formatCurrency(selectedOrder.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="text-gray-900">{formatCurrency(selectedOrder.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-semibold text-green-600 text-lg">{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-4">Payment Information</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Status:</span>
                    <span
                      className="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ 
                        backgroundColor: paymentColors[selectedOrder.payment_status as keyof typeof paymentColors]?.bg || '#F3F4F6',
                        color: paymentColors[selectedOrder.payment_status as keyof typeof paymentColors]?.text || '#6b7280'
                      }}
                    >
                      {paymentColors[selectedOrder.payment_status as keyof typeof paymentColors]?.label || selectedOrder.payment_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="text-gray-900 capitalize">{selectedOrder.payment_method || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="text-gray-900 font-semibold">{formatCurrency(selectedOrder.amount_paid)}</span>
                  </div>
                  {selectedOrder.payment_status === 'paid' && (
                    <p className="text-xs text-gray-600 italic mt-2">ℹ️ Amount automatically set to order total when marked as paid. Resets to ₱0 if refunded.</p>
                  )}
                </div>
              </div>

              {selectedOrder.paymentProof && (
                <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Payment Proof</h4>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 capitalize">Method: {selectedOrder.payment_method}</p>
                    <img
                      src={selectedOrder.paymentProof}
                      alt="Payment proof"
                      className="w-full max-h-96 object-contain rounded-lg border border-amber-200 bg-white"
                    />
                    <a
                      href={selectedOrder.paymentProof}
                      download={`${selectedOrder.order_number}-payment-proof.png`}
                      className="inline-flex items-center px-3 py-2 bg-amber-100 text-amber-900 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
                    >
                      📥 Download Proof
                    </a>
                  </div>
                </div>
              )}

              {!selectedOrder.paymentProof && ['gcash', 'maya'].includes(selectedOrder.payment_method || '') && (
                <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3">
                    <span className="text-red-600 text-xl">⚠️</span>
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Missing Payment Proof</h4>
                      <p className="text-sm text-red-800">This {selectedOrder.payment_method} payment has no proof of payment uploaded. Please follow up with the customer if needed.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Update Payment Status</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(paymentColors).map(([key, value]) => {
                    const isActive = selectedOrder.payment_status === key

                    return (
                      <button
                        key={key}
                        onClick={() => updatePaymentStatus(selectedOrder.id, key)}
                        disabled={isActive || updatingStatus === selectedOrder.id}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: isActive ? value.bg : '#F3F4F6',
                          color: isActive ? value.text : '#374151'
                        }}
                      >
                        {value.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Update Order Status</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {statusOptions.map((status) => {
                    const statusConfig = statusColors[status]
                    const isActive = selectedOrder.order_status === status

                    return (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                        disabled={isActive || updatingStatus === selectedOrder.id}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: isActive ? statusConfig.bg : '#F3F4F6',
                          color: isActive ? statusConfig.text : '#374151'
                        }}
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-600 italic mt-3">ℹ️ Inventory deducted when status changed to: Ready, Completed, Out for Delivery, or Delivered. No deduction for Cancelled.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
