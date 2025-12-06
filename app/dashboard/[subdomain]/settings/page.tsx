'use client'

import { useState, useEffect, useCallback, useMemo, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'next/navigation'
import {
  PaintBrushIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BuildingStorefrontIcon,
  CreditCardIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'

import { useSettings } from '@/lib/settings-context'

interface BrandColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
}

interface BusinessInfo {
  businessName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface PaymentSettings {
  gcashNumber: string
  gcashQrCode: string
}

interface TaxSettings {
  defaultTaxPercent: number
}

interface Settings {
  brandColors: BrandColors
  businessInfo: BusinessInfo
  paymentSettings?: PaymentSettings
  tax?: TaxSettings
}

interface SaveStatus {
  type: 'success' | 'error'
  message: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    brandColors: {
      primary: '#10B981',
      secondary: '#34D399',
      accent: '#6EE7B7',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827'
    },
    businessInfo: {
      businessName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    paymentSettings: {
      gcashNumber: '',
      gcashQrCode: ''
    },
    tax: {
      defaultTaxPercent: 1
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('brand')
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null)

  const params = useParams<{ subdomain?: string | string[] }>()
  const { settings: contextSettings } = useSettings()
  const theme = {
    primary: contextSettings.brandColors.primary,
    secondary: contextSettings.brandColors.secondary,
    accent: contextSettings.brandColors.accent,
    background: contextSettings.brandColors.background,
    surface: contextSettings.brandColors.surface,
    text: contextSettings.brandColors.text
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

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/settings${querySuffix}`)
      if (!response.ok) throw new Error('Failed to fetch settings')

      const data = await response.json()
      if (data.success && data.data) {
        const settingsData = data.data as Record<string, unknown>
        const mergedSettings: Settings = {
          brandColors: (settingsData.brandColors as BrandColors) || {
            primary: '#10B981',
            secondary: '#34D399',
            accent: '#6EE7B7',
            background: '#FFFFFF',
            surface: '#F9FAFB',
            text: '#111827'
          },
          businessInfo: (settingsData.businessInfo as BusinessInfo) || {
            businessName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
          paymentSettings: (settingsData.paymentSettings as PaymentSettings) || {
            gcashNumber: '',
            gcashQrCode: ''
          },
          tax: (settingsData.tax as TaxSettings) || {
            defaultTaxPercent: 1
          }
        }
        setSettings(mergedSettings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }, [querySuffix])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = async (newSettings: Settings) => {
    try {
      setSaving(true)
      setSaveStatus(null)

      const response = await fetch(`/api/settings${querySuffix}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: newSettings })
      })

      const data = await response.json()
      if (data.success) {
        const responseData = data.data as Record<string, unknown>
        const mergedSettings: Settings = {
          brandColors: (responseData.brandColors as BrandColors) || newSettings.brandColors,
          businessInfo: (responseData.businessInfo as BusinessInfo) || newSettings.businessInfo,
          paymentSettings: (responseData.paymentSettings as PaymentSettings) || newSettings.paymentSettings,
          tax: (responseData.tax as TaxSettings) || newSettings.tax
        }
        setSettings(mergedSettings)
        setSaveStatus({ type: 'success', message: 'Settings saved successfully!' })
        // Refetch settings to ensure we have the latest data from server
        setTimeout(() => {
          fetchSettings()
          setSaveStatus(null)
        }, 500)
      } else {
        setSaveStatus({ type: 'error', message: 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      setSaveStatus({ type: 'error', message: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleColorChange = (colorKey: keyof BrandColors, value: string) => {
    const newSettings = {
      ...settings,
      brandColors: {
        ...settings.brandColors,
        [colorKey]: value
      }
    }
    setSettings(newSettings)
  }

  const handleBusinessInfoChange = (infoKey: keyof BusinessInfo, value: string) => {
    const newSettings = {
      ...settings,
      businessInfo: {
        ...settings.businessInfo,
        [infoKey]: value
      }
    }
    setSettings(newSettings)
  }

  const tabs = [
    { id: 'brand', label: 'Brand Colors', icon: PaintBrushIcon },
    { id: 'business', label: 'Business Info', icon: BuildingStorefrontIcon },
    { id: 'tax', label: 'Tax Settings', icon: CalculatorIcon },
    { id: 'payment', label: 'Payment Settings', icon: CreditCardIcon }
  ]

  if (loading) {
    return (
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 p-8 bg-gray-50"
      >
        <div className="flex items-center justify-center py-12">
          <motion.div
            className="w-12 h-12 border-4 border-gray-200 rounded-full"
            style={{ borderTopColor: theme.primary }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.main>
    )
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
            {subdomain ? `${subdomain} Settings` : 'Settings'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Customize your brand and website settings for {subdomain || 'your store'}
          </p>
        </div>
      </motion.div>

      {/* Save Status */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 backdrop-blur-sm ${
              saveStatus.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {saveStatus.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5" />
            )}
            <span className="font-medium">{saveStatus.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        whileHover={{ y: -4 }}
        className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden backdrop-blur-sm"
        style={{
          background: `linear-gradient(135deg, ${theme.primary}03, ${theme.secondary}03)`,
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  style={{
                    borderBottomColor: isActive ? theme.primary : 'transparent'
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Brand Colors Tab */}
          {activeTab === 'brand' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <SparklesIcon className="w-5 h-5" style={{ color: theme.primary }} />
                  <h3 className="text-lg font-semibold text-gray-900">Brand Colors</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Customize your brand colors. Changes will apply across your entire dashboard in
                  real-time.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(Object.entries(settings.brandColors) as [keyof BrandColors, string][]).map(
                    ([key, value], index) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        className="space-y-2 p-4 rounded-xl transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${value}10, ${value}05)`
                        }}
                      >
                        <label className="block text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <div className="flex items-center gap-3">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => handleColorChange(key, e.target.value)}
                              className="w-14 h-14 rounded-xl border-2 border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                            />
                          </motion.div>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                            style={ringStyle}
                          />
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Update your business details and contact information.
                </p>
                <div className="space-y-6">
                  {/* Business Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-medium text-gray-700">Business Name</label>
                    <input
                      type="text"
                      value={settings.businessInfo.businessName}
                      onChange={(e) => handleBusinessInfoChange('businessName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      placeholder="Enter your business name"
                      style={ringStyle}
                    />
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={settings.businessInfo.email}
                      onChange={(e) => handleBusinessInfoChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      placeholder="Enter your business email"
                      style={ringStyle}
                    />
                  </motion.div>

                  {/* Phone */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={settings.businessInfo.phone}
                      onChange={(e) => handleBusinessInfoChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      placeholder="Enter your business phone"
                      style={ringStyle}
                    />
                  </motion.div>

                  {/* Address */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-medium text-gray-700">Street Address</label>
                    <input
                      type="text"
                      value={settings.businessInfo.address}
                      onChange={(e) => handleBusinessInfoChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      placeholder="Enter street address"
                      style={ringStyle}
                    />
                  </motion.div>

                  {/* City, State, Zip */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        value={settings.businessInfo.city}
                        onChange={(e) => handleBusinessInfoChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                        placeholder="City"
                        style={ringStyle}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <input
                        type="text"
                        value={settings.businessInfo.state}
                        onChange={(e) => handleBusinessInfoChange('state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                        placeholder="State"
                        style={ringStyle}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                      <input
                        type="text"
                        value={settings.businessInfo.zipCode}
                        onChange={(e) => handleBusinessInfoChange('zipCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                        placeholder="Zip Code"
                        style={ringStyle}
                      />
                    </motion.div>
                  </div>

                  {/* Country */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      value={settings.businessInfo.country}
                      onChange={(e) => handleBusinessInfoChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      placeholder="Country"
                      style={ringStyle}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tax Settings Tab */}
          {activeTab === 'tax' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CalculatorIcon className="w-5 h-5" style={{ color: theme.primary }} />
                  <h3 className="text-lg font-semibold text-gray-900">Tax Settings</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Configure default tax rates for your products. This can be overridden per product.
                </p>

                <div className="space-y-6">
                  {/* Default Tax Percent */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-medium text-gray-700">Default Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={settings.tax?.defaultTaxPercent || 1}
                      onChange={(e) => setSettings({
                        ...settings,
                        tax: {
                          defaultTaxPercent: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      placeholder="Enter tax percentage"
                      style={ringStyle}
                    />
                    <p className="text-xs text-gray-500">Applied to all products unless overridden individually</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Settings Tab */}
          {activeTab === 'payment' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCardIcon className="w-5 h-5" style={{ color: theme.primary }} />
                  <h3 className="text-lg font-semibold text-gray-900">GCash Payment Settings</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Configure your GCash payment details that customers will see during checkout.
                </p>

                <div className="space-y-6">
                  {/* GCash Number */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-medium text-gray-700">GCash Phone Number</label>
                    <input
                      type="tel"
                      value={settings.paymentSettings?.gcashNumber || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        paymentSettings: {
                          ...(settings.paymentSettings || { gcashNumber: '', gcashQrCode: '' }),
                          gcashNumber: e.target.value
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      placeholder="09123456789"
                      style={ringStyle}
                    />
                    <p className="text-xs text-gray-500">Customers will see this number to send GCash payment</p>
                  </motion.div>

                  {/* GCash QR Code Upload */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-medium text-gray-700">GCash QR Code</label>
                    <div className="flex justify-center">
                      <div className="w-32 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setSettings({
                                  ...settings,
                                  paymentSettings: {
                                    ...(settings.paymentSettings || { gcashNumber: '', gcashQrCode: '' }),
                                    gcashQrCode: reader.result as string
                                  }
                                })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="hidden"
                          id="qr-code-upload"
                        />
                        <label htmlFor="qr-code-upload" className="cursor-pointer block">
                          {settings.paymentSettings?.gcashQrCode ? (
                            <div className="space-y-3">
                              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={settings.paymentSettings.gcashQrCode}
                                  alt="GCash QR Code"
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                              <p className="text-xs text-center text-gray-600">Click to change</p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setSettings({
                                    ...settings,
                                    paymentSettings: {
                                      ...(settings.paymentSettings || { gcashNumber: '', gcashQrCode: '' }),
                                      gcashQrCode: ''
                                    }
                                  })
                                }}
                                className="w-full py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <svg className="w-8 h-8 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-xs text-gray-600 font-medium">Click to upload</p>
                              <p className="text-xs text-gray-500">PNG, JPG</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Customers will see this QR code to scan and pay</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 pt-6 border-t border-gray-200"
          >
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateSettings(settings)}
              disabled={saving}
              className="px-6 py-3 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg transition-all"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
              }}
            >
              {saving ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.main>
  )
}
