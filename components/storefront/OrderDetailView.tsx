"use client"

import Image from 'next/image'
import { CheckCircle, Package, Truck, Clock, XCircle, MapPin, CreditCard, User, Mail, Phone } from 'lucide-react'
import type { StorefrontContext } from './types'

interface DeliveryAddress {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface OrderItem {
  id: number
  quantity: number
  unitPrice: number
  product: {
    id: number
    name: string
    image?: string | null
  }
}

interface Order {
  id: number
  status: string
  total: number
  subtotal?: number | null
  tax?: number | null
  discount?: number | null
  tip?: number | null
  deliveryFee?: number | null
  paymentMethod?: string | null
  deliveryType?: string | null
  deliveryAddress?: DeliveryAddress | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  createdAt: Date
  items: OrderItem[]
}

interface OrderDetailViewProps {
  order: Order
  storefront: StorefrontContext
}

export function OrderDetailView({ order, storefront }: OrderDetailViewProps) {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'processing':
      case 'preparing':
        return <Package className="w-6 h-6 text-blue-600" />
      case 'in_transit':
      case 'out_for_delivery':
        return <Truck className="w-6 h-6 text-indigo-600" />
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-600" />
      default:
        return <Clock className="w-6 h-6 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'processing':
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_transit':
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-4">Thank you for your order. We&apos;ve received it and will start processing soon.</p>
          <div className="inline-flex items-center gap-2 text-lg">
            <span className="text-gray-600">Order Number:</span>
            <span className="font-bold text-gray-900">#{order.id}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status</h2>
              <div className={`flex items-center gap-3 p-4 rounded-lg border ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <div>
                  <div className="font-semibold">{formatStatus(order.status)}</div>
                  <div className="text-sm opacity-80">Placed on {formatDate(order.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">
                        ₱{Number(item.unitPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ₱{(Number(item.unitPrice) * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery/Pickup Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'} Information
              </h2>
              
              {order.deliveryType === 'delivery' && order.deliveryAddress ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Delivery Address</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {order.deliveryAddress.line1}<br />
                        {order.deliveryAddress.line2 && <>{order.deliveryAddress.line2}<br /></>}
                        {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}<br />
                        {order.deliveryAddress.country || 'Philippines'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Pickup Location</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {storefront.name}<br />
                      Please visit our store to pickup your order
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                {order.subtotal !== null && order.subtotal !== undefined && (
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₱{Number(order.subtotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {order.tax !== null && order.tax !== undefined && order.tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>₱{Number(order.tax).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {order.deliveryFee !== null && order.deliveryFee !== undefined && order.deliveryFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>₱{Number(order.deliveryFee).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {order.discount !== null && order.discount !== undefined && order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₱{Number(order.discount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {order.tip !== null && order.tip !== undefined && order.tip > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tip</span>
                    <span>₱{Number(order.tip).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>₱{Number(order.total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">
                  {order.paymentMethod ? order.paymentMethod.toUpperCase() : 'Cash'}
                </span>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-3">
                {order.customerName && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Name</div>
                      <div className="font-medium text-gray-900">{order.customerName}</div>
                    </div>
                  </div>
                )}
                {order.customerEmail && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium text-gray-900">{order.customerEmail}</div>
                    </div>
                  </div>
                )}
                {order.customerPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium text-gray-900">{order.customerPhone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-800">
                If you have any questions about your order, please contact our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
          >
            Print Order
          </button>
          <a
            href={`/storefront/${storefront.subdomain}/account/orders`}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
          >
            View All Orders
          </a>
        </div>
      </div>
    </div>
  )
}
