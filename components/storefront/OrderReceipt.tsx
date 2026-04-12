'use client'

import { useRef } from 'react'
import html2pdf from 'html2pdf.js'
import { CheckCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface OrderItem {
  productName: string
  quantity: number
  price: number
  itemPrice: number
}

interface ReceiptProps {
  orderNumber: string
  orderDate: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  deliveryType: 'pickup' | 'delivery'
  deliveryAddress?: {
    street: string
    city: string
    state: string
    zip: string
  }
  paymentMethod: string
  storeName: string
}

export function OrderReceipt({
  orderNumber,
  orderDate,
  customerName,
  customerEmail,
  customerPhone,
  items,
  subtotal,
  tax,
  discount,
  total,
  deliveryType,
  deliveryAddress,
  paymentMethod,
  storeName
}: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const handleDownload = () => {
    if (!receiptRef.current) return

    const options = {
      margin: 10,
      filename: `receipt-${orderNumber}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' as const }
    }

    html2pdf().set(options).from(receiptRef.current).save()
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Success Message */}
      <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center">
        <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600">Thank you for your order. We&apos;re preparing it now.</p>
      </div>

      {/* Receipt */}
      <div
        ref={receiptRef}
        className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        style={{ printColorAdjust: 'exact' }}
      >
        {/* Receipt Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{storeName}</h2>
          <p className="text-gray-600 mb-4">Order Receipt</p>
          <div className="inline-block bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-mono font-semibold">
            Order #{orderNumber}
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Order Date</h3>
            <p className="text-gray-900 font-medium">{orderDate}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Delivery Type</h3>
            <p className="text-gray-900 font-medium capitalize">{deliveryType}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Billed To</h3>
          <p className="text-gray-900 font-medium">{customerName}</p>
          <p className="text-gray-600">{customerEmail}</p>
          {customerPhone && <p className="text-gray-600">{customerPhone}</p>}

          {deliveryAddress && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Delivery Address</h4>
              <p className="text-gray-900">{deliveryAddress.street}</p>
              <p className="text-gray-900">
                {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zip}
              </p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Items Ordered</h3>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div>
                  <p className="text-gray-900 font-medium">{item.productName}</p>
                  <p className="text-gray-600">Qty: {item.quantity} × ₱{item.price.toFixed(2)}</p>
                </div>
                <p className="text-gray-900 font-semibold">₱{item.itemPrice.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-3 mb-8 pb-6 border-b border-gray-200">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>₱{tax.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-₱{discount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total Amount</span>
            <span className="text-3xl font-bold text-blue-600">₱{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Payment Method</h3>
          <p className="text-gray-900 font-medium capitalize">{paymentMethod}</p>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Thank you for your purchase!</p>
          <p className="text-xs text-gray-500">Please save this receipt for your records</p>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          Download Receipt as PDF
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
        >
          🖨️ Print Receipt
        </button>
      </div>
    </div>
  )
}
