'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPinIcon, PencilIcon, TrashIcon, PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

interface Address {
  id: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface AddressesTabContentProps {
  addresses: Address[]
}

export function AddressesTabContent({ addresses: initialAddresses }: AddressesTabContentProps) {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  })

  const resetForm = () => {
    setFormData({
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    })
    setEditingId(null)
    setError(null)
  }

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEditAddress = (address: Address) => {
    setFormData({
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country
    })
    setEditingId(address.id)
    setShowForm(true)
    setError(null)
  }

  const handleSaveAddress = async () => {
    if (!formData.line1 || !formData.city || !formData.state || !formData.postalCode || !formData.country) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId 
        ? `/api/customers/addresses/${editingId}` 
        : `/api/customers/addresses`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save address')
      }

      const savedAddress = await res.json()

      if (editingId) {
        setAddresses(prev =>
          prev.map(addr => (addr.id === editingId ? { ...addr, ...formData } : addr))
        )
      } else {
        setAddresses(prev => [...prev, { id: savedAddress.id, ...formData }])
      }

      resetForm()
      setShowForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    setLoading(true)

    try {
      const res = await fetch(`/api/customers/addresses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete address')

      setAddresses(prev => prev.filter(addr => addr.id !== id))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Saved Addresses</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your delivery addresses</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Add Address</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-gray-200 rounded-xl p-6 bg-gray-50"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h3>

            <div className="space-y-5">
              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.line1}
                  onChange={(e) => handleAddressChange('line1', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                  placeholder="123 Main St"
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Apt, Suite, etc. <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.line2}
                  onChange={(e) => handleAddressChange('line2', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                  placeholder="Apt 4B"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    State/Region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                    placeholder="NY"
                  />
                </div>
              </div>

              {/* Postal Code & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                    placeholder="10001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                    placeholder="United States"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveAddress}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Address'}
                </button>
                <button
                  onClick={() => {
                    resetForm()
                    setShowForm(false)
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MapPinIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Addresses Saved</h3>
          <p className="text-gray-600 max-w-sm">
            Add your first address to make checkout faster and easier.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <MapPinIcon className="w-5 h-5 text-gray-600" />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit address"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-600 hover:text-gray-900" />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete address"
                  >
                    <TrashIcon className="w-4 h-4 text-gray-600 hover:text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{address.line1}</p>
                {address.line2 && (
                  <p className="text-gray-600">{address.line2}</p>
                )}
                <p className="text-gray-600">
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="text-gray-600">{address.country}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
