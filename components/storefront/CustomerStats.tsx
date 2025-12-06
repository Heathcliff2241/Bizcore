'use client'

import { useCustomer } from './hooks/useCustomer'
import { ShoppingBag, Heart, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export function CustomerStats() {
  const { customer, isLoggedIn } = useCustomer()

  if (!isLoggedIn) return null

  const stats = [
    { label: 'Total Orders', value: customer?.totalOrders ?? 0, icon: ShoppingBag },
    { label: 'Saved Addresses', value: customer?.address?.length ?? 0, icon: MapPin },
    { label: 'Customer Since', value: new Date(customer?.email || new Date()).getFullYear(), icon: Heart },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 my-8">
      {stats.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center"
          >
            <Icon className="w-5 h-5 mx-auto mb-2 text-slate-400" />
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-xs text-slate-600">{stat.label}</div>
          </motion.div>
        )
      })}
    </div>
  )
}
