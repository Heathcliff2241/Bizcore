'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'
import { Calendar, CheckCircle, Clock } from 'lucide-react'
import { OrderDetailsModal } from './OrderDetailsModal'

interface Storefront {
  subdomain: string
}

interface OrdersContentProps {
  storefront?: Storefront
  taxRate?: number
}

interface Order {
  id: number
  orderNumber: string
  total: number
  status: string
  paymentStatus: string
  createdAt: string
}

export function OrdersContent({ storefront, taxRate = 12 }: OrdersContentProps): JSX.Element {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [effectiveTaxRate, setEffectiveTaxRate] = useState<number>(taxRate)

  // Extract tax rate from storefront settings if available
  useEffect(() => {
    if (storefront?.settings) {
      const settings = storefront.settings as Record<string, unknown>
      const taxSettings = settings.tax as Record<string, unknown> | undefined
      if (taxSettings && typeof taxSettings.defaultTaxPercent === 'number') {
        setEffectiveTaxRate(taxSettings.defaultTaxPercent)
        console.log('[ORDERS_CONTENT] Using tenant tax rate:', taxSettings.defaultTaxPercent)
      }
    }
  }, [storefront])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('[ORDERS_CONTENT] Starting to fetch orders...')
        const res = await fetch(`/api/customers/orders`)
        console.log('[ORDERS_CONTENT] Response status:', res.status)
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error('[ORDERS_CONTENT] API error response:', errorText)
          throw new Error(`Failed to fetch orders: ${res.status} - ${errorText}`)
        }
        
        const data = await res.json()
        console.log('[ORDERS_CONTENT] Fetched data:', data)
        setOrders(data.orders || [])
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred'
        console.error('[ORDERS_CONTENT] Error:', errorMsg)
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const handleOrderCancelled = async () => {
    console.log('[ORDERS_CONTENT] Order was cancelled, refetching orders...')
    try {
      const res = await fetch(`/api/customers/orders`)
      if (!res.ok) throw new Error('Failed to refetch orders')
      const data = await res.json()
      setOrders(data.orders || [])
      console.log('[ORDERS_CONTENT] Orders refetched successfully')
    } catch (err) {
      console.error('[ORDERS_CONTENT] Error refetching orders:', err)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading orders...</div>
  }

  if (error) {
    return <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4">
          <ShoppingBagIcon className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
        <p className="text-gray-600 mb-6 max-w-sm">
          Start exploring our menu and place your first order to see it here!
        </p>
        {storefront?.subdomain && (
          <Link href={`/storefront/${storefront.subdomain}`}>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95">
              Browse Menu
            </button>
          </Link>
        )}
      </div>
    )
  }

  // Separate active orders from history
  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']
  const historyStatuses = ['completed', 'cancelled', 'refunded']
  
  const activeOrders = orders.filter(order => activeStatuses.includes(order.status))
  const historyOrders = orders.filter(order => historyStatuses.includes(order.status))

  // Render order cards
  const renderOrderCard = (order: Order) => (
    <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-lg font-bold text-gray-900">#{order.orderNumber}</p>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              order.status === 'completed' 
                ? 'bg-emerald-100 text-emerald-700'
                : order.status === 'cancelled'
                ? 'bg-red-100 text-red-700'
                : order.status === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : order.status === 'refunded'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(order.createdAt).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">₱{Number(order.total).toFixed(2)}</p>
          <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${
            order.paymentStatus === 'paid' 
              ? 'text-emerald-600' 
              : 'text-amber-600'
          }`}>
            {order.paymentStatus === 'paid' ? (
              <><CheckCircle className="w-3 h-3" /> Paid</>
            ) : (
              <><Clock className="w-3 h-3" /> Pending</>
            )}
          </p>
        </div>
      </div>
      <Link
        href="#"
        onClick={(e) => {
          e.preventDefault()
          setSelectedOrderId(order.id)
          setModalOpen(true)
        }}
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold group-hover:gap-3 transition-all cursor-pointer"
      >
        View Order Details
        <span>→</span>
      </Link>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Active Orders Section */}
      {activeOrders.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Orders</h3>
            <p className="text-sm text-gray-600 mt-1">Track and manage your current orders</p>
          </div>
          <div className="space-y-4">
            {activeOrders.map(renderOrderCard)}
          </div>
        </div>
      )}

      {/* Order History Section */}
      {historyOrders.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
            <p className="text-sm text-gray-600 mt-1">View your completed and cancelled orders</p>
          </div>
          <div className="space-y-4">
            {historyOrders.map(renderOrderCard)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeOrders.length === 0 && historyOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4">
            <ShoppingBagIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-6 max-w-sm">
            Start exploring our menu and place your first order to see it here!
          </p>
          {storefront?.subdomain && (
            <Link href={`/storefront/${storefront.subdomain}`}>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95">
                Browse Menu
              </button>
            </Link>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedOrderId(null)
          }}
          orderId={selectedOrderId}
          taxRate={effectiveTaxRate}
          onOrderCancelled={handleOrderCancelled}
        />
      )}
    </div>
  )
}
