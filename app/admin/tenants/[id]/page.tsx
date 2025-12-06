'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { formatActivityDetails } from '@/lib/activityFormatter'

interface Tenant {
  id: number
  name: string
  subdomain: string
  domain?: string
  description?: string
  logo?: string
  favicon?: string
  isActive: boolean
  isPremium: boolean
  plan: string
  subscriptionExpires?: string
  primaryColor: string
  secondaryColor: string
  owner: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
  team: Array<{
    id: number
    user: {
      id: number
      firstName: string
      lastName: string
      email: string
    }
    role: string
  }>
employees: Array<{
    id: number
    firstName: string
    lastName: string
    email: string
    role?: string
  }>
  stats: {
    products: number
    orders: number
    employees: number
    customers: number
    monthlyRevenue: number
  }
  createdAt: string
  updatedAt: string
}

interface ActivityLog {
  id: number
  action: string
  details?: Record<string, unknown>
  user: string
  userEmail?: string
  createdAt: string
}

type Tab = 'details' | 'team' | 'activity'

export default function TenantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [activityPage, setActivityPage] = useState(1)
  const [activityTotal, setActivityTotal] = useState(0)
  const [activityTotalPages, setActivityTotalPages] = useState(1)

  // Edit state
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Partial<Tenant> | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch tenant details
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch(`/api/admin/tenants/${id}`)
        if (!res.ok) {
          throw new Error('Failed to fetch tenant')
        }
        const data = await res.json()
        setTenant(data)
        setEditData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchTenant()
  }, [id])

  // Fetch activity logs
  useEffect(() => {
    if (activeTab !== 'activity' || !tenant) return

    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/admin/tenants/${id}/activity?page=${activityPage}&limit=20`)
        if (!res.ok) {
          throw new Error('Failed to fetch activity')
        }
        const data = await res.json()
        setActivities(data.data)
        setActivityTotal(data.pagination.total)
        setActivityTotalPages(data.pagination.totalPages)
      } catch (err) {
        console.error('Activity fetch error:', err)
      }
    }

    fetchActivity()
  }, [activeTab, activityPage, id, tenant])

  const handleEditChange = (field: keyof Tenant, value: unknown) => {
    setEditData(prev => prev ? { ...prev, [field]: value } : null)
    setEditError(null)
  }

  const handleSaveEdit = async () => {
    if (!editData) return

    setEditLoading(true)
    setEditError(null)

    try {
      const updatePayload = {
        name: editData.name,
        description: editData.description,
        primaryColor: editData.primaryColor,
        secondaryColor: editData.secondaryColor,
        isActive: editData.isActive,
        plan: editData.plan
      }

      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      })

      if (!res.ok) {
        throw new Error('Failed to update tenant')
      }

      const updated = await res.json()
      setTenant(prev => prev ? { ...prev, ...updated } : null)
      setEditMode(false)
      setEditSuccess(true)
      setTimeout(() => setEditSuccess(false), 3000)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete tenant')
      }

      router.push('/admin/tenants')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setShowDeleteConfirm(false)
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin/tenants" className="flex items-center text-emerald-600 hover:text-emerald-700 mb-6">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Tenants
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-4 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-red-900">Error</h2>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin/tenants" className="flex items-center text-emerald-600 hover:text-emerald-700 mb-6">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Tenants
          </Link>
          <div className="text-center py-12">
            <p className="text-slate-600">Tenant not found</p>
          </div>
        </div>
      </div>
    )
  }

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-white p-8 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/admin/tenants" className="flex items-center text-blue-700 hover:text-blue-800 mb-6">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Tenants
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-blue-900 mb-2">{tenant.name}</h1>
              <p className="text-blue-700 mb-4">
                Subdomain: <span className="font-mono bg-slate-200 px-2 py-1 rounded text-sm">{tenant.subdomain}</span>
              </p>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tenant.isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tenant.plan === 'free' ? 'bg-slate-100 text-slate-700' :
                  tenant.plan === 'basic' ? 'bg-blue-100 text-blue-700' :
                  tenant.plan === 'premium' ? 'bg-purple-100 text-purple-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {!editMode && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition"
                  >
                    <PencilIcon className="w-5 h-5" />
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <TrashIcon className="w-5 h-5" />
                    Delete
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {editSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start"
            >
              <CheckIcon className="w-5 h-5 text-emerald-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-emerald-700 font-medium">Tenant updated successfully</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex border-b border-slate-200">
            {(['details', 'team', 'activity'] as Tab[]).map(tab => (
              <motion.button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  if (tab === 'activity') setActivityPage(1)
                }}
                className={`flex-1 px-6 py-4 font-medium text-center transition ${
                  activeTab === tab
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                whileHover={{ backgroundColor: 'rgb(15 23 42 / 0.02)' }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <motion.div
                  key="details"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-6"
                >
                  {editMode ? (
                    // Edit Mode
                    <motion.div className="space-y-6">
                      {editError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                          <p className="text-red-700">{editError}</p>
                        </div>
                      )}

                      {/* Name Field */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={editData?.name || ''}
                          onChange={(e) => handleEditChange('name', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Description Field */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={editData?.description || ''}
                          onChange={(e) => handleEditChange('description', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Plan Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Subscription Plan
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {['free', 'basic', 'premium', 'enterprise'].map(plan => (
                            <motion.button
                              key={plan}
                              onClick={() => handleEditChange('plan', plan)}
                              className={`p-3 rounded-lg border-2 text-left font-medium transition ${
                                editData?.plan === plan
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                              whileHover={{ scale: 1.02 }}
                            >
                              {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Color Pickers */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Primary Color
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="color"
                              value={editData?.primaryColor || '#10b981'}
                              onChange={(e) => handleEditChange('primaryColor', e.target.value)}
                              className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={editData?.primaryColor || '#10b981'}
                              onChange={(e) => handleEditChange('primaryColor', e.target.value)}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded font-mono text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Accent Color
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="color"
                              value={editData?.secondaryColor || '#f59e0b'}
                              onChange={(e) => handleEditChange('secondaryColor', e.target.value)}
                              className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={editData?.secondaryColor || '#f59e0b'}
                              onChange={(e) => handleEditChange('secondaryColor', e.target.value)}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded font-mono text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Status Toggle */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Status
                        </label>
                        <div className="flex gap-3">
                          <motion.button
                            onClick={() => handleEditChange('isActive', true)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                              editData?.isActive
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            whileHover={{ scale: 1.02 }}
                          >
                            Active
                          </motion.button>
                          <motion.button
                            onClick={() => handleEditChange('isActive', false)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                              !editData?.isActive
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            whileHover={{ scale: 1.02 }}
                          >
                            Inactive
                          </motion.button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <motion.button
                          onClick={handleSaveEdit}
                          disabled={editLoading}
                          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {editLoading ? 'Saving...' : 'Save Changes'}
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            setEditMode(false)
                            setEditData(tenant)
                            setEditError(null)
                          }}
                          className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    // View Mode
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-2 gap-6"
                    >
                      <motion.div variants={tabVariants}>
                        <p className="text-sm text-slate-600 font-medium mb-1">Owner</p>
                        <p className="text-lg text-slate-900">{tenant.owner.firstName} {tenant.owner.lastName}</p>
                        <p className="text-sm text-slate-500">{tenant.owner.email}</p>
                      </motion.div>

                      <motion.div variants={tabVariants}>
                        <p className="text-sm text-slate-600 font-medium mb-1">Subscription Expires</p>
                        <p className="text-lg text-slate-900">
                          {tenant.subscriptionExpires
                            ? new Date(tenant.subscriptionExpires).toLocaleDateString()
                            : 'No expiration'}
                        </p>
                      </motion.div>

                      <motion.div variants={tabVariants}>
                        <p className="text-sm text-slate-600 font-medium mb-1">Primary Color</p>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded border border-slate-200"
                            style={{ backgroundColor: tenant.primaryColor }}
                          />
                          <span className="font-mono text-sm">{tenant.primaryColor}</span>
                        </div>
                      </motion.div>

                      <motion.div variants={tabVariants}>
                        <p className="text-sm text-slate-600 font-medium mb-1">Accent Color</p>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded border border-slate-200"
                            style={{ backgroundColor: tenant.secondaryColor }}
                          />
                          <span className="font-mono text-sm">{tenant.secondaryColor}</span>
                        </div>
                      </motion.div>

                      <motion.div variants={tabVariants} className="col-span-2">
                        <p className="text-sm text-slate-600 font-medium mb-1">Description</p>
                        <p className="text-slate-900">{tenant.description || 'No description'}</p>
                      </motion.div>

                      {/* Stats */}
                      <motion.div variants={tabVariants} className="col-span-2 grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-emerald-600">{tenant.stats.products}</p>
                          <p className="text-sm text-slate-600">Products</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{tenant.stats.orders}</p>
                          <p className="text-sm text-slate-600">Orders</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{tenant.stats.employees}</p>
                          <p className="text-sm text-slate-600">Employees</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">₱{tenant.stats.monthlyRevenue.toFixed(2)}</p>
                          <p className="text-sm text-slate-600">Monthly</p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && (
                <motion.div
                  key="team"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">Team Members</h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                      <UserPlusIcon className="w-5 h-5" />
                      Add Member
                    </motion.button>
                  </div>

{/* Staff/Team Users Section */}
                  <div className="mb-8">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Staff & Managers</h4>
                  {tenant.team.filter(member => member.user.id !== tenant.owner.id).length === 0 ? (
                    <p className="text-sm py-4 text-slate-500">No staff members yet</p>
                  ) : (
                    <div className="space-y-3">
                      {tenant.team.filter(member => member.user.id !== tenant.owner.id).map((member, idx) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-emerald-300 transition"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            <p className="text-sm text-slate-600">{member.user.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-sm font-medium">
                              {member.role}
                            </span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
</div>

                  {/* Employees Section */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Employees</h4>
                    {!tenant.employees || tenant.employees.length === 0 ? (
                      <p className="text-sm py-4 text-slate-500">No employees registered yet</p>
                    ) : (
                      <div className="space-y-3">
                        {tenant.employees.map((employee, idx) => (
                          <motion.div
                            key={employee.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition"
                          >
                            <div>
                              <p className="font-medium text-slate-900">
                                {employee.firstName} {employee.lastName}
                              </p>
                              <p className="text-sm text-slate-600">{employee.email}</p>
                              {employee.role && (
                                <p className="text-xs text-slate-500 mt-1 capitalize">{employee.role}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                Employee
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {activities.length === 0 ? (
                    <p className="text-center py-8 text-slate-600">No activity yet</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity, idx) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-start justify-between">
                                                          <p className="font-mono text-sm font-semibold text-emerald-600 mb-1">
                                {activity.action}
                              </p>
                                                          <span className="text-xs text-slate-500">
                              {new Date(activity.createdAt).toLocaleDateString()} {new Date(activity.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {activity.details && (
                            <p className="mt-2 p-2 bg-blue-50 text-blue-900 rounded text-sm border border-blue-200">
                              {formatActivityDetails(activity.action, activity.details as Record<string, unknown>)}
                            </p>
                          )}
                        </motion.div>
                      ))}

                      {/* Pagination */}
                      {activityTotalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-200">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActivityPage(Math.max(1, activityPage - 1))}
                            disabled={activityPage === 1}
                            className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50 rounded transition"
                          >
                            <ChevronLeftIcon className="w-5 h-5" />
                          </motion.button>
                          <span className="text-sm text-slate-600 font-medium">
                            Page {activityPage} of {activityTotalPages} ({activityTotal} total)
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActivityPage(Math.min(activityTotalPages, activityPage + 1))}
                            disabled={activityPage === activityTotalPages}
                            className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50 rounded transition"
                          >
                            <ChevronRightIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6"
            >
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-medium text-slate-900">Delete Tenant</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Are you sure you want to delete <strong>{tenant.name}</strong>? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
