'use client'

import { useState, useEffect, useCallback, useMemo, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  EyeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  XMarkIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

import { useSettings } from '@/lib/settings-context'

interface CustomerRecord {
  id: number
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
}

interface CustomerDetails extends CustomerRecord {
  address: Record<string, unknown> | null
  notes: string | null
  orders: Array<{
    id: number
    totalAmount: number
    createdAt: string
    status: string
  }>
}

interface CustomerStats {
  total_customers: number
  active_customers: number
  new_this_month: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [stats, setStats] = useState<CustomerStats>({
    total_customers: 0,
    active_customers: 0,
    new_this_month: 0
  })

  const params = useParams<{ subdomain?: string | string[] }>()
  const { settings } = useSettings()
  const theme = {
    primary: settings.brandColors.primary,
    secondary: settings.brandColors.secondary,
    accent: settings.brandColors.accent,
    background: settings.brandColors.background,
    surface: settings.brandColors.surface,
    text: settings.brandColors.text
  }

  const ringStyle = useMemo(() => ({ '--tw-ring-color': theme.primary } as CSSProperties), [theme.primary])

  const subdomain = useMemo(() => {
    const raw = params?.subdomain
    return Array.isArray(raw) ? raw[0] : raw ?? ''
  }, [params])

  const querySuffix = useMemo(
    () => (subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : ''),
    [subdomain]
  )

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers${querySuffix}`)
      if (!response.ok) throw new Error('Failed to fetch customers')

      const data = await response.json()
      if (data.success) {
        setCustomers(data.data.customers || [])
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }, [querySuffix])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/customers/stats${querySuffix}`)
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch customer stats:', error)
    }
  }, [querySuffix])

  useEffect(() => {
    fetchCustomers()
    fetchStats()
  }, [fetchCustomers, fetchStats])

  const viewCustomer = async (customerId: number) => {
    try {
      setLoadingDetails(true)
      const response = await fetch(`/api/customers/${customerId}${querySuffix}`)
      if (!response.ok) throw new Error('Failed to fetch customer details')

      const data = await response.json()
      if (data.success) {
        setSelectedCustomer(data.data.customer)
      }
    } catch (error) {
      console.error('Failed to fetch customer details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase()
      const search = searchTerm.toLowerCase()
      return (
        fullName.includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.includes(searchTerm)
      )
    })
  }, [customers, searchTerm])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toFixed(2)}`
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex-1 p-8 bg-gray-50"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">
            {subdomain ? `${subdomain} Customers` : 'Customers'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view customer information for {subdomain || 'your store'}
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.3 }}
          className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}10, ${theme.secondary}10)`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_customers}</p>
            </div>
            <div
              className="p-3 rounded-full"
              style={{ backgroundColor: `${theme.primary}20` }}
            >
              <UserIcon className="w-6 h-6" style={{ color: theme.primary }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.3 }}
          className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${theme.secondary}10, ${theme.accent}10)`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Customers</p>
              <p className="text-2xl font-bold mt-1" style={{ color: theme.secondary }}>{stats.active_customers}</p>
            </div>
            <div
              className="p-3 rounded-full"
              style={{ backgroundColor: `${theme.secondary}20` }}
            >
              <UserIcon className="w-6 h-6" style={{ color: theme.secondary }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.3 }}
          className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${theme.accent}10, ${theme.primary}10)`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">New This Month</p>
              <p className="text-2xl font-bold mt-1" style={{ color: theme.accent }}>{stats.new_this_month}</p>
            </div>
            <div
              className="p-3 rounded-full"
              style={{ backgroundColor: `${theme.accent}20` }}
            >
              <UserIcon className="w-6 h-6" style={{ color: theme.accent }} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Search Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-6"
      >
        <div className="relative">
          <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 top-3 left-3" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
            style={ringStyle}
          />
        </div>
      </motion.div>

      {/* Customers Table */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="relative">
            <motion.div
              className="w-12 h-12 border-4 border-gray-200 rounded-full"
              style={{ borderTopColor: theme.primary }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          whileHover={{ y: -4 }}
          className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}05, ${theme.secondary}05)`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="flex-shrink-0 h-10 w-10"
                        >
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${theme.primary}20` }}
                          >
                            <UserIcon className="h-6 w-6" style={{ color: theme.primary }} />
                          </div>
                        </motion.div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.firstName} {customer.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email || 'No email'}</div>
                      <div className="text-sm text-gray-500">{customer.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => viewCustomer(customer.id)}
                        className="font-medium flex items-center gap-1 transition-colors"
                        style={{ color: theme.primary }}
                      >
                        <EyeIcon className="w-4 h-4" />
                        View
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Customer Details Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl p-6 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              style={{
                backdropFilter: 'blur(20px)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.98))'
              }}
            >
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    className="w-12 h-12 border-4 border-gray-200 rounded-full"
                    style={{ borderTopColor: theme.primary }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="flex-shrink-0 h-16 w-16"
                      >
                        <div
                          className="h-16 w-16 rounded-full flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: `${theme.primary}20` }}
                        >
                          <UserIcon className="h-8 w-8" style={{ color: theme.primary }} />
                        </div>
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900">
                          {selectedCustomer.firstName} {selectedCustomer.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Customer since {formatDate(selectedCustomer.createdAt)}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedCustomer(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </motion.button>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-4 rounded-xl backdrop-blur-sm"
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary}08)`
                      }}
                    >
                      <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {selectedCustomer.email && (
                          <div className="flex items-center gap-3">
                            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="text-sm text-gray-900">{selectedCustomer.email}</p>
                            </div>
                          </div>
                        )}
                        {selectedCustomer.phone && (
                          <div className="flex items-center gap-3">
                            <PhoneIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <p className="text-sm text-gray-900">{selectedCustomer.phone}</p>
                            </div>
                          </div>
                        )}
                        {selectedCustomer.address && (
                          <div className="flex items-center gap-3">
                            <MapPinIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Address</p>
                              <p className="text-sm text-gray-900">
                                {JSON.stringify(selectedCustomer.address)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Order History */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 rounded-xl backdrop-blur-sm"
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary}08)`
                      }}
                    >
                      <h4 className="font-semibold text-gray-900 mb-3">Order History</h4>
                      {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                        <div className="space-y-2">
                          {selectedCustomer.orders.map((order, idx) => (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex justify-between items-center p-3 bg-white rounded-lg"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Order #{order.id}
                                </p>
                                <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(order.totalAmount)}
                                </p>
                                <span className="text-xs capitalize px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                  {order.status}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No orders yet.</p>
                      )}
                    </motion.div>

                    {/* Notes */}
                    {selectedCustomer.notes && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 rounded-xl backdrop-blur-sm"
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary}08)`
                        }}
                      >
                        <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                        <p className="text-sm text-gray-700">{selectedCustomer.notes}</p>
                      </motion.div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
