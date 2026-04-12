'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LockClosedIcon, CheckIcon } from '@heroicons/react/24/outline'

interface ValidationError {
  field?: string
  message: string
}

export function SecurityTabContent() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const validateForm = () => {
    const newErrors: ValidationError[] = []

    if (!formData.currentPassword.trim()) {
      newErrors.push({ field: 'currentPassword', message: 'Current password is required' })
    }

    if (!formData.newPassword.trim()) {
      newErrors.push({ field: 'newPassword', message: 'New password is required' })
    }

    if (formData.newPassword.length < 8) {
      newErrors.push({ 
        field: 'newPassword', 
        message: 'Password must be at least 8 characters long' 
      })
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(formData.newPassword)
    const hasLowerCase = /[a-z]/.test(formData.newPassword)
    const hasNumbers = /\d/.test(formData.newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      newErrors.push({
        field: 'newPassword',
        message: 'Password must include uppercase, lowercase, numbers, and special characters'
      })
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.push({ field: 'confirmPassword', message: 'Please confirm your password' })
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' })
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.push({ 
        message: 'New password must be different from your current password' 
      })
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage('')

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // TODO: Wire up to /api/customer/change-password endpoint
      // When implemented, ensure the endpoint:
      // 1. Validates current password against stored hash
      // 2. Hashes the new password securely
      // 3. Updates the customer's password
      // 4. Returns proper error messages if validation fails
      const response = await fetch('/api/customer/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      if (!response.ok) {
        const data = await response.json()
        setErrors([{ message: data.error || 'Failed to change password' }])
        return
      }

      setSuccessMessage('Password changed successfully!')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors([])

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch {
      setErrors([{ message: 'An error occurred. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const getFieldError = (fieldName: string) => {
    return errors.find((e) => e.field === fieldName)?.message
  }

  const getGeneralErrors = () => {
    return errors.filter((e) => !e.field)
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Keep your account safe and secure</p>
      </div>

      {/* General Error Messages */}
      <AnimatePresence>
        {getGeneralErrors().map((error, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm font-medium text-red-700">{error.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <CheckIcon className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-700">{successMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-900 mb-2">
            Current Password
          </label>
          <input
            id="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 transition-all outline-none focus:ring-2 focus:ring-offset-0 ${
              getFieldError('currentPassword')
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-gray-900'
            }`}
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
          <AnimatePresence>
            {getFieldError('currentPassword') && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-2 text-sm text-red-600 font-medium"
              >
                {getFieldError('currentPassword')}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-900 mb-2">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 transition-all outline-none focus:ring-2 focus:ring-offset-0 ${
              getFieldError('newPassword')
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-gray-900'
            }`}
            placeholder="Create a strong new password"
            autoComplete="new-password"
          />
          <AnimatePresence>
            {getFieldError('newPassword') && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-2 text-sm text-red-600 font-medium"
              >
                {getFieldError('newPassword')}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Password Requirements */}
          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">Password Requirements:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ At least 8 characters long</li>
              <li>✓ Contains uppercase letters (A-Z)</li>
              <li>✓ Contains lowercase letters (a-z)</li>
              <li>✓ Contains numbers (0-9)</li>
              <li>✓ Contains special characters (!@#$%^&*, etc.)</li>
            </ul>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 transition-all outline-none focus:ring-2 focus:ring-offset-0 ${
              getFieldError('confirmPassword')
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-gray-900'
            }`}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
          />
          <AnimatePresence>
            {getFieldError('confirmPassword') && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-2 text-sm text-red-600 font-medium"
              >
                {getFieldError('confirmPassword')}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <div className="pt-6 flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <LockClosedIcon className="w-4 h-4" />
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>

      {/* Security Info */}
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Password Security</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Your password is encrypted and never stored in plain text</li>
          <li>• Use a unique password that you don&apos;t use on other sites</li>
          <li>• Never share your password with anyone</li>
          <li>• Change your password regularly to keep your account secure</li>
          <li>• If you suspect unauthorized access, change your password immediately</li>
        </ul>
      </div>
    </div>
  )
}
