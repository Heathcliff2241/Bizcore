'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface OrderItem {
  id: number
  productId: string
  quantity: number
  price: number
  product?: {
    id: string
    name: string
    image?: string
  }
}

interface Order {
  id: number
  orderNumber: string
  total: number
  status: string
  paymentStatus: string
  tax: number
  createdAt: string
  orderItems: OrderItem[]
  paymentProof?: string | null
}

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: number
  taxRate: number
  onOrderCancelled?: () => void
}

export function OrderDetailsModal({ isOpen, onClose, orderId, taxRate, onOrderCancelled }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const fetchOrder = async () => {
      setLoading(true)
      setError(null)
      setCancelSuccess(false)
      try {
        const res = await fetch(`/api/customers/orders/${orderId}`)
        if (!res.ok) throw new Error('Failed to fetch order details')
        const data = await res.json()
        setOrder(data.order)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [isOpen, orderId])

  const handleCancelOrder = async () => {
    if (!order || !window.confirm('Are you sure you want to cancel this order?')) return

    setCancelling(true)
    setError(null)
    try {
      const res = await fetch(`/api/customers/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to cancel order')
      }

      await res.json()
      setCancelSuccess(true)
      setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null)
      
      // Notify parent to refetch orders
      if (onOrderCancelled) {
        onOrderCancelled()
      }
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setCancelSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while cancelling')
    } finally {
      setCancelling(false)
    }
  }

  const isCancellable = order && ['pending', 'confirmed', 'preparing'].includes(order.status)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {order ? `Order #${order.orderNumber}` : 'Order Details'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading order details...</div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {order && (
                <div className="space-y-6">
                  {/* Status and Date */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                        order.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : order.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : order.status === 'processing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Items Ordered</h3>
                    <div className="space-y-3">
                      {order.orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{item.product?.name || 'Product'}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            ₱{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-900">
                        ₱{order.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Tax ({taxRate}%)</span>
                      <span className="font-semibold text-gray-900">₱{order.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">₱{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <p className={`text-lg font-semibold mt-1 ${
                      order.paymentStatus === 'paid'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}>
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </p>
                  </div>

                  {/* Cancel Status Message */}
                  {cancelSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-emerald-700 font-semibold">✓ Order cancelled successfully</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              {isCancellable && !cancelSuccess && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-6 py-2.5 bg-red-50 text-red-600 font-semibold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
              <button
                onClick={onClose}
                disabled={cancelling}
                className="px-6 py-2.5 text-gray-700 font-semibold hover:bg-gray-100 disabled:opacity-50 rounded-lg transition-colors"
              >
                {cancelSuccess ? 'Close' : 'Close'}
              </button>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
