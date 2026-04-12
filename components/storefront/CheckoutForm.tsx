"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from './hooks/useCart'
import { useCustomerSession } from './hooks/useCustomerSession'
import Link from 'next/link'
import type { StorefrontContext } from './types'

interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface CheckoutFormProps {
  storefront: StorefrontContext
}

export function CheckoutForm({ storefront }: CheckoutFormProps) {
  const { data: session } = useCustomerSession()
  const { cart, clearCart } = useCart(storefront.subdomain, session?.user?.id)
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup')
  const [address, setAddress] = useState<Address>({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'PH'
  })
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'gcash' | 'maya'>('cash')
  const [paymentProof, setPaymentProof] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showCartModal, setShowCartModal] = useState(true)

  useEffect(() => {
    setMounted(true)
    console.log('CheckoutForm mounted - Current cart:', cart)
  }, [cart])

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session])

  const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
  const tax = subtotal * 0.12 // 12% VAT
  const deliveryFee = deliveryType === 'delivery' ? 50 : 0
  const total = subtotal + tax + deliveryFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    // Validate cart items have valid product IDs
    const invalidItems = cart.filter(item => !item.id || isNaN(Number(item.id)))
    if (invalidItems.length > 0) {
      console.error('Invalid cart items:', invalidItems)
      setError('Some items in your cart are invalid. Please refresh and try again.')
      return
    }

    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }

    if (deliveryType === 'delivery') {
      if (!address.line1.trim()) {
        setError('Please enter your street address')
        return
      }
      if (!address.city.trim()) {
        setError('Please enter your city')
        return
      }
      if (!address.state.trim()) {
        setError('Please enter your state/province')
        return
      }
      if (!address.postalCode.trim()) {
        setError('Please enter your postal code')
        return
      }
    }

    // Validate payment proof for GCash and Maya
    if (['gcash', 'maya'].includes(paymentMethod) && !paymentProof) {
      setError('Please upload your payment proof for this payment method')
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        customer: {
          id: session?.user?.id ? Number(session.user.id) : undefined,
          name: name,
          email: email,
          phone: phone || undefined
        },
        deliveryType,
        address: deliveryType === 'delivery' ? address : undefined,
        items: cart.map(item => ({
          productId: Number(item.id),
          quantity: item.quantity || 1,
          price: item.price
        })).filter(item => !isNaN(item.productId) && item.productId > 0),
        subtotal,
        tax,
        discount: 0,
        tip: 0,
        deliveryFee,
        total,
        paymentMethod,
        paymentProof: paymentProof || undefined
      }

      console.log('Sending order data:', {
        ...orderData,
        paymentProof: paymentProof ? `base64(${paymentProof.length} bytes)` : undefined
      })

      const response = await fetch(`/api/orders?subdomain=${storefront.subdomain}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-subdomain': storefront.subdomain
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create order')
      }

      // Response received successfully, clear cart and redirect
      clearCart()
      router.push(`/storefront/${storefront.subdomain}/account?tab=orders`)
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Cart Modal */}
      {showCartModal && cart.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-start pt-20 md:items-center md:justify-center md:pt-0">
          <div className="bg-white w-full md:w-96 md:rounded-2xl shadow-2xl md:max-h-96 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">
                    {item.name} × {item.quantity || 1}
                  </span>
                  <span className="text-gray-900 font-medium">
                    ₱{(item.price * (item.quantity || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 space-y-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-600">Tax (12%)</span>
                <span className="text-gray-900">₱{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="w-full mt-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
              >
                Continue to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

    <main className="w-full">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Order Summary - Right side on desktop */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24 bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Your cart is empty</p>
                  <Link href={`/storefront/${storefront.subdomain}/products`}>
                    <button className="w-full px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors">
                      Continue Shopping
                    </button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name} × {item.quantity || 1}
                        </span>
                        <span className="text-gray-900 font-medium">
                          ₱{(item.price * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">₱{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (12%)</span>
                      <span className="text-gray-900">₱{tax.toFixed(2)}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery</span>
                        <span className="text-gray-900">₱{deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3 flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-semibold text-gray-900">₱{total.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Checkout Form - Left side on desktop */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-6 text-lg">Your cart is empty</p>
                <Link href={`/storefront/${storefront.subdomain}/products`}>
                  <button className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors">
                    Continue Shopping
                  </button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Phone (Optional)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="+63 9XX XXX XXXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Options */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Method</h3>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-black transition-colors" style={{ borderColor: deliveryType === 'pickup' ? 'black' : undefined }}>
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={deliveryType === 'pickup'}
                        onChange={(e) => setDeliveryType(e.target.value as 'pickup' | 'delivery')}
                        className="w-4 h-4"
                      />
                      <span className="ml-3">
                        <span className="block font-medium text-gray-900">Pickup</span>
                        <span className="block text-sm text-gray-500">Free</span>
                      </span>
                    </label>

                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-black transition-colors" style={{ borderColor: deliveryType === 'delivery' ? 'black' : undefined }}>
                      <input
                        type="radio"
                        name="delivery"
                        value="delivery"
                        checked={deliveryType === 'delivery'}
                        onChange={(e) => setDeliveryType(e.target.value as 'pickup' | 'delivery')}
                        className="w-4 h-4"
                      />
                      <span className="ml-3">
                        <span className="block font-medium text-gray-900">Delivery</span>
                        <span className="block text-sm text-gray-500">₱50</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Address (shown only for delivery) */}
                {deliveryType === 'delivery' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Street Address</label>
                        <input
                          type="text"
                          required={deliveryType === 'delivery'}
                          value={address.line1}
                          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="123 Main Street"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Apartment, suite, etc. (Optional)</label>
                        <input
                          type="text"
                          value={address.line2}
                          onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Apartment 2B"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">City</label>
                          <input
                            type="text"
                            required={deliveryType === 'delivery'}
                            value={address.city}
                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="Manila"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">State/Province</label>
                          <input
                            type="text"
                            required={deliveryType === 'delivery'}
                            value={address.state}
                            onChange={(e) => setAddress({ ...address, state: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="NCR"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Postal Code</label>
                        <input
                          type="text"
                          required={deliveryType === 'delivery'}
                          value={address.postalCode}
                          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="1000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                  <div className="space-y-3">
                    {(['cash', 'card', 'gcash', 'maya'] as const).map((method) => (
                      <label key={method} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-black transition-colors" style={{ borderColor: paymentMethod === method ? 'black' : undefined }}>
                        <input
                          type="radio"
                          name="payment"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'gcash' | 'maya')}
                          className="w-4 h-4"
                        />
                        <span className="ml-3 font-medium text-gray-900 capitalize">{method}</span>
                      </label>
                    ))}
                  </div>

                  {/* Payment Proof Upload for GCash and Maya */}
                  {['gcash', 'maya'].includes(paymentMethod) && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <label className="block mb-3">
                        <span className="block text-sm font-medium text-gray-700 mb-2">Upload Payment Proof</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setIsProcessingFile(true)
                              // Compress image to reduce base64 size
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                const img = new Image()
                                img.onload = () => {
                                  try {
                                    // Create canvas and draw resized image
                                    const canvas = document.createElement('canvas') as HTMLCanvasElement
                                    const maxWidth = 600
                                    const maxHeight = 600
                                    let width = img.width
                                    let height = img.height
                                    
                                    if (width > height) {
                                      if (width > maxWidth) {
                                        height *= maxWidth / width
                                        width = maxWidth
                                      }
                                    } else {
                                      if (height > maxHeight) {
                                        width *= maxHeight / height
                                        height = maxHeight
                                      }
                                    }
                                    
                                    canvas.width = width
                                    canvas.height = height
                                    const ctx = canvas.getContext('2d')
                                    ctx?.drawImage(img, 0, 0, width, height)
                                    
                                    // Convert to base64 with quality reduction
                                    const base64 = canvas.toDataURL('image/jpeg', 0.7)
                                    console.log('Payment proof processed:', {
                                      type: typeof base64,
                                      length: base64.length,
                                      preview: base64.substring(0, 50)
                                    })
                                    setPaymentProof(base64)
                                  } catch (err) {
                                    console.error('Error processing image:', err)
                                    setError('Failed to process image')
                                  } finally {
                                    setIsProcessingFile(false)
                                  }
                                }
                                img.onerror = () => {
                                  console.error('Failed to load image')
                                  setError('Failed to load image. Please try another file.')
                                  setIsProcessingFile(false)
                                }
                                img.src = event.target?.result as string
                              }
                              reader.onerror = () => {
                                console.error('Failed to read file')
                                setError('Failed to read file. Please try again.')
                                setIsProcessingFile(false)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                        />
                        <p className="text-xs text-gray-600 mt-2">Upload a screenshot of your {paymentMethod.toUpperCase()} payment</p>
                      </label>
                      {paymentProof && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-green-700 mb-2">✓ Proof uploaded</p>
                          {/* Using img tag for data URLs - Next.js Image doesn't support data URLs */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={paymentProof} alt="Payment proof preview" className="max-h-32 max-w-32 rounded border border-blue-300" suppressHydrationWarning />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isProcessingFile || cart.length === 0}
                  className="w-full py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
                >
                  {isProcessingFile ? 'Processing image...' : isSubmitting ? 'Processing...' : `Place Order • ₱${total.toFixed(2)}`}
                </button>

                <p className="text-center text-sm text-gray-500">
                  By placing an order, you agree to our terms and conditions
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
    </>
  )
}