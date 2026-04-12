'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDownIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

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
  createdAt: Date | string
  orderItems: OrderItem[]
}

interface OrdersTabContentProps {
  orders: Order[]
  taxRate: number
  subdomain: string
}

export function OrdersTabContent({ orders, taxRate, subdomain }: OrdersTabContentProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)

  const toggleOrderExpanded = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
        <p className="text-gray-600 mb-6 max-w-sm">
          You haven&apos;t placed any orders yet. Start exploring our products and make your first purchase!
        </p>
        <Link
          href={`/storefront/${subdomain}/products`}
          className="inline-flex px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
        <p className="text-sm text-gray-500 mt-1">View and track your purchases</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Order Header */}
            <button
              onClick={() => toggleOrderExpanded(order.id)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-lg font-semibold text-gray-900">₱{order.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{order.paymentStatus}</p>
                </div>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedOrderId === order.id ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Order Details - Expandable */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: expandedOrderId === order.id ? 'auto' : 0,
                opacity: expandedOrderId === order.id ? 1 : 0
              }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-200 px-6 py-6 bg-gray-50">
                {/* Items List */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Items</h4>
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

                {/* Order Summary */}
                <div className="space-y-3 pt-4">
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
                  <div className="flex justify-between items-center text-base font-bold border-t border-gray-300 pt-3">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">₱{order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Mobile Total (shown when expanded) */}
                <div className="mt-6 pt-6 border-t border-gray-200 sm:hidden">
                  <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₱{order.total.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const baseClasses = 'inline-flex px-3 py-1 rounded-full text-xs font-semibold'
  
  const statusStyles: Record<string, string> = {
    pending: `${baseClasses} bg-yellow-100 text-yellow-800`,
    processing: `${baseClasses} bg-blue-100 text-blue-800`,
    completed: `${baseClasses} bg-green-100 text-green-800`,
    shipped: `${baseClasses} bg-purple-100 text-purple-800`,
    delivered: `${baseClasses} bg-green-100 text-green-800`,
    cancelled: `${baseClasses} bg-red-100 text-red-800`,
    refunded: `${baseClasses} bg-orange-100 text-orange-800`,
  }

  return <span className={statusStyles[status] || statusStyles.pending}>{status}</span>
}
