'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Cog6ToothIcon,
  BellIcon,
  KeyIcon,
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface Settings {
  appName: string
  appLogo: string
  appEmail: string
  supportEmail: string
  primaryColor: string
  secondaryColor: string
  emailNotifications: boolean
  smsNotifications: boolean
  maintenanceMode: boolean
  apiRateLimit: number
  adminGcashPhoneNumber?: string
  adminGcashAccountName?: string
  adminGcashQrCodeUrl?: string
}

const DEFAULT_SETTINGS: Settings = {
  appName: 'BizCore',
  appLogo: 'https://via.placeholder.com/200',
  appEmail: 'noreply@bizcore.io',
  supportEmail: 'support@bizcore.io',
  primaryColor: '#10b981',
  secondaryColor: '#3b82f6',
  emailNotifications: true,
  smsNotifications: false,
  maintenanceMode: false,
  apiRateLimit: 1000,
  adminGcashPhoneNumber: '',
  adminGcashAccountName: '',
  adminGcashQrCodeUrl: '',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; key: string; name: string; createdAt: string }>>([])
  const [showNewKeyModal, setShowNewKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'notifications' | 'payments' | 'api'>('general')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting data load...')
        const [settingsRes, keysRes] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch('/api/admin/settings/api-keys'),
        ])

        console.log('Settings response:', settingsRes.ok)
        console.log('Keys response:', keysRes.ok)

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          console.log('Got settings:', data)
          setSettings({ ...DEFAULT_SETTINGS, ...data })
        }

        if (keysRes.ok) {
          const data = await keysRes.json()
          console.log('Got keys:', data)
          setApiKeys(data.keys || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        console.log('Data load complete')
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setSaveError('Failed to save settings')
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

  const handleGenerateApiKey = async () => {
    if (!newKeyName.trim()) return

    try {
      const response = await fetch('/api/admin/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })

      if (response.ok) {
        const data = await response.json()
        setSavedKey(data.key)
        setNewKeyName('')
        setShowNewKeyModal(false)

        // Refresh keys
        const keysRes = await fetch('/api/admin/settings/api-keys')
        if (keysRes.ok) {
          const keysData = await keysRes.json()
          setApiKeys(keysData.keys || [])
        }
      }
    } catch (error) {
      console.error('Error generating API key:', error)
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/admin/settings/api-keys/${keyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setApiKeys(apiKeys.filter((k) => k.id !== keyId))
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex-1 p-8 bg-gradient-to-br from-white via-blue-50/40 to-white min-h-screen relative"
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-blue-900">System Settings</h1>
          <p className="text-blue-700 mt-2">Manage BizCore system configuration and preferences</p>
        </motion.div>

        {/* Toasts */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 shadow-sm"
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
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 shadow-sm"
          >
            <XMarkIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-medium">{saveError}</p>
          </motion.div>
        )}

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex gap-2 mb-6 border-b border-slate-200 bg-white rounded-t-2xl overflow-hidden shadow-sm"
        >
          {[
            { id: 'general', label: 'General', icon: Cog6ToothIcon },
            { id: 'appearance', label: 'Appearance', icon: SparklesIcon },
            { id: 'notifications', label: 'Notifications', icon: BellIcon },
            { id: 'payments', label: 'Payment Settings', icon: KeyIcon },
            { id: 'api', label: 'API Keys', icon: KeyIcon },
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id as 'general' | 'appearance' | 'notifications' | 'payments' | 'api')}
              whileHover={{ backgroundColor: '#f3f4f6' }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-all ${
                activeTab === id
                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-32 bg-white rounded-b-2xl border-t border-slate-200 shadow-sm"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full mx-auto mb-4"
              />
              <p className="text-slate-600 font-medium">Loading settings...</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="bg-white rounded-b-2xl shadow-sm overflow-hidden p-8"
          >
            {/* General Tab */}
            {activeTab === 'general' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Application Name</label>
                  <input
                    type="text"
                    value={settings.appName}
                    onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">App Email</label>
                  <p className="text-xs text-slate-600 mb-2">Used for system notifications</p>
                  <input
                    type="email"
                    value={settings.appEmail}
                    onChange={(e) => setSettings({ ...settings, appEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Support Email</label>
                  <p className="text-xs text-slate-600 mb-2">Used for customer support</p>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">API Rate Limit</label>
                  <p className="text-xs text-slate-600 mb-2">Requests per hour per user</p>
                  <input
                    type="number"
                    value={settings.apiRateLimit}
                    onChange={(e) => setSettings({ ...settings, apiRateLimit: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="border-t pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-700">Enable maintenance mode (hides system from users)</span>
                  </label>
                </div>

                <div className="border-t pt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setSettings(DEFAULT_SETTINGS)}
                    className="px-6 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-3">Primary Color</label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-16 h-10 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-3">Secondary Color</label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="w-16 h-10 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-3">Preview</label>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="h-20 rounded-lg" style={{ backgroundColor: settings.primaryColor }}></div>
                    <div className="h-20 rounded-lg" style={{ backgroundColor: settings.secondaryColor }}></div>
                  </div>
                </div>

                <div className="border-t pt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setSettings(DEFAULT_SETTINGS)}
                    className="px-6 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-700">Enable email notifications for system events</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-700">Enable SMS notifications for critical alerts</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Notification Frequency</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>Real-time</option>
                    <option>Hourly</option>
                    <option>Daily</option>
                    <option>Weekly</option>
                  </select>
                </div>

                <div className="border-t pt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setSettings(DEFAULT_SETTINGS)}
                    className="px-6 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Payment Settings Tab */}
            {activeTab === 'payments' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Admin GCash Payment Settings</h3>
                  <p className="text-slate-600 text-sm mb-6">Configure the GCash payment details that tenants will see when upgrading their subscription.</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="space-y-4">
                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        GCash Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., +63912345678"
                        value={settings.adminGcashPhoneNumber || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, adminGcashPhoneNumber: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">The GCash number where tenants will send payment</p>
                    </div>

                    {/* Account Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Account Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., BizCore Admin"
                        value={settings.adminGcashAccountName || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, adminGcashAccountName: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">The name associated with the GCash account</p>
                    </div>

                    {/* QR Code URL */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        GCash QR Code URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/qr-code.png"
                        value={settings.adminGcashQrCodeUrl || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, adminGcashQrCodeUrl: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">URL to the GCash QR code image</p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-all flex items-center gap-2"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">API Keys</h3>
                  <button
                    onClick={() => setShowNewKeyModal(true)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                  >
                    Generate New Key
                  </button>
                </div>

                {savedKey && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-900 font-medium mb-2">Your API key has been generated. Save it now - you won&apos;t be able to see it again!</p>
                    <input
                      type="text"
                      value={savedKey}
                      readOnly
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-mono mb-2"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(savedKey)
                        alert('Copied to clipboard!')
                      }}
                      className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                    >
                      Copy
                    </button>
                  </div>
                )}

                {apiKeys.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No API keys generated yet</p>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="font-medium text-slate-900">{key.name}</p>
                          <p className="text-sm text-slate-500 font-mono">{key.key}</p>
                          <p className="text-xs text-slate-400 mt-1">Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteApiKey(key.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Generate API Key Modal */}
        {showNewKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Generate API Key</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewKeyModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-slate-500" />
                </motion.button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNewKeyModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateApiKey}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <KeyIcon className="w-4 h-4" />
                  Generate
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
