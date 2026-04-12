"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart, type CartItem } from './hooks/useCart'
import type { StorefrontContext } from './types'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  storefront?: StorefrontContext
}

interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, storefront }) => {
  const { data: session } = useSession()
  const { cart, clearCart, removeFromCart, updateQuantity } = useCart(storefront?.subdomain, session?.user?.id)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
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
  const [gcashProof, setGcashProof] = useState<File | null>(null)
  const [gcashPreview, setGcashPreview] = useState<string | null>(null)
  const [gcashNumber, setGcashNumber] = useState<string>('')
  const [gcashQrCode, setGcashQrCode] = useState<string>('')
  const [taxRate, setTaxRate] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('CartModal - cart items:', cart)
  }, [cart])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Load customer details and GCash settings
  useEffect(() => {
    if (step === 'checkout' && session?.user) {
      // Pre-fill with session data
      setName(session.user.name || '')
      setEmail(session.user.email || '')
      
      // Fetch full customer record to verify they belong to this tenant
      if (session.user.id && storefront?.subdomain) {
        fetch(`/api/customers?subdomain=${storefront.subdomain}`)
          .then(res => {
            if (res.status === 404) {
              // Customer not registered on this tenant's storefront
              setError('Your account is not registered on this storefront. Please create a new account.')
              setStep('cart')
              return null
            }
            if (!res.ok) throw new Error('Failed to load customer')
            return res.json()
          })
          .then(data => {
            if (!data) return
            if (data.phone) setPhone(data.phone)
            if (data.address) {
              const addr = typeof data.address === 'string' ? JSON.parse(data.address) : data.address
              if (addr.line1) {
                setAddress(prev => ({
                  ...prev,
                  line1: addr.line1 || '',
                  line2: addr.line2 || '',
                  city: addr.city || '',
                  state: addr.state || '',
                  postalCode: addr.postalCode || ''
                }))
              }
            }
          })
          .catch(err => console.error('Failed to load customer details:', err))
      }
    }

    // Load GCash settings from storefront
    if (storefront?.settings) {
      const settings = storefront.settings as Record<string, unknown>
      const paymentSettings = settings.paymentSettings as Record<string, unknown> | undefined
      if (paymentSettings) {
        if (typeof paymentSettings.gcashNumber === 'string') {
          setGcashNumber(paymentSettings.gcashNumber)
        }
        if (typeof paymentSettings.gcashQrCode === 'string') {
          setGcashQrCode(paymentSettings.gcashQrCode)
        }
      }

      // Load tax settings
      const taxSettings = settings.tax as Record<string, unknown> | undefined
      if (taxSettings && typeof taxSettings.defaultTaxPercent === 'number') {
        setTaxRate(taxSettings.defaultTaxPercent)
      }
    }
  }, [step, session, storefront])

  const subtotal = cart.reduce((sum: number, item: CartItem) => sum + (item.price * (Number(item.quantity) || 1)), 0)
  const tax = subtotal * (taxRate / 100)
  // Get delivery fee from tenant settings or default to 50
  const settingsObj = storefront.settings as Record<string, unknown> | undefined
  const deliverySettings = settingsObj?.delivery as Record<string, number> | undefined
  const defaultDeliveryFee = deliverySettings?.defaultDeliveryFee ?? 50
  const deliveryFee = deliveryType === 'delivery' ? defaultDeliveryFee : 0
  const total = subtotal + tax + deliveryFee

  const handleCheckout = () => {
    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }
    
    // Require authentication before checkout
    if (!session?.user) {
      setError('Please sign in or create an account to checkout')
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

    // Validate GCash proof if selected
    if (paymentMethod === 'gcash' && !gcashProof) {
      setError('Please upload your GCash payment proof')
      return
    }

    setIsSubmitting(true)

    try {
      // If GCash, convert proof to base64
      let gcashProofData = null
      if (paymentMethod === 'gcash' && gcashProof) {
        gcashProofData = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(gcashProof)
        })
      }

      const orderData = {
        customer: {
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
        gcashProof: gcashProofData
      }

      const response = await fetch(`/api/orders?subdomain=${storefront?.subdomain}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-subdomain': storefront?.subdomain || ''
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create order')
      }

      clearCart()
      onClose()
      router.push(`/storefront/${storefront?.subdomain}/account?tab=orders`)
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

  const handleClose = () => {
    setStep('cart')
    onClose()
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-[9999]">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between gap-2">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  {step === 'cart' ? 'Your Cart' : 'Checkout'}
                </h1>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                  aria-label="Close cart"
                >
                  <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {step === 'cart' ? (
                  <div className="space-y-4 sm:space-y-6">
                    {cart.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">Your cart is empty</p>
                        <button
                          onClick={handleClose}
                          className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {cart.map((item) => (
                            <div key={item.id} className="flex justify-between items-start pb-4 border-b border-gray-100">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-500 mb-2">₱{item.price.toFixed(2)} each</p>
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const itemId = item.id
                                      if (!itemId) {
                                        console.error('Item has no ID:', item)
                                        return
                                      }
                                      const newQty = Math.max(1, (item.quantity || 1) - 1)
                                      console.log(`Updating quantity for item ${itemId} to ${newQty}`)
                                      updateQuantity(itemId, newQty)
                                    }}
                                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center font-medium">{item.quantity || 1}</span>
                                  <button
                                    onClick={() => {
                                      const itemId = item.id
                                      if (!itemId) {
                                        console.error('Item has no ID:', item)
                                        return
                                      }
                                      console.log(`Updating quantity for item ${itemId} to ${(item.quantity || 1) + 1}`)
                                      updateQuantity(itemId, (item.quantity || 1) + 1)
                                    }}
                                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                  >
                                    +
                                  </button>
                                  <button
                                    onClick={() => {
                                      const itemId = item.id
                                      if (!itemId) {
                                        console.error('Item has no ID:', item)
                                        return
                                      }
                                      removeFromCart(itemId)
                                    }}
                                    className="ml-auto px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                              <p className="font-semibold text-gray-900 ml-4 whitespace-nowrap">₱{(item.price * (item.quantity || 1)).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-gray-200 pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">₱{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax ({taxRate}%)</span>
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
                  <div className="space-y-6">
                    <button
                      onClick={() => setStep('cart')}
                      className="text-black hover:text-gray-700 font-medium flex items-center gap-2"
                    >
                      ← Back to Cart
                    </button>

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
                      </div>

                      {/* GCash Payment Details */}
                      {paymentMethod === 'gcash' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">Send Payment to GCash</h3>
                          
                          {/* GCash Number */}
                          {gcashNumber && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">GCash Number</p>
                              <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                                <p className="text-xl font-bold text-gray-900">{gcashNumber}</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (navigator?.clipboard?.writeText) {
                                      navigator.clipboard.writeText(gcashNumber)
                                    } else {
                                      // Fallback for older browsers
                                      const textarea = document.createElement('textarea')
                                      textarea.value = gcashNumber
                                      document.body.appendChild(textarea)
                                      textarea.select()
                                      document.execCommand('copy')
                                      document.body.removeChild(textarea)
                                    }
                                  }}
                                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                          )}

                          {/* GCash QR Code */}
                          {gcashQrCode && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Scan to Pay</p>
                              <div className="bg-white p-4 rounded-lg border border-gray-200 flex justify-center">
                                <div className="relative w-48 h-48">
                                  <Image
                                    src={gcashQrCode}
                                    alt="GCash QR Code"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {!gcashNumber && !gcashQrCode && (
                            <p className="text-sm text-gray-600 italic">GCash payment details not configured</p>
                          )}
                        </div>
                      )}

                      {/* GCash Payment Proof Upload */}
                      {paymentMethod === 'gcash' && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">GCash Payment Proof</h3>
                          <p className="text-sm text-gray-600 mb-3">Please upload a screenshot of your GCash payment confirmation</p>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setGcashProof(file)
                                  const reader = new FileReader()
                                  reader.onloadend = () => {
                                    setGcashPreview(reader.result as string)
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                              className="hidden"
                              id="gcash-proof"
                            />
                            <label htmlFor="gcash-proof" className="cursor-pointer block">
                              {gcashPreview ? (
                                <div className="space-y-2">
                                  <div className="relative w-full h-48 rounded">
                                    <Image
                                      src={gcashPreview}
                                      alt="GCash proof"
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                  <p className="text-sm text-center text-gray-600">{gcashProof?.name}</p>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setGcashProof(null)
                                      setGcashPreview(null)
                                    }}
                                    className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                                  >
                                    Remove Image
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  <p className="text-gray-600 font-medium">Click to upload GCash proof</p>
                                  <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                      )}

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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
