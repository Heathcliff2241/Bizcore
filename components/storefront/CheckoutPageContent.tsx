"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Wallet, Banknote, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useCart } from './hooks/useCart'
import { useCustomerSession } from './hooks/useCustomerSession'
import { resolveStorefrontHref } from './utils/links'
import type { StorefrontContext } from './types'

interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface CheckoutPageContentProps {
  storefront: StorefrontContext
}

export function CheckoutPageContent({ storefront }: CheckoutPageContentProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('Checkout mounted - Current cart:', cart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pre-fill with session data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session])

  const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
  const tax = subtotal * 0.12 // 12% VAT
  // Get delivery fee from tenant settings or default to 50
  const settingsObj = storefront.settings as Record<string, unknown> | undefined
  const deliverySettings = settingsObj?.delivery as Record<string, number> | undefined
  const defaultDeliveryFee = deliverySettings?.defaultDeliveryFee ?? 50
  const deliveryFee = deliveryType === 'delivery' ? defaultDeliveryFee : 0
  const total = subtotal + tax + deliveryFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    if (deliveryType === 'delivery') {
      if (!address.line1.trim() || !address.city.trim() || !address.postalCode.trim()) {
        setError('Please complete your delivery address')
        return
      }
    }
    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }

    // Validate cart items have valid product IDs
    const invalidItems = cart.filter(item => !item.id || isNaN(Number(item.id)))
    if (invalidItems.length > 0) {
      console.error('Invalid cart items:', invalidItems)
      setError('Some items in your cart are invalid. Please refresh and try again.')
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
        paymentMethod
      }

      console.log('Sending order data:', orderData)

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

      const result = await response.json()
      
      // Clear cart and redirect to order confirmation
      clearCart()
      const orderUrl = resolveStorefrontHref(`/account/orders/${result.orderId}`, storefront)
      router.push(orderUrl.href)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToCart = () => {
    const cartUrl = resolveStorefrontHref('/cart', storefront)
    router.push(cartUrl.href)
  }

  if (!mounted) {
    return <div className="bg-gray-50 py-8"><div className="max-w-7xl mx-auto px-4"><div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div></div></div>
  }

  if (cart.length === 0) {
    return (
      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some items before checking out</p>
            <button
              onClick={() => router.push(resolveStorefrontHref('/home', storefront).href)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  const paymentOptions = [
    { id: 'cash', name: 'Cash on Delivery/Pickup', icon: Banknote, description: 'Pay with cash when you receive your order' },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, American Express' },
    { id: 'gcash', name: 'GCash', icon: Wallet, description: 'Pay using GCash e-wallet' },
    { id: 'maya', name: 'Maya (PayMaya)', icon: Wallet, description: 'Pay using Maya e-wallet' }
  ]

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToCart}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
                
                {session?.user && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Signed in as {session.user.email}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+63 912 345 6789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Method</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      deliveryType === 'pickup'
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🏪</div>
                      <div className="font-semibold">Pickup</div>
                      <div className="text-sm text-gray-600">Free</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      deliveryType === 'delivery'
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🚚</div>
                      <div className="font-semibold">Delivery</div>
                      <div className="text-sm text-gray-600">₱50.00</div>
                    </div>
                  </button>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                      <input
                        type="text"
                        value={address.line1}
                        onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="House/Unit no., Street name"
                        required={deliveryType === 'delivery'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                      <input
                        type="text"
                        value={address.line2}
                        onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Barangay, Subdivision, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required={deliveryType === 'delivery'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                        <input
                          type="text"
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required={deliveryType === 'delivery'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                      <input
                        type="text"
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="e.g. 1000"
                        required={deliveryType === 'delivery'}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
                
                <div className="space-y-3">
                  {paymentOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPaymentMethod(option.id as 'cash' | 'card' | 'gcash' | 'maya')}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        paymentMethod === option.id
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <option.icon className="w-6 h-6 text-gray-700" />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{option.name}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                        {paymentMethod === option.id && (
                          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {paymentMethod !== 'cash' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> {paymentMethod === 'card' ? 'You will be redirected to a secure payment page to complete your transaction.' : `You will receive ${paymentMethod.toUpperCase()} payment instructions after placing your order.`}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-3 border-b">
                      <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                        <p className="text-sm text-gray-600">Qty: {item.quantity || 1}</p>
                        <p className="text-sm font-semibold text-emerald-600">
                          ₱{(item.price * (item.quantity || 1)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (12%)</span>
                    <span>₱{tax.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {deliveryType === 'delivery' && (
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span>₱{deliveryFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By placing this order, you agree to our Terms & Conditions
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
