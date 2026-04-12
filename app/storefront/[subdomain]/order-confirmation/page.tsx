'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { OrderReceipt } from '@/components/storefront/OrderReceipt'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  createdAt: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: Array<{
    product: {
      name: string
    }
    quantity: number
    price: number
  }>
  subtotal: number
  tax: number
  discount: number
  total: number
  orderType: 'pickup' | 'delivery'
  deliveryAddress?: string
  paymentMethod: string
}

interface StorefrontContext {
  name: string
  subdomain: string
}

export default function OrderConfirmationPage({
  params: _params
}: {
  params: Promise<{ subdomain: string }>
}) {
  void _params // Unused but required by Next.js
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [storefront, setStorefront] = useState<StorefrontContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    const loadData = async () => {
      if (!orderId) {
        setError('No order ID provided')
        setLoading(false)
        return
      }

      try {
        // Get subdomain from params (this is a client component, so we need to get it differently)
        // For now, we can extract from window location or use the searchParams
        const subdomain = window.location.pathname.split('/')[2]

        // Fetch order details
        const orderResponse = await fetch(`/api/orders/${orderId}?subdomain=${subdomain}`)
        if (!orderResponse.ok) {
          throw new Error('Failed to fetch order')
        }
        const orderData = await orderResponse.json()
        setOrder(orderData)

        // Fetch storefront info
        const storefrontResponse = await fetch(`/api/tenant/${subdomain}`)
        if (storefrontResponse.ok) {
          const storefrontData = await storefrontResponse.json()
          setStorefront(storefrontData.tenant)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your receipt...</p>
        </div>
      </div>
    )
  }

  if (error || !order || !storefront) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Receipt</h1>
          <p className="text-gray-600 mb-6">{error || 'Order not found'}</p>
          <Link
            href={`/storefront/${window.location.pathname.split('/')[2]}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Store
          </Link>
        </div>
      </div>
    )
  }

  const parsedAddress = order.deliveryAddress 
    ? (typeof order.deliveryAddress === 'string' ? JSON.parse(order.deliveryAddress) : order.deliveryAddress)
    : null

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <OrderReceipt
        orderNumber={order.orderNumber}
        orderDate={new Date(order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
        customerName={order.customerName}
        customerEmail={order.customerEmail}
        customerPhone={order.customerPhone}
        items={order.items.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          itemPrice: item.price * item.quantity
        }))}
        subtotal={order.subtotal}
        tax={order.tax}
        discount={order.discount}
        total={order.total}
        deliveryType={order.orderType}
        deliveryAddress={parsedAddress}
        paymentMethod={order.paymentMethod}
        storeName={storefront.name}
      />

      {/* Continue Shopping Button */}
      <div className="text-center mt-8">
        <Link
          href={`/storefront/${storefront.subdomain}`}
          className="inline-block px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
