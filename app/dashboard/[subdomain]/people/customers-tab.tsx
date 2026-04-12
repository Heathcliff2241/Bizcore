'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Users, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../../theme-context'
import { exportFromAPI } from '@/lib/csv-export'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  createdAt: string
}

interface Theme {
  primary: string
  secondary: string
  accent?: string
  background?: string
  surface?: string
  text?: string
}

const defaultTheme: Theme = {
  primary: '#10B981',
  secondary: '#34D399',
  accent: '#6EE7B7',
  background: '#f9fafb',
  surface: '#f3f4f6',
  text: '#111827'
}

export default function CustomersTabContent({ subdomain: propSubdomain }: { subdomain?: string }) {
  const params = useParams()
  const paramSubdomain = typeof params?.subdomain === 'string' ? params.subdomain : ''
  const subdomain = propSubdomain || paramSubdomain
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const { theme: contextTheme } = useTheme()
  const theme = contextTheme || defaultTheme

  const handleExportCSV = async () => {
    if (!subdomain) {
      alert('Subdomain is required for export')
      return
    }

    setExporting(true)
    try {
      const result = await exportFromAPI(
        `/api/tenant/export/customers?subdomain=${subdomain}`,
        `customers_export_${subdomain}_${new Date().toISOString().split('T')[0]}`
      )

      if (!result.success) {
        alert(result.error || 'Failed to export customers')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export customers')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`/api/customers?subdomain=${subdomain}`)
        if (!response.ok) throw new Error('Failed to fetch customers')
        const data = await response.json()
        // Handle both array and object responses
        const customersList = Array.isArray(data) ? data : data?.data?.customers || []
        setCustomers(customersList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (subdomain) {
      fetchCustomers()
    }
  }, [subdomain])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading customers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">Error loading customers</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      style={{ backgroundColor: theme.background || '#f9fafb' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex items-start justify-between gap-6"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-lg"
            style={{ backgroundColor: `${theme.primary}15` }}
          >
            <Users
              className="w-6 h-6"
              style={{ color: theme.primary }}
            />
          </div>
          <div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: theme.text || '#111827' }}
            >
              Customers
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
            >
              View all your customers ({customers.length})
            </p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting || customers.length === 0}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          style={{
            borderColor: `${theme.primary}40`,
            color: theme.primary,
            backgroundColor: 'white',
          }}
        >
          <Download className="w-5 h-5" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </motion.div>

      {customers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center py-16 rounded-2xl"
          style={{
            backgroundColor: `${theme.primary}05`,
            borderColor: `${theme.primary}20`,
            border: '2px dashed'
          }}
        >
          <Users
            className="w-16 h-16 mx-auto mb-4 opacity-30"
            style={{ color: theme.primary }}
          />
          <p
            className="font-semibold text-lg"
            style={{ color: theme.text || '#111827' }}
          >
            No customers yet
          </p>
          <p
            className="text-sm mt-2"
            style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
          >
            Customers will appear here once they create accounts and make purchases
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl overflow-hidden backdrop-blur-xl"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}05, ${theme.secondary}05)`,
            borderColor: `${theme.primary}20`,
            border: '1px solid',
            boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
          }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: `${theme.primary}10` }}>
              <thead style={{ backgroundColor: `${theme.primary}08` }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
                  >
                    Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
                  >
                    Email
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
                  >
                    Phone
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
                  >
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: `${theme.primary}10` }}>
                {customers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="transition-colors duration-150"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${theme.primary}05`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-semibold text-white text-sm"
                          style={{ backgroundColor: theme.primary }}
                        >
                          {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <p
                            className="text-sm font-medium text-gray-900"
                          >
                            {customer.firstName} {customer.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p
                        className="text-sm"
                        style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
                      >
                        {customer.phone || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p
                        className="text-sm"
                        style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
                      >
                        {formatDate(customer.createdAt)}
                      </p>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
