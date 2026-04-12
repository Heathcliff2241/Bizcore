'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  createdAt?: string | Date
}

interface ProfileTabContentProps {
  customer: Customer
}

export function ProfileTabContent({ customer }: ProfileTabContentProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || ''
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!customer?.id) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      setSuccess(true)
      setIsEditing(false)
      
      // Show success message for 3 seconds
      setTimeout(() => setSuccess(false), 3000)
      
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: customer?.firstName || '',
      lastName: customer?.lastName || '',
      email: customer?.email || '',
      phone: customer?.phone || ''
    })
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          <p className="text-sm text-gray-500 mt-1">Update your personal details</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {/* Error Message */}
      <AnimatedAlert type="error" message={error} />

      {/* Success Message */}
      <AnimatedAlert type="success" message={success ? 'Profile updated successfully!' : null} />

      {isEditing ? (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave() }}>
          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">Email cannot be changed after registration</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Full Name */}
          <div className="pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Full Name</p>
            <p className="text-lg font-semibold text-gray-900">
              {formData.firstName} {formData.lastName}
            </p>
          </div>

          {/* Email */}
          <div className="pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Email Address</p>
            <p className="text-lg font-semibold text-gray-900">{formData.email}</p>
          </div>

          {/* Phone */}
          <div className="pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Phone Number</p>
            <p className="text-lg font-semibold text-gray-900">
              {formData.phone || '—'}
            </p>
          </div>

          {/* Member Since */}
          {customer?.createdAt && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Member Since</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(customer.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnimatedAlert({ type, message }: { type: 'error' | 'success'; message: string | null }) {
  if (!message) return null

  const isError = type === 'error'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 rounded-lg border ${
        isError
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-green-50 border-green-200 text-green-700'
      }`}
    >
      <p className="text-sm font-medium">{message}</p>
    </motion.div>
  )
}
