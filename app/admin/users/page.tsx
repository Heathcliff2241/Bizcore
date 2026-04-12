'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import { exportFromAPI } from '@/lib/csv-export'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'tenant_owner' | 'tenant_user' | 'customer' | 'employee' | 'user' | 'tenant'
  isActive: boolean
  createdAt: string
  lastLogin?: string
  tenant?: {
    id: string
    name: string
    subdomain: string
  }
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
}

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

const ROLES = [
  { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800' },
  { value: 'tenant_owner', label: 'Tenant Owner', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'tenant_user', label: 'Tenant User', color: 'bg-blue-100 text-blue-800' },
  { value: 'customer', label: 'Customer', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'employee', label: 'Employee', color: 'bg-purple-100 text-purple-800' },
  { value: 'user', label: 'User', color: 'bg-slate-100 text-slate-800' },
  { value: 'tenant', label: 'Tenant', color: 'bg-orange-100 text-orange-800' },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<Partial<User>>({})
  const [limit] = useState(10)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, roleFilter, statusFilter])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics?period=month')
      if (response.ok) {
        const data: AnalyticsData = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        role: roleFilter,
        status: statusFilter,
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')

      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setTotal(data.total)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) throw new Error('Failed to update user')

      setUsers(
        users.map((u) =>
          u.id === editingUser.id ? { ...u, ...editForm } : u
        )
      )
      setEditingUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      setDeleting(userId)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete user')

      setUsers(users.filter((u) => u.id !== userId))
      setTotal(total - 1)
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setDeleting(null)
    }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      // Build query params with current filters
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
      })

      const result = await exportFromAPI(
        `/api/admin/export/users?${params}`,
        `users_export_${new Date().toISOString().split('T')[0]}`
      )

      if (!result.success) {
        alert(result.error || 'Failed to export users')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export users')
    } finally {
      setExporting(false)
    }
  }

  const getRoleColor = (role: string) => {
    return ROLES.find((r) => r.value === role)?.color || 'bg-slate-100 text-slate-800'
  }

  const totalPages = Math.ceil(total / limit)

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

      {/* Static background gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-transparent to-indigo-900" />
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-900">Users Management</h1>
            <p className="text-blue-700 mt-2">Manage all system users, roles, and permissions</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting || users.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Total Users</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{analyticsData?.users || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Active Users</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {analyticsData?.users || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Customers</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {users.filter((u) => u.role === 'customer').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Employees</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {users.filter((u) => u.role === 'employee').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Tenants</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {analyticsData?.tenants || 0}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Roles</option>
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Reset */}
            <button
              onClick={() => {
                setSearch('')
                setRoleFilter('')
                setStatusFilter('')
                setPage(1)
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Reset
            </button>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-blue-100/50 overflow-hidden"
        >
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-50 border-b border-blue-100/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                        Business/Tenant
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b border-blue-100/50 hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-blue-900">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                              user.role
                            )}`}
                          >
                            {ROLES.find((r) => r.value === user.role)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {user.tenant ? (
                            <div>
                              <p className="font-medium">{user.tenant.name}</p>
                              <p className="text-slate-500">/{user.tenant.subdomain}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              user.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEditClick(user)}
                              className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deleting === user.id}
                              className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-blue-100/50">
                <p className="text-sm text-slate-600">
                  Page {page} of {totalPages} | Total {total} users
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingUser(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Edit User</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={editForm.firstName || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, firstName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editForm.lastName || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lastName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={editForm.role || ''}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      role: e.target.value as User['role'],
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={editForm.isActive ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      isActive: e.target.value === 'active',
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Create User Modal */}
    </motion.div>
  )
}
