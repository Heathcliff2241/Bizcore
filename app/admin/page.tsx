'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RecentActivityWidget } from '@/components/admin/RecentActivityWidget'
import {
  BuildingOfficeIcon,
  UsersIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'

interface KPICard {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  color: 'emerald' | 'blue' | 'amber' | 'purple'
}

interface ActivityItem {
  id: number
  action: string
  tenant?: string
  tenantId?: number
  timestamp: string
  type: 'create' | 'update' | 'delete'
}

interface DashboardStats {
  totalTenants: number
  activeTenants: number
  activeAdminUsers: number
  activeSubscriptions: number
  totalCustomers: number
  totalEmployees: number
  tenantGrowth: number
  adminGrowth: number
  subscriptionGrowth: number
  recentActivity: ActivityItem[]
  alerts: Array<{
    id: number
    message: string
    type: 'warning' | 'error'
    severity: 'high' | 'medium' | 'low'
  }>
}

const colorSchemes = {
  emerald: 'from-blue-600 to-indigo-700 text-white',
  blue: 'from-blue-600 to-indigo-700 text-white',
  amber: 'from-blue-600 to-indigo-700 text-white',
  purple: 'from-blue-600 to-indigo-700 text-white'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          />
          <p className="text-blue-700 font-medium">Loading dashboard...</p>
        </div>
      </motion.div>
    )
  }

  const kpis: KPICard[] = [
    {
      label: 'Total Tenants',
      value: stats?.totalTenants || 0,
      icon: <BuildingOfficeIcon className="w-6 h-6" />,
      color: 'emerald'
    },
    {
      label: 'Active Users',
      value: (stats?.activeAdminUsers || 0) + (stats?.totalCustomers || 0) + (stats?.totalEmployees || 0),
      icon: <UsersIcon className="w-6 h-6" />,
      color: 'blue'
    },
    {
      label: 'Active Tenants',
      value: stats?.activeTenants || 0,
      icon: <CreditCardIcon className="w-6 h-6" />,
      color: 'purple'
    },
    {
      label: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      icon: <CheckCircleIcon className="w-6 h-6" />,
      color: 'amber'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, type: 'tween' as const }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-white overflow-x-hidden relative">
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

      {/* Static background gradient */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-transparent to-indigo-900" />
      </div>

      <div className="relative z-10 px-6 md:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-3">Dashboard</h1>
        <p className="text-lg text-blue-700">Welcome back! Here&apos;s your system overview</p>
      </motion.div>

      {/* KPI Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {kpis.map((kpi, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <motion.div
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.12)' }}
              className="bg-white rounded-2xl p-6 md:p-8 border border-blue-100/60 hover:border-blue-200 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mb-2">{kpi.label}</p>
                  <motion.h3
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-4xl font-bold text-blue-900 group-hover:text-blue-800 transition-colors"
                  >
                    {kpi.value}
                  </motion.h3>
                </div>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`p-4 rounded-xl bg-gradient-to-br ${colorSchemes[kpi.color]} flex-shrink-0`}
                >
                  {kpi.icon}
                </motion.div>
              </div>
              {kpi.change !== undefined && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm ${
                    kpi.change >= 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {kpi.change >= 0 ? (
                      <ArrowUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4" />
                    )}
                    {Math.abs(kpi.change)}%
                  </div>
                  <span className="text-blue-700 text-sm">{kpi.changeLabel}</span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-1"
        >
          <motion.div
            className="bg-white rounded-2xl p-6 md:p-8 border border-blue-100/60 h-full"
          >
            <h2 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
              </div>
              System Alerts
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats?.alerts && stats.alerts.length > 0 ? (
                stats.alerts.map((alert, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'high'
                        ? 'bg-red-50 border-red-300 text-red-900'
                        : alert.severity === 'medium'
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-blue-50 border-blue-300 text-blue-900'
                    }`}
                  >
                    <p className="text-sm font-medium">{alert.message}</p>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-blue-600">
                  <CheckCircleIcon className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm">No active alerts</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Recent Activity Widget */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2"
        >
          <RecentActivityWidget />
        </motion.div>
      </div>
        </div>
      </div>
    </div>
  )
}
