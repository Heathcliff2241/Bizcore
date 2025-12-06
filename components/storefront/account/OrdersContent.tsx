'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'

interface Storefront {
  subdomain: string
}

interface OrdersContentProps {
  storefront?: Storefront
}

interface Order {
  id: number
  orderNumber: string
  total: number
  status: string
  paymentStatus: string
  createdAt: string
}

export function OrdersContent({ storefront }: OrdersContentProps): JSX.Element {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/customers/orders`)
        if (!res.ok) throw new Error('Failed to fetch orders')
        const data = await res.json()
        setOrders(data.orders || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading orders...</div>
  }

  if (error) {
    return <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingBagIcon className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-500">You have no orders yet.</p>
        <p className="text-sm text-slate-400">Start shopping to see your orders here!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className="font-semibold text-slate-900">Order #{order.orderNumber}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  order.status === 'completed' 
                    ? 'bg-green-100 text-green-700'
                    : order.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">₱{Number(order.total).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">{order.paymentStatus}</p>
            </div>
          </div>
          <Link
            href={`/storefront/${storefront?.subdomain}/account/orders/${order.id}`}
            className="mt-3 inline-flex text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            View Details →
          </Link>
        </div>
      ))}
    </div>
  )
}
