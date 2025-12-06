'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  period: string
  revenue: number
  users: number
  tenants: number
  orders: number
  avgOrderValue: number
  conversionRate: number
  growth: {
    revenue: number
    users: number
    tenants: number
  }
  revenueTrend?: Array<{ date: string; amount: number }>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const periods = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
]

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useDemo, setUseDemo] = useState(true)

  // Demo data to show what the page should look like
  const demoData: AnalyticsData = {
    period: 'Month',
    revenue: 45200,
    users: 234,
    tenants: 12,
    orders: 1250,
    avgOrderValue: 36.16,
    conversionRate: 5.14,
    growth: {
      revenue: 15,
      users: 8,
      tenants: 3,
    },
    revenueTrend: [
      { date: 'Dec 4', amount: 1200 },
      { date: 'Dec 5', amount: 2100 },
      { date: 'Dec 6', amount: 2800 },
      { date: 'Dec 7', amount: 2200 },
      { date: 'Dec 8', amount: 3500 },
      { date: 'Dec 9', amount: 4100 },
      { date: 'Dec 10', amount: 3800 },
      { date: 'Dec 11', amount: 4900 },
      { date: 'Dec 12', amount: 4200 },
      { date: 'Dec 13', amount: 5100 },
      { date: 'Dec 14', amount: 6200 },
      { date: 'Dec 15', amount: 5800 },
      { date: 'Dec 16', amount: 6500 },
      { date: 'Dec 17', amount: 7100 },
      { date: 'Dec 18', amount: 6900 },
      { date: 'Dec 19', amount: 7800 },
      { date: 'Dec 20', amount: 8200 },
      { date: 'Dec 21', amount: 7600 },
      { date: 'Dec 22', amount: 8900 },
      { date: 'Dec 23', amount: 9100 },
      { date: 'Dec 24', amount: 8700 },
      { date: 'Dec 25', amount: 9500 },
      { date: 'Dec 26', amount: 8400 },
      { date: 'Dec 27', amount: 9800 },
      { date: 'Dec 28', amount: 10200 },
      { date: 'Dec 29', amount: 9600 },
      { date: 'Dec 30', amount: 10800 },
    ]
  }

  useEffect(() => {
    if (useDemo) {
      setData(demoData)
      setLoading(false)
      setError(null)
      console.log('Demo mode enabled, setting data:', demoData)
    } else {
      fetchAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useDemo])

  // Force demo data on first load
  useEffect(() => {
    console.log('Page mounted, setting initial demo data')
    setData(demoData)
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`)
      
      if (!response.ok) {
        let errorMessage = `API Error (${response.status})`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const analyticsData = await response.json()
      console.log('Analytics data loaded:', analyticsData)
      setData(analyticsData)
      setError(null)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error fetching analytics:', errorMsg)
      setError(errorMsg)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const MetricCard = ({
    title,
    value,
    subtitle,
    trend,
  }: {
    title: string
    value: string
    subtitle?: string
    trend?: number
  }) => (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-6"
    >
      <p className="text-sm text-blue-600 mb-2">{title}</p>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-blue-900">{value}</p>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend >= 0
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {trend >= 0 ? (
              <ArrowTrendingUpIcon className="w-3 h-3" />
            ) : (
              <ArrowTrendingDownIcon className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {subtitle && <p className="text-xs text-blue-600 mt-2">{subtitle}</p>}
    </motion.div>
  )

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-white p-8 relative"
    >
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{ x: [-60, 60, -60], y: [0, 30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full opacity-10 left-0 top-0 w-96 h-96 blur-3xl bg-gradient-to-br from-blue-600 to-blue-400"
        />
        <motion.div
          animate={{ x: [60, -60, 60], y: [0, -30, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-80 h-80 rounded-full opacity-8 right-0 top-1/3 blur-3xl bg-gradient-to-br from-blue-700 to-indigo-600"
        />
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900">Business Metrics</h1>
          <p className="text-blue-700 mt-2">Platform-wide performance and revenue analytics</p>
        </motion.div>

        {/* Period Selector */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-6 mb-6 flex items-center gap-4 flex-wrap"
        >
          <CalendarIcon className="w-5 h-5 text-blue-700" />
          <span className="text-sm font-medium text-blue-900">Select Period:</span>
          <div className="flex gap-2 flex-wrap">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPeriod === period.value
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            className="ml-auto px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setUseDemo(!useDemo)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              useDemo
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {useDemo ? '✓ Demo Mode' : 'Demo Mode'}
          </button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : data ? (
          <>
            {/* Key Metrics */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <MetricCard
                title="Total Revenue"
                value={`$${(data.revenue / 1000).toFixed(1)}K`}
                trend={data.growth.revenue}
              />
              <MetricCard
                title="Active Users"
                value={data.users.toLocaleString()}
                trend={data.growth.users}
              />
              <MetricCard
                title="Active Tenants"
                value={data.tenants.toLocaleString()}
                trend={data.growth.tenants}
              />
              <MetricCard
                title="Total Orders"
                value={data.orders.toLocaleString()}
              />
            </motion.div>

            {/* Secondary Metrics */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <MetricCard
                title="Average Order Value"
                value={`$${data.avgOrderValue.toFixed(2)}`}
                subtitle="Per transaction"
              />
              <MetricCard
                title="Conversion Rate"
                value={`${data.conversionRate.toFixed(1)}%`}
                subtitle="User to customer"
              />
              <MetricCard
                title="Period"
                value={data.period}
                subtitle="Reporting period"
              />
            </motion.div>

            {/* Growth Trends */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Growth Trends</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Revenue Growth</span>
                    <span
                      className={`text-lg font-bold ${
                        data.growth.revenue >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {data.growth.revenue >= 0 ? '+' : ''}{data.growth.revenue}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${Math.min(data.growth.revenue * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">User Growth</span>
                    <span
                      className={`text-lg font-bold ${
                        data.growth.users >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {data.growth.users >= 0 ? '+' : ''}{data.growth.users}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(data.growth.users * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Tenant Growth</span>
                    <span
                      className={`text-lg font-bold ${
                        data.growth.tenants >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {data.growth.tenants >= 0 ? '+' : ''}{data.growth.tenants}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${Math.min(data.growth.tenants * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Revenue Trend Chart */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Revenue Trend</h2>
                <FunnelIcon className="w-5 h-5 text-slate-600" />
              </div>
              {data.revenueTrend && data.revenueTrend.length > 0 ? (
                <div className="relative w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.revenueTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value) => `$${(value as number).toLocaleString()}`}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-500">No revenue data available for this period</p>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-red-600 font-medium mb-2">Failed to load analytics data</p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )}
      </div>
    </motion.div>
  )
}
