'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  CheckIcon,
  XMarkIcon,
  CreditCardIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  UserIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { PageWrapper } from '@/components/PageWrapper'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'payments'>('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // General tab state
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Payment settings state
  const [gcashPhoneNumber, setGcashPhoneNumber] = useState('')
  const [gcashAccountName, setGcashAccountName] = useState('')
  const [gcashQrCodeUrl, setGcashQrCodeUrl] = useState('')
  const [gcashQrCodePreview, setGcashQrCodePreview] = useState<string | null>(null)
  const [qrCodeFileName, setQrCodeFileName] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setEmail(data.email || '')
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setGcashPhoneNumber(data.adminGcashPhoneNumber || '')
        setGcashAccountName(data.adminGcashAccountName || '')
        setGcashQrCodeUrl(data.adminGcashQrCodeUrl || '')
        if (data.adminGcashQrCodeUrl) {
          setGcashQrCodePreview(data.adminGcashQrCodeUrl)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setSaveError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setQrCodeFileName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setGcashQrCodeUrl(result)
        setGcashQrCodePreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveGeneralSettings = async () => {
    if (!email || !firstName || !lastName) {
      setSaveError('Please fill in all required fields')
      setTimeout(() => setSaveError(null), 3000)
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      setSaveError('Passwords do not match')
      setTimeout(() => setSaveError(null), 3000)
      return
    }

    try {
      setSaving(true)
      const payload: Record<string, string | boolean> = {
        email,
        firstName,
        lastName,
      }

      if (newPassword) {
        payload.currentPassword = currentPassword
        payload.newPassword = newPassword
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        const error = await response.json()
        setSaveError(error.message || 'Failed to save settings')
        setTimeout(() => setSaveError(null), 3000)
      }
    } catch (error) {
      console.error('Error:', error)
      setSaveError('Error saving settings')
      setTimeout(() => setSaveError(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePaymentSettings = async () => {
    if (!gcashPhoneNumber || !gcashAccountName || !gcashQrCodeUrl) {
      setSaveError('Please fill in all payment settings fields')
      setTimeout(() => setSaveError(null), 3000)
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminGcashPhoneNumber: gcashPhoneNumber,
          adminGcashAccountName: gcashAccountName,
          adminGcashQrCodeUrl: gcashQrCodeUrl,
        }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setSaveError('Failed to save payment settings')
        setTimeout(() => setSaveError(null), 3000)
      }
    } catch (error) {
      console.error('Error:', error)
      setSaveError('Error saving settings')
      setTimeout(() => setSaveError(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
            <ArrowPathIcon className="w-8 h-8 text-blue-600" />
          </motion.div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-white py-8 px-4 md:px-8 relative">
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-blue-900">Settings</h1>
            <p className="text-blue-700 mt-1">Manage your admin account and payment settings</p>
          </motion.div>

          {/* Toasts */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3"
            >
              <CheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-emerald-800 font-medium">Settings saved successfully!</p>
            </motion.div>
          )}

          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
            >
              <XMarkIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 font-medium">{saveError}</p>
            </motion.div>
          )}

          {/* Tabs Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-6 border-b border-blue-200 bg-white rounded-lg overflow-hidden shadow-sm backdrop-blur-sm"
          >
            {[
              { id: 'general', label: 'General', icon: UserIcon },
              { id: 'payments', label: 'Payment Settings', icon: CreditCardIcon },
            ].map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                onClick={() => setActiveTab(id as 'general' | 'payments')}
                whileHover={{ backgroundColor: '#f0f9ff' }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-all ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-slate-600 hover:text-blue-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </motion.button>
            ))}
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border border-blue-100/60 shadow-sm backdrop-blur-sm p-8"
          >
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-6">Account Information</h2>

                  <div className="space-y-6">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="admin@bizcore.io"
                      />
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        <UserIcon className="w-4 h-4 inline mr-2" />
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Admin"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        <UserIcon className="w-4 h-4 inline mr-2" />
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="User"
                      />
                    </div>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="pt-8 border-t border-blue-200">
                  <h2 className="text-2xl font-bold text-blue-900 mb-6">Change Password</h2>

                  <div className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        <LockClosedIcon className="w-4 h-4 inline mr-2" />
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter current password"
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        <LockClosedIcon className="w-4 h-4 inline mr-2" />
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter new password"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        <LockClosedIcon className="w-4 h-4 inline mr-2" />
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveGeneralSettings}
                  disabled={saving}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </motion.button>
              </div>
            )}

            {/* Payment Settings Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-2">Admin GCash Payment Settings</h2>
                  <p className="text-blue-700 mb-6">Configure the GCash payment details that tenants will see when upgrading their subscription.</p>

                  <div className="space-y-6">
                    {/* GCash Phone Number */}
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        <CreditCardIcon className="w-4 h-4 inline mr-2" />
                        GCash Phone Number
                      </label>
                      <input
                        type="tel"
                        value={gcashPhoneNumber}
                        onChange={(e) => setGcashPhoneNumber(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="09594758859"
                      />
                      <p className="text-sm text-blue-600 mt-1">The GCash number where tenants will send payment</p>
                    </div>

                    {/* Account Name */}
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        <UserIcon className="w-4 h-4 inline mr-2" />
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={gcashAccountName}
                        onChange={(e) => setGcashAccountName(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bizcore Admin"
                      />
                      <p className="text-sm text-blue-600 mt-1">The name associated with the GCash account</p>
                    </div>

                    {/* QR Code Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        <CreditCardIcon className="w-4 h-4 inline mr-2" />
                        GCash QR Code Image
                      </label>
                      <div className="flex gap-6">
                        <div className="flex-1">
                          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleQrCodeUpload}
                              className="hidden"
                              id="qr-upload"
                            />
                            <label htmlFor="qr-upload" className="cursor-pointer">
                              <div className="text-blue-600 font-semibold">Click to upload QR Code</div>
                              <p className="text-sm text-blue-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                              {qrCodeFileName && (
                                <p className="text-sm text-emerald-600 mt-2 font-medium">Selected: {qrCodeFileName}</p>
                              )}
                            </label>
                          </div>
                        </div>

                        {/* QR Code Preview */}
                        {gcashQrCodePreview && (
                          <div className="flex flex-col items-center">
                            <div className="border border-blue-200 rounded-lg p-2 bg-white relative w-32 h-32">
                              <Image 
                                src={gcashQrCodePreview} 
                                alt="QR Code Preview" 
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                            <p className="text-sm text-blue-600 mt-2">Preview</p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-blue-600 mt-2">The QR code image for GCash payments</p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSavePaymentSettings}
                  disabled={saving}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save Payment Settings'
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  )
}
