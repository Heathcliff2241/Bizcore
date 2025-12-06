'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  EyeIcon,
  XMarkIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface Tenant {
  id: number
  name: string
  subdomain: string
  plan: 'free' | 'basic' | 'premium' | 'enterprise'
  isActive: boolean
  users: number
  revenue: number
  createdAt: string
  owner: {
    firstName: string
    lastName: string
  }
  subscriptionStatus?: 'active' | 'expiring_soon' | 'expired' | 'at_risk'
  lastActivityDate?: string
  renewalDate?: string
}

interface PaginationData {
  total: number
  page: number
  limit: number
  pages: number
}

const planColors: Record<string, string> = {
  free: 'bg-blue-100 text-blue-800',
  basic: 'bg-indigo-100 text-indigo-800',
  premium: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-emerald-100 text-emerald-800',
}

const getHealthStatus = (tenant: Tenant) => {
  if (!tenant.subscriptionStatus || tenant.subscriptionStatus === 'active') {
    return { label: 'Healthy', color: 'bg-emerald-100 text-emerald-800' }
  }
  if (tenant.subscriptionStatus === 'expiring_soon') {
    return { label: 'Expiring Soon', color: 'bg-amber-100 text-amber-800' }
  }
  if (tenant.subscriptionStatus === 'expired') {
    return { label: 'Expired', color: 'bg-red-100 text-red-800' }
  }
  if (tenant.subscriptionStatus === 'at_risk') {
    return { label: 'At Risk', color: 'bg-orange-100 text-orange-800' }
  }
  return { label: 'Unknown', color: 'bg-slate-100 text-slate-800' }
}

export default function TenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  })
  const [warningModal, setWarningModal] = useState<{ isOpen: boolean; tenantId: number | null; tenantName: string }>({
    isOpen: false,
    tenantId: null,
    tenantName: '',
  })
  const [warningForm, setWarningForm] = useState({ reason: '', message: '' })
  const [sendingWarning, setSendingWarning] = useState(false)

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(planFilter !== 'all' && { plan: planFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/tenants?${params}`)
      const data = await response.json()

      setTenants(data.data || [])
      setPagination(data.pagination || {})
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, planFilter, statusFilter])

  const handleDeleteTenant = async (id: number) => {
    if (!window.confirm(
      'WARNING: You are about to PERMANENTLY DELETE this tenant and ALL its data.\n\n' +
      'This action CANNOT be undone. All products, orders, customers, and data will be erased.\n\n' +
      'If you want to preserve data, use "Deactivate" instead.\n\n' +
      'Are you absolutely sure?'
    )) {
      return
    }

    if (!window.confirm('This is your final confirmation. Type "DELETE" to proceed with permanent deletion.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Tenant and all associated data have been permanently deleted.')
        setTenants(tenants.filter((t) => t.id !== id))
        setPagination({
          ...pagination,
          total: pagination.total - 1,
        })
      } else {
        const error = await response.json()
        alert(`Failed to delete tenant: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error)
      alert('Failed to delete tenant')
    }
  }

  const handleDeactivateTenant = async (id: number) => {
    if (!window.confirm(
      'Deactivate this tenant?\n\n' +
      'The tenant will be marked as inactive, but all data will be preserved.\n' +
      'A deactivation email will be sent to the owner.\n\n' +
      'You can still reactivate this tenant later.'
    )) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tenants/${id}/deactivate`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Tenant has been deactivated. Data is preserved.')
        // Update the tenant in the list to show as inactive
        setTenants(tenants.map((t) =>
          t.id === id ? { ...t, isActive: false } : t
        ))
      } else {
        const error = await response.json()
        alert(`Failed to deactivate tenant: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to deactivate tenant:', error)
      alert('Failed to deactivate tenant')
    }
  }

  const handleSendWarning = async () => {
    if (!warningModal.tenantId || !warningForm.reason || !warningForm.message) {
      alert('Please fill in all fields')
      return
    }

    setSendingWarning(true)
    try {
      const response = await fetch(`/api/admin/tenants/${warningModal.tenantId}/warn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: warningForm.reason,
          message: warningForm.message,
        }),
      })

      if (response.ok) {
        alert('Warning email sent successfully')
        setWarningModal({ isOpen: false, tenantId: null, tenantName: '' })
        setWarningForm({ reason: '', message: '' })
      } else {
        const error = await response.json()
        alert(`Failed to send warning: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to send warning:', error)
      alert('Failed to send warning email')
    } finally {
      setSendingWarning(false)
    }
  }

  const openWarningModal = (tenantId: number, tenantName: string) => {
    setWarningModal({ isOpen: true, tenantId, tenantName })
    setWarningForm({ reason: '', message: '' })
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleFilterChange = (type: 'plan' | 'status', value: string) => {
    if (type === 'plan') {
      setPlanFilter(value)
    } else {
      setStatusFilter(value)
    }
    setPage(1)
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

      {/* Dark blue gradient accent overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-transparent to-indigo-900" />
      </div>

      {/* Static background gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-transparent to-indigo-900" />
      </div>

      <div className="relative z-10 px-6 md:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-blue-900">Tenants</h2>
          <p className="text-blue-700 mt-1">Manage all business accounts</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-blue-100/60 rounded-lg p-4 backdrop-blur-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input
              type="text"
              placeholder="Search by name or subdomain..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => handleFilterChange('plan', e.target.value)}
            className="px-4 py-2 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer bg-white text-blue-900"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer bg-white text-blue-900"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Clear Filters Button */}
          <button
            onClick={() => {
              setSearch('')
              setPlanFilter('all')
              setStatusFilter('all')
              setPage(1)
            }}
            className="px-4 py-2 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors text-blue-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-blue-100/60 rounded-lg overflow-hidden backdrop-blur-sm"
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
              ></motion.div>
            </div>
            <p className="text-blue-700 mt-4 font-medium">Loading tenants...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-blue-700">No tenants found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-100 bg-blue-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900">Subdomain</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900">Plan</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900">Health</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900">Users</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900">Revenue</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900">Created</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant, index) => (
                    <motion.tr
                      key={tenant.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-blue-100 hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-blue-900">{tenant.name}</p>
                          <p className="text-sm text-blue-600">{tenant.owner.firstName} {tenant.owner.lastName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-blue-700">{tenant.subdomain}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${planColors[tenant.plan]}`}>
                          {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {tenant.isActive ? (
                            <>
                              <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-5 h-5 text-blue-400" />
                              <span className="text-blue-600">Inactive</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const health = getHealthStatus(tenant)
                          return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${health.color}`}>
                            {health.label}
                          </span>
                        })()}
                      </td>
                      <td className="px-6 py-4 text-blue-700">{tenant.users}</td>
                      <td className="px-6 py-4 font-medium text-blue-900">₱{(tenant.revenue || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-blue-600 text-sm">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View tenant details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openWarningModal(tenant.id, tenant.name)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Send warning email"
                          >
                            <ExclamationTriangleIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeactivateTenant(tenant.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Deactivate tenant (preserve data)"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete tenant permanently"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="border-t border-blue-100 bg-blue-50/50 px-6 py-4 flex items-center justify-between"
              >
                <div className="text-sm text-blue-700">
                  Showing <span className="font-medium">{(page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> tenants
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-blue-100 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </motion.button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum
                      if (pagination.pages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }

                      return (
                        <motion.button
                          key={pageNum}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white'
                              : 'border border-blue-100 hover:bg-blue-100 text-blue-700'
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      )
                    })}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page === pagination.pages}
                    className="p-2 rounded-lg border border-blue-100 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {/* Warning Modal */}
      {warningModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-amber-100">
                <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Send Warning Email</h3>
                <p className="text-sm text-gray-500">{warningModal.tenantName}</p>
              </div>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Warning
                </label>
                <input
                  id="reason"
                  type="text"
                  placeholder="e.g., Late Payment, Policy Violation, Usage Violation"
                  value={warningForm.reason}
                  onChange={(e) => setWarningForm({ ...warningForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  placeholder="Enter the warning message that will be sent to the tenant..."
                  value={warningForm.message}
                  onChange={(e) => setWarningForm({ ...warningForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> This email will be sent to the tenant's account owner with the reason and message you provide.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setWarningModal({ isOpen: false, tenantId: null, tenantName: '' })
                  setWarningForm({ reason: '', message: '' })
                }}
                disabled={sendingWarning}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWarning}
                disabled={sendingWarning || !warningForm.reason || !warningForm.message}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingWarning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Sending...
                  </>
                ) : (
                  'Send Warning'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

        </div>
      </div>
    </div>
  )
}
