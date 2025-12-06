/**
 * Payment Proof Implementation Examples
 * Real-world usage examples for the payment proof feature
 */

// ============================================================================
// EXAMPLE 1: React Checkout Component with Payment Proof Upload
// ============================================================================

import React, { useState } from 'react'
import PaymentProofUploader from '@/components/PaymentProofUploader'
import { PaymentProofUploader as PaymentUploader } from '@/lib/paymentProof'

export function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentProof, setPaymentProof] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  const handlePaymentProofChange = (base64Data: string | null) => {
    setPaymentProof(base64Data)
    console.log(`Payment proof ${base64Data ? 'uploaded' : 'cleared'}`)
  }

  const handleSubmitOrder = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const uploader = new PaymentUploader()
      const orderData = {
        customer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        },
        items: [
          { productId: 1, quantity: 2, price: 100 }
        ],
        deliveryType: 'delivery' as const,
        address: '123 Main St, City',
        subtotal: 200,
        paymentMethod: paymentMethod,
        paymentProof: paymentProof || undefined, // Only include if present
        tip: 10,
        discount: 0
      }

      const result = await uploader.submitOrder(orderData)

      if (result.success) {
        setOrderNumber(result.data.orderNumber)
        // Show success message
        alert(`Order placed successfully! Order #${result.data.orderNumber}`)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Order submission failed:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const requiresProof = ['bank_transfer', 'check', 'online_payment'].includes(paymentMethod)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="font-semibold text-lg mb-2">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>$200.00</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (12%):</span>
            <span>$24.00</span>
          </div>
          <div className="flex justify-between">
            <span>Tip:</span>
            <span>$10.00</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-base">
            <span>Total:</span>
            <span>$234.00</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="cash">Cash</option>
          <option value="card">Credit/Debit Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="check">Check</option>
          <option value="online_payment">Online Payment</option>
        </select>
      </div>

      {/* Payment Proof Upload - Only show for methods that require it */}
      {requiresProof && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {paymentMethod === 'check' && 'Upload Check Image'}
            {paymentMethod === 'bank_transfer' && 'Upload Bank Transfer Receipt'}
            {paymentMethod === 'online_payment' && 'Upload Payment Confirmation'}
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Please provide proof of payment to verify your {paymentMethod === 'bank_transfer' ? 'transfer' : 'payment'}
          </p>
          <PaymentProofUploader
            onProofChange={handlePaymentProofChange}
            maxFileSizeMB={5}
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmitOrder}
        disabled={isSubmitting || (requiresProof && !paymentProof)}
        className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
          isSubmitting || (requiresProof && !paymentProof)
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isSubmitting ? 'Processing...' : 'Place Order'}
      </button>

      {/* Order Confirmation */}
      {orderNumber && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">✓ Order Placed Successfully!</h3>
          <p className="text-green-700">
            Your order number is <strong>{orderNumber}</strong>
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// EXAMPLE 2: Direct File Upload with Validation
// ============================================================================

import { fileToBase64, validatePaymentProof } from '@/lib/paymentProof'

export async function handleManualFileUpload(file: File) {
  // Validate the file first
  const validation = validatePaymentProof(file)

  if (!validation.valid) {
    console.error('Validation errors:')
    validation.errors.forEach(error => console.error(`  - ${error}`))
    return null
  }

  if (validation.warnings.length > 0) {
    console.warn('Warnings:')
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  // Convert to base64
  try {
    const base64 = await fileToBase64(file)
    console.log('File converted to base64 successfully')
    console.log(`Size: ${(base64.length / 1024 / 1024).toFixed(2)}MB`)
    return base64
  } catch (error) {
    console.error('Failed to convert file:', error)
    return null
  }
}

// ============================================================================
// EXAMPLE 3: Direct API Call without React Component
// ============================================================================

async function createOrderWithPaymentProof(orderData: any) {
  // First, prepare the image file
  const fileInput = document.getElementById('paymentProofInput') as HTMLInputElement
  const file = fileInput?.files?.[0]

  let paymentProof: string | undefined

  if (file) {
    // Convert file to base64
    const reader = new FileReader()

    paymentProof = await new Promise((resolve) => {
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  // Make API call
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-subdomain': 'avio'
    },
    body: JSON.stringify({
      ...orderData,
      paymentProof // Include if available
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create order')
  }

  return response.json()
}

// Usage
try {
  const order = await createOrderWithPaymentProof({
    customer: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '+1987654321'
    },
    items: [{ productId: 1, quantity: 1, price: 100 }],
    deliveryType: 'takeout',
    subtotal: 100,
    paymentMethod: 'bank_transfer'
  })

  console.log('Order created:', order.data.orderNumber)
} catch (error) {
  console.error('Error:', error)
}

// ============================================================================
// EXAMPLE 4: Advanced - Batch Order Creation with Proofs
// ============================================================================

interface OrderWithFile {
  orderData: any
  proofFile?: File
}

async function createMultipleOrdersWithProofs(orders: OrderWithFile[]) {
  const results = []

  for (const { orderData, proofFile } of orders) {
    try {
      let paymentProof: string | undefined

      if (proofFile) {
        paymentProof = await fileToBase64(proofFile)
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          paymentProof
        })
      })

      const result = await response.json()
      results.push({
        success: response.ok,
        orderNumber: result.data?.orderNumber,
        error: result.message
      })
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return results
}

// ============================================================================
// EXAMPLE 5: Admin Dashboard - View Orders with Proofs
// ============================================================================

interface OrderWithProof {
  id: number
  orderNumber: string
  customerName: string
  paymentMethod: string
  paymentProof?: string
  createdAt: string
}

export function OrdersAdminDashboard() {
  const [orders, setOrders] = useState<OrderWithProof[]>([])
  const [selectedProof, setSelectedProof] = useState<string | null>(null)

  React.useEffect(() => {
    // Fetch orders
    fetch('/api/orders?subdomain=avio')
      .then(r => r.json())
      .then(data => {
        // Filter orders with payment proofs
        const ordersWithProof = data.data.orders.filter(
          (o: any) => o.paymentProof
        )
        setOrders(ordersWithProof)
      })
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders with Payment Proofs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Orders List */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">Orders ({orders.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {orders.map(order => (
              <button
                key={order.id}
                onClick={() => setSelectedProof(order.paymentProof || null)}
                className="w-full text-left p-3 border rounded hover:bg-blue-50 transition"
              >
                <div className="font-medium">{order.orderNumber}</div>
                <div className="text-sm text-gray-600">
                  {order.customerName} • {order.paymentMethod}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Proof Preview */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">Payment Proof Preview</h2>
          {selectedProof ? (
            <div>
              <img
                src={selectedProof}
                alt="Payment proof"
                className="w-full rounded border"
              />
              <a
                href={selectedProof}
                download="payment-proof.png"
                className="mt-3 inline-block text-blue-600 hover:text-blue-700"
              >
                Download
              </a>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Select an order to view payment proof
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EXAMPLE 6: Payment Verification Logic
// ============================================================================

interface PaymentVerificationRequest {
  orderId: number
  approvalStatus: 'verified' | 'rejected'
  notes?: string
}

async function verifyPaymentProof(request: PaymentVerificationRequest) {
  // This would be a new endpoint you could create
  // POST /api/orders/:orderId/verify-proof

  const response = await fetch(`/api/orders/${request.orderId}/verify-proof`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      approvalStatus: request.approvalStatus,
      notes: request.notes,
      verifiedAt: new Date()
    })
  })

  return response.json()
}

// Usage
// await verifyPaymentProof({
//   orderId: 123,
//   approvalStatus: 'verified',
//   notes: 'Transfer confirmed with bank'
// })

// ============================================================================
// EXAMPLE 7: Testing Payment Proof Upload
// ============================================================================

async function testPaymentProofUpload() {
  // Create a test image
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200

  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#3B82F6'
  ctx.fillRect(0, 0, 200, 200)
  ctx.fillStyle = 'white'
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('TEST IMAGE', 100, 100)

  // Convert to blob
  const blob = await new Promise<Blob>(resolve => {
    canvas.toBlob(blob => resolve(blob!))
  })

  const file = new File([blob], 'test-payment.png', { type: 'image/png' })

  // Convert to base64
  const base64 = await fileToBase64(file)

  // Create test order
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+1234567890'
      },
      items: [{ productId: 1, quantity: 1, price: 100 }],
      deliveryType: 'delivery',
      subtotal: 100,
      paymentMethod: 'bank_transfer',
      paymentProof: base64
    })
  })

  const order = await response.json()
  console.log('✅ Test order created:', order.data.orderNumber)
  console.log('✅ Payment proof stored:', !!order.data.paymentProof)
}

// ============================================================================
// Export all examples for use in other modules
// ============================================================================

export {
  handleManualFileUpload,
  createOrderWithPaymentProof,
  createMultipleOrdersWithProofs,
  verifyPaymentProof,
  testPaymentProofUpload
}
