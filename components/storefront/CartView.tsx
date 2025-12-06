"use client"

import { useSession } from 'next-auth/react'
import { useCustomerSession } from './hooks/useCustomerSession'
import { useCart } from './hooks/useCart'
import { useCustomer } from './hooks/useCustomer'
import Image from 'next/image'
import Link from 'next/link'
import { CheckoutSummary } from './CheckoutSummary'
import { resolveStorefrontHref } from './utils/links'
import type { StorefrontContext } from './types'
import { motion } from 'framer-motion'

export function CartView({ storefront }: { storefront?: StorefrontContext }) {
  const { data: session } = useCustomerSession()
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart(storefront?.subdomain, session?.user?.id)
  const { customer, isLoggedIn } = useCustomer()

  const subtotal = cart.reduce((sum, i) => sum + (i.price * (i.quantity ?? 1)), 0)
  const checkoutHref = resolveStorefrontHref('/checkout', storefront)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Shopping Cart</h1>
          {cart.length > 0 && (
            <p className="text-gray-600">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
          )}
        </div>

        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-8">Add some items to get started</p>
              <Link
                href={resolveStorefrontHref('/menu', storefront).href}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item, index) => (
                <motion.div
                  key={String(item.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex gap-6">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">₱{item.price.toFixed(2)} each</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-gray-600">Quantity:</label>
                          <select
                            value={item.quantity || 1}
                            onChange={(e) => updateQuantity(item.id as any, Number(e.target.value))}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ₱{(item.price * (item.quantity || 1)).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id as any)}
                            className="text-sm text-red-600 hover:text-red-700 mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => clearCart()}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Clear all items
                </button>
                <Link
                  href={resolveStorefrontHref('/menu', storefront).href}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Continue shopping →
                </Link>
              </div>
            </div>

            {/* Order Summary & Checkout */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                <CheckoutSummary subtotal={subtotal} />

                {!isLoggedIn && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Sign in for faster checkout</p>
                        <p className="text-xs text-blue-700 mb-3">Save your addresses and payment methods</p>
                        <Link
                          href={resolveStorefrontHref('/signin', storefront).href}
                          className="text-sm text-blue-700 hover:text-blue-800 font-medium"
                        >
                          Sign in →
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="mt-6">
                  <Link
                    href={checkoutHref.href}
                    className="w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartView
