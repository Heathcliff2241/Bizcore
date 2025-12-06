'use client'

import { useCustomer } from './hooks/useCustomer'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { resolveStorefrontHref } from './utils/links'
import type { StorefrontContext } from './types'

interface CustomerWelcomeProps {
  storefront?: StorefrontContext
}

export function CustomerWelcome({ storefront }: CustomerWelcomeProps) {
  const { customer, isLoggedIn } = useCustomer()

  if (!isLoggedIn) {
    const signupHref = resolveStorefrontHref('/signup', storefront).href
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-slate-50 to-slate-100 p-8 rounded-lg border border-slate-200 mb-8"
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to our store!</h2>
        <p className="text-slate-600 mb-4">Create an account to save your favorites and track your orders.</p>
        <Link href={signupHref} className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700">
          Sign up now
        </Link>
      </motion.div>
    )
  }

  const menuHref = resolveStorefrontHref('/menu', storefront).href
  const accountHref = resolveStorefrontHref('/account', storefront).href

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gradient-to-r from-emerald-50 to-emerald-100 p-8 rounded-lg border border-emerald-200 mb-8"
    >
      <h2 className="text-2xl font-bold text-emerald-900 mb-2">Welcome back, {customer?.name?.split(' ')[0]}!</h2>
      <p className="text-emerald-800 mb-4">
        {customer?.totalOrders ? `You've made ${customer.totalOrders} order${customer.totalOrders > 1 ? 's' : ''} with us` : 'Ready to continue shopping?'}
      </p>
      <div className="flex gap-3 flex-wrap">
        <Link href={menuHref} className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700">
          View Menu
        </Link>
        <Link href={accountHref} className="inline-block bg-white text-emerald-600 px-6 py-2 rounded-lg font-medium border border-emerald-200 hover:bg-emerald-50">
          View orders
        </Link>
      </div>
    </motion.div>
  )
}
