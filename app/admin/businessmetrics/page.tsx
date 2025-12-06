'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

export default function BusinessMetricsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics (${response.status})`)
      }

      const analyticsData = await response.json()
      console.log('Analytics data loaded:', analyticsData)
      setData(analyticsData)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error fetching analytics:', errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Demo data fallback
  const demoData: AnalyticsData = {
    period: 'Month',
    revenue: 45200,
    users: 234,
    tenants: 12,
    orders: 1250,
    avgOrderValue: 36.16,
    conversionRate: 5.14,
    growth: { revenue: 15, users: 8, tenants: 3 },
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

  // Use real data if available, otherwise use demo
  const displayData = data || (error ? null : demoData)

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-white p-8 relative">
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900">Business Metrics</h1>
          <p className="text-blue-700 mt-2">Platform-wide performance and revenue analytics</p>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-6 mb-6 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-blue-900">Select Period:</span>
          <div className="flex gap-2 flex-wrap">
            {['today', 'week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            className="ml-auto px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && !data && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium">Failed to load analytics data</p>
            <p className="text-red-500 text-sm mt-2">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Data Display */}
        {!loading && displayData && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Revenue */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-6">
                <p className="text-sm text-blue-600 mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-blue-900">₱{(displayData.revenue).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                <div className="mt-2 text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full inline-block">
                  ↑ +{displayData.growth.revenue}%
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-6">
                <p className="text-sm text-blue-600 mb-2">Active Users</p>
                <p className="text-3xl font-bold text-blue-900">{displayData.users.toLocaleString()}</p>
                <div className="mt-2 text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full inline-block">
                  ↑ +{displayData.growth.users}%
                </div>
              </div>

              {/* Active Tenants */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-6">
                <p className="text-sm text-blue-600 mb-2">Active Tenants</p>
                <p className="text-3xl font-bold text-blue-900">{displayData.tenants.toLocaleString()}</p>
                <div className="mt-2 text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full inline-block">
                  ↑ +{displayData.growth.tenants}%
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-6">
                <p className="text-sm text-blue-600 mb-2">Total Orders</p>
                <p className="text-3xl font-bold text-blue-900">{displayData.orders.toLocaleString()}</p>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* AOV */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-6">
                <p className="text-sm text-blue-600 mb-2">Average Order Value</p>
                <p className="text-3xl font-bold text-blue-900">₱{displayData.avgOrderValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-blue-600 mt-2">Per transaction</p>
              </div>

              {/* Conversion */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-6">
                <p className="text-sm text-blue-600 mb-2">Conversion Rate</p>
                <p className="text-3xl font-bold text-blue-900">{displayData.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-blue-600 mt-2">User to customer</p>
              </div>

              {/* Period */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-6">
                <p className="text-sm text-blue-600 mb-2">Period</p>
                <p className="text-3xl font-bold text-blue-900">{displayData.period}</p>
                <p className="text-xs text-blue-600 mt-2">Reporting period</p>
              </div>
            </div>

            {/* Growth Trends */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Growth Trends</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Revenue Growth</span>
                    <span className={`text-lg font-bold ${displayData.growth.revenue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {displayData.growth.revenue >= 0 ? '+' : ''}{displayData.growth.revenue}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(Math.abs(displayData.growth.revenue) * 2, 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">User Growth</span>
                    <span className={`text-lg font-bold ${displayData.growth.users >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {displayData.growth.users >= 0 ? '+' : ''}{displayData.growth.users}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(Math.abs(displayData.growth.users) * 2, 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Tenant Growth</span>
                    <span className={`text-lg font-bold ${displayData.growth.tenants >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {displayData.growth.tenants >= 0 ? '+' : ''}{displayData.growth.tenants}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(Math.abs(displayData.growth.tenants) * 2, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Revenue Trend</h2>
              {displayData.revenueTrend && displayData.revenueTrend.length > 0 ? (
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayData.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value) => `₱${(value as number).toLocaleString()}`}
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
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-500">No revenue data available for this period</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
