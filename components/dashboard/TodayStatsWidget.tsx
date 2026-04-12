'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserPlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

interface TodayStats {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  newCustomers: number
  yesterdayOrders?: number
  yesterdayRevenue?: number
}

interface TodayStatsWidgetProps {
  subdomain?: string
  theme?: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
  }
}

const defaultTheme = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
}

export function TodayStatsWidget({ subdomain, theme = defaultTheme }: TodayStatsWidgetProps) {
  const [stats, setStats] = useState<TodayStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const endpoint = subdomain
        ? `/api/tenant/stats/today?subdomain=${subdomain}`
        : '/api/admin/stats/today'

      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error('Failed to fetch today stats')
      }

      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching today stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [subdomain])

  const calculateChange = (today: number, yesterday?: number) => {
    if (!yesterday || yesterday === 0) return null
    const change = ((today - yesterday) / yesterday) * 100
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    }
  }

  const orderChange = calculateChange(stats?.todayOrders || 0, stats?.yesterdayOrders)
  const revenueChange = calculateChange(stats?.todayRevenue || 0, stats?.yesterdayRevenue)

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return null // Silently fail - dashboard should still work without this widget
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold" style={{ color: theme.text }}>
            Today&apos;s Activity
          </h3>
          <p className="text-sm mt-1" style={{ color: `${theme.text}99` }}>
            Real-time updates • Refreshes every 30 seconds
          </p>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Today's Orders */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="p-4 sm:p-6 border rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}12, ${theme.secondary}08)`,
            borderColor: `${theme.primary}20`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${theme.primary}15` }}
            >
              <ShoppingBagIcon className="w-5 h-5" style={{ color: theme.primary }} />
            </div>
            {orderChange && (
              <div className="flex items-center gap-1 text-xs font-semibold">
                {orderChange.isPositive ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
                )}
                <span style={{ color: orderChange.isPositive ? '#16a34a' : '#dc2626' }}>
                  {orderChange.value}%
                </span>
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: `${theme.text}99` }}>
            Today&apos;s Orders
          </p>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: theme.text }}>
            {stats.todayOrders}
          </p>
        </motion.div>

        {/* Today's Revenue */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
          className="p-4 sm:p-6 border rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${theme.secondary}12, ${theme.primary}08)`,
            borderColor: `${theme.secondary}20`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${theme.secondary}15` }}
            >
              <CurrencyDollarIcon className="w-5 h-5" style={{ color: theme.secondary }} />
            </div>
            {revenueChange && (
              <div className="flex items-center gap-1 text-xs font-semibold">
                {revenueChange.isPositive ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
                )}
                <span style={{ color: revenueChange.isPositive ? '#16a34a' : '#dc2626' }}>
                  {revenueChange.value}%
                </span>
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: `${theme.text}99` }}>
            Today&apos;s Revenue
          </p>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: theme.text }}>
            {formatCurrency(stats.todayRevenue)}
          </p>
        </motion.div>

        {/* Pending Orders */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="p-4 sm:p-6 border rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${theme.accent}12, ${theme.primary}08)`,
            borderColor: `${theme.accent}20`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${theme.accent}15` }}
            >
              <ClockIcon className="w-5 h-5" style={{ color: theme.accent }} />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: `${theme.text}99` }}>
            Pending Orders
          </p>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: theme.text }}>
            {stats.pendingOrders}
          </p>
        </motion.div>

        {/* New Customers */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
          className="p-4 sm:p-6 border rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}12, ${theme.secondary}08)`,
            borderColor: `${theme.primary}20`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${theme.primary}15` }}
            >
              <UserPlusIcon className="w-5 h-5" style={{ color: theme.primary }} />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: `${theme.text}99` }}>
            New Customers Today
          </p>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: theme.text }}>
            {stats.newCustomers}
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

