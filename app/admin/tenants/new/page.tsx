'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
}

interface FormErrors {
  name?: string
  subdomain?: string
  ownerId?: string
  plan?: string
}

const PLANS = [
  { value: 'free', label: 'Free', description: 'Up to 3 employees' },
  { value: 'basic', label: 'Basic', description: 'Up to 10 employees' },
  { value: 'premium', label: 'Premium', description: 'Up to 50 employees' },
  { value: 'enterprise', label: 'Enterprise', description: 'Unlimited employees' },
]

export default function CreateTenantPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [fetchingUsers, setFetchingUsers] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    ownerId: '',
    plan: 'premium',
    primaryColor: '#10b981',
    accentColor: '#f59e0b',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setFetchingUsers(true)
    try {
      const response = await fetch('/api/admin/users/list')
      const data = await response.json()
      setUsers(data.data || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setFetchingUsers(false)
    }
  }

  const validateSubdomain = (value: string) => {
    if (!value) return false
    // Check format: lowercase, alphanumeric and hyphens, 3-50 chars
    const isValid = /^[a-z0-9-]{3,50}$/.test(value)
    return isValid
  }

  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!validateSubdomain(subdomain)) {
      setSubdomainAvailable(false)
      return
    }

    setCheckingSubdomain(true)
    try {
      const response = await fetch(`/api/admin/tenants/check-subdomain?subdomain=${subdomain}`)
      const data = await response.json()
      setSubdomainAvailable(data.available)
    } catch (error) {
      console.error('Failed to check subdomain:', error)
      setSubdomainAvailable(null)
    } finally {
      setCheckingSubdomain(false)
    }
  }

  const handleSubdomainChange = (value: string) => {
    const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setFormData({ ...formData, subdomain: formatted })

    if (formatted.length >= 3) {
      checkSubdomainAvailability(formatted)
    } else {
      setSubdomainAvailable(null)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Business name must be at least 3 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Business name must be less than 100 characters'
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain is required'
    } else if (!validateSubdomain(formData.subdomain)) {
      newErrors.subdomain = 'Subdomain must be 3-50 characters, lowercase, alphanumeric with hyphens only'
    } else if (!subdomainAvailable) {
      newErrors.subdomain = 'This subdomain is already taken'
    }

    if (!formData.ownerId) {
      newErrors.ownerId = 'Owner is required'
    }

    if (!formData.plan) {
      newErrors.plan = 'Plan is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create tenant')
      }

      const data = await response.json()
      setSuccessMessage('Tenant created successfully! Redirecting...')

      setTimeout(() => {
        router.push(`/admin/tenants/${data.id}`)
      }, 1500)
    } catch (error) {
      console.error('Failed to create tenant:', error)
      setErrors({ ...errors, name: 'Failed to create tenant. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Link href="/admin/tenants" className="flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium">
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Tenants
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-blue-900">Create New Tenant</h1>
        <p className="text-blue-700 mt-2">Add a new business account to BizCore</p>
      </motion.div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3"
        >
          <CheckIcon className="w-5 h-5 text-blue-600" />
          <p className="text-blue-800 font-medium">{successMessage}</p>
        </motion.div>
      )}

      {/* Form Card */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="bg-white border border-blue-100/50 rounded-lg p-8 backdrop-blur-sm space-y-6"
      >
        {/* Business Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-blue-900 mb-2">
            Business Name <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Coffee Shop, Restaurant Name"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'
            }`}
          />
          {errors.name && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-600 text-sm mt-2 flex items-center gap-1"
            >
              <ExclamationCircleIcon className="w-4 h-4" />
              {errors.name}
            </motion.p>
          )}
        </div>

        {/* Subdomain */}
        <div>
          <label htmlFor="subdomain" className="block text-sm font-semibold text-blue-900 mb-2">
            Subdomain <span className="text-red-600">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="subdomain"
              type="text"
              value={formData.subdomain}
              onChange={(e) => handleSubdomainChange(e.target.value)}
              placeholder="e.g., coffee-shop"
              className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                errors.subdomain ? 'border-red-500 bg-red-50' : 'border-slate-200'
              }`}
            />
            {checkingSubdomain && (
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            )}
            {!checkingSubdomain && subdomainAvailable === true && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center"
              >
                <CheckIcon className="w-6 h-6 text-emerald-600" />
              </motion.div>
            )}
            {!checkingSubdomain && subdomainAvailable === false && formData.subdomain.length >= 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"
              >
                <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
              </motion.div>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            URL: {formData.subdomain || 'your-subdomain'}.bizcore.com
          </p>
          {errors.subdomain && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-600 text-sm mt-2 flex items-center gap-1"
            >
              <ExclamationCircleIcon className="w-4 h-4" />
              {errors.subdomain}
            </motion.p>
          )}
        </div>

        {/* Owner */}
        <div>
          <label htmlFor="owner" className="block text-sm font-semibold text-blue-900 mb-2">
            Owner <span className="text-red-600">*</span>
          </label>
          <select
            id="owner"
            value={formData.ownerId}
            onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
            disabled={fetchingUsers}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer bg-white ${
              errors.ownerId ? 'border-red-500 bg-red-50' : 'border-slate-200'
            }`}
          >
            <option value="">
              {fetchingUsers ? 'Loading users...' : 'Select an owner'}
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
          {errors.ownerId && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-600 text-sm mt-2 flex items-center gap-1"
            >
              <ExclamationCircleIcon className="w-4 h-4" />
              {errors.ownerId}
            </motion.p>
          )}
        </div>

        {/* Subscription Plan */}
        <div>
          <label className="block text-sm font-semibold text-blue-900 mb-3">
            Subscription Plan <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map((plan) => (
              <motion.label
                key={plan.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan.value}
                  checked={formData.plan === plan.value}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="sr-only"
                />
                <div
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.plan === plan.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.plan === plan.value
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {formData.plan === plan.value && (
                        <CheckIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <p className="font-semibold text-slate-900">{plan.label}</p>
                  </div>
                  <p className="text-sm text-slate-600 ml-6">{plan.description}</p>
                </div>
              </motion.label>
            ))}
          </div>
          {errors.plan && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-600 text-sm mt-2 flex items-center gap-1"
            >
              <ExclamationCircleIcon className="w-4 h-4" />
              {errors.plan}
            </motion.p>
          )}
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-semibold text-blue-900 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-16 h-16 rounded-lg border border-slate-200 cursor-pointer"
              />
              <div>
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-24 px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">Hex code</p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="accentColor" className="block text-sm font-semibold text-blue-900 mb-2">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="accentColor"
                type="color"
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                className="w-16 h-16 rounded-lg border border-slate-200 cursor-pointer"
              />
              <div>
                <input
                  type="text"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-24 px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">Hex code</p>
              </div>
            </div>
          </div>
        </div>

        {/* Color Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-slate-900 mb-3">Preview</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-12 h-12 rounded-lg shadow-md"
                style={{ backgroundColor: formData.primaryColor }}
              ></div>
              <div>
                <p className="text-xs text-slate-600">Primary</p>
                <p className="text-sm font-mono font-semibold text-slate-900">{formData.primaryColor}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-12 h-12 rounded-lg shadow-md"
                style={{ backgroundColor: formData.accentColor }}
              ></div>
              <div>
                <p className="text-xs text-slate-600">Accent</p>
                <p className="text-sm font-mono font-semibold text-slate-900">{formData.accentColor}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-200">
          <Link href="/admin/tenants">
            <button
              type="button"
              className="px-6 py-3 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting || !subdomainAvailable}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Tenant'}
          </motion.button>
        </div>
      </motion.form>
    </div>
  )
}
