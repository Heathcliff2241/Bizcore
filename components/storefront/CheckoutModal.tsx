"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, type CartItem } from './hooks/useCart'
import { useCustomerSession } from './hooks/useCustomerSession'
import Link from 'next/link'

interface StorefrontContext {
  id: string | number
  subdomain: string
  name: string
  settings?: Record<string, unknown>
  primaryColor?: string
  secondaryColor?: string
}

interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface CheckoutModalProps {
  storefront: StorefrontContext
}

export function CheckoutModal({ storefront }: CheckoutModalProps) {
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
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')

  useEffect(() => {
    setMounted(true)
    console.log('CheckoutModal mounted - Current cart:', cart)
  }, [cart])

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session])

  const subtotal = cart.reduce((sum: number, item: CartItem) => sum + (item.price * (Number(item.quantity) || 1)), 0)
  const tax = subtotal * 0.12
  const deliveryFee = deliveryType === 'delivery' ? 50 : 0
  const total = subtotal + tax + deliveryFee

  const handleCheckout = () => {
    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }
    setError(null)
    setStep('checkout')
  }

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

      await response.json()
      clearCart()
      router.push(`/storefront/${storefront.subdomain}/orders`)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-center p-4">
      <div className="bg-white w-full md:max-w-2xl md:rounded-2xl shadow-2xl max-h-screen md:max-h-screen overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'cart' ? 'Your Cart' : 'Checkout'}
          </h1>
          <Link href={`/storefront/${storefront.subdomain}/products`}>
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'cart' ? (
            <div className="p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-6">Your cart is empty</p>
                  <Link href={`/storefront/${storefront.subdomain}/products`}>
                    <button className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors">
                      Continue Shopping
                    </button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center pb-4 border-b border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity || 1}</p>
                        </div>
                        <p className="font-semibold text-gray-900">₱{(item.price * (item.quantity || 1)).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">₱{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (12%)</span>
                      <span className="text-gray-900">₱{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>Total</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    className="w-full py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors text-lg"
                  >
                    Proceed to Checkout
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="p-6">
              <button
                onClick={() => setStep('cart')}
                className="mb-6 text-black hover:text-gray-700 font-medium flex items-center gap-2"
              >
                ← Back to Cart
              </button>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Info</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone (Optional)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                {/* Delivery */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery</h3>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-black" style={{ borderColor: deliveryType === 'pickup' ? 'black' : undefined }}>
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={deliveryType === 'pickup'}
                        onChange={(e) => setDeliveryType(e.target.value as 'pickup' | 'delivery')}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 font-medium">Pickup - Free</span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-black" style={{ borderColor: deliveryType === 'delivery' ? 'black' : undefined }}>
                      <input
                        type="radio"
                        name="delivery"
                        value="delivery"
                        checked={deliveryType === 'delivery'}
                        onChange={(e) => setDeliveryType(e.target.value as 'pickup' | 'delivery')}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 font-medium">Delivery - ₱50</span>
                    </label>
                  </div>
                </div>

                {/* Address */}
                {deliveryType === 'delivery' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        required
                        value={address.line1}
                        onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                        placeholder="Street Address"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="text"
                        value={address.line2}
                        onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                        placeholder="Apartment, Suite, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          placeholder="City"
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <input
                          type="text"
                          required
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          placeholder="State/Province"
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <input
                        type="text"
                        required
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        placeholder="Postal Code"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                )}

                {/* Payment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
                  <div className="space-y-2">
                    {(['cash', 'card', 'gcash', 'maya'] as const).map((method) => (
                      <label key={method} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-black" style={{ borderColor: paymentMethod === method ? 'black' : undefined }}>
                        <input
                          type="radio"
                          name="payment"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'gcash' | 'maya')}
                          className="w-4 h-4"
                        />
                        <span className="ml-3 font-medium capitalize">{method}</span>
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
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string
                                setPaymentProof(base64)
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
                          <img src={paymentProof} alt="Payment proof preview" className="max-h-32 max-w-32 rounded border border-blue-300" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₱{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>₱{tax.toFixed(2)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery</span>
                      <span>₱{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>₱{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 disabled:bg-gray-400 transition-colors text-lg"
                >
                  {isSubmitting ? 'Processing...' : `Place Order • ₱${total.toFixed(2)}`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
