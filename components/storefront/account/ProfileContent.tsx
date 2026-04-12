'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PencilIcon, CheckIcon, XMarkIcon, MapPinIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Lock, BadgeCheck } from 'lucide-react'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  createdAt?: string | Date
}

interface Address {
  id: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface ProfileContentProps {
  customer?: Customer
}

export function ProfileContent({ customer }: ProfileContentProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressFormData, setAddressFormData] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  })
  const [formData, setFormData] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || ''
  })

  // Fetch addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch(`/api/customers/addresses`)
        if (res.ok) {
          const data = await res.json()
          setAddresses(data.addresses || [])
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err)
      } finally {
        setAddressesLoading(false)
      }
    }

    fetchAddresses()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!customer?.id) return

    setLoading(true)
    setError(null)

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

      setIsEditing(false)
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

  const handleAddressChange = (field: string, value: string) => {
    setAddressFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveAddress = async () => {
    if (!addressFormData.line1 || !addressFormData.city || !addressFormData.state || !addressFormData.postalCode || !addressFormData.country) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const method = editingAddressId ? 'PATCH' : 'POST'
      const url = editingAddressId ? `/api/customers/addresses/${editingAddressId}` : `/api/customers/addresses`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressFormData)
      })

      if (!res.ok) throw new Error('Failed to save address')

      setAddressFormData({ line1: '', line2: '', city: '', state: '', postalCode: '', country: '' })
      setShowAddressForm(false)
      setEditingAddressId(null)
      router.refresh()

      // Refetch addresses
      const fetchRes = await fetch(`/api/customers/addresses`)
      const data = await fetchRes.json()
      setAddresses(data.addresses || [])
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save address')
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const res = await fetch(`/api/customers/addresses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete address')

      setAddresses(prev => prev.filter(a => a.id !== id))
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete address')
    }
  }

  const handleEditAddress = (address: Address) => {
    setAddressFormData({
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country
    })
    setEditingAddressId(address.id)
    setShowAddressForm(true)
  }

  const resetAddressForm = () => {
    setAddressFormData({ line1: '', line2: '', city: '', state: '', postalCode: '', country: '' })
    setEditingAddressId(null)
    setShowAddressForm(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Profile Information</h3>
          <p className="text-sm text-gray-600 mt-1">Manage your personal details</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <PencilIcon className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {isEditing ? (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave() }}>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Email cannot be changed for security reasons
              </p>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold active:scale-[0.98]"
            >
              <CheckIcon className="w-5 h-5" />
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all font-semibold active:scale-[0.98]"
            >
              <XMarkIcon className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">First Name</p>
                <p className="text-lg font-bold text-gray-900">{formData.firstName || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Name</p>
                <p className="text-lg font-bold text-gray-900">{formData.lastName || '—'}</p>
              </div>
            </div>

            <div className="mt-6 space-y-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email Address</p>
              <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {formData.email}
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </span>
              </p>
            </div>

            <div className="mt-6 space-y-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Phone Number</p>
              <p className="text-lg font-bold text-gray-900">{formData.phone || 'Not provided'}</p>
            </div>

            {customer?.createdAt && (
              <div className="mt-6 pt-6 border-t border-gray-300 space-y-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Member Since</p>
                <p className="text-lg font-bold text-gray-900">{new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Addresses Section */}
      <div className="border-t border-slate-200 pt-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Delivery Address</h3>
          {!showAddressForm && (
            <button
              onClick={() => setShowAddressForm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Address
            </button>
          )}
        </div>

        {addressesLoading ? (
          <p className="text-slate-500">Loading addresses...</p>
        ) : showAddressForm ? (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
            <h4 className="font-semibold text-slate-900">{editingAddressId ? 'Edit' : 'Add'} Address</h4>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1 *</label>
              <input
                type="text"
                value={addressFormData.line1}
                onChange={(e) => handleAddressChange('line1', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label>
              <input
                type="text"
                value={addressFormData.line2}
                onChange={(e) => handleAddressChange('line2', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Apt, suite, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  value={addressFormData.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State/Province *</label>
                <input
                  type="text"
                  value={addressFormData.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code *</label>
                <input
                  type="text"
                  value={addressFormData.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
                <input
                  type="text"
                  value={addressFormData.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveAddress}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
                Save Address
              </button>
              <button
                onClick={resetAddressForm}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="border border-slate-200 rounded-lg p-4 flex items-start justify-between">
                <div className="flex gap-3 flex-1">
                  <MapPinIcon className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-900">
                    <p className="font-medium">{address.line1}</p>
                    {address.line2 && <p className="text-slate-600">{address.line2}</p>}
                    <p className="text-slate-600">{address.city}, {address.state} {address.postalCode}</p>
                    <p className="text-slate-600">{address.country}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No addresses saved yet</p>
        )}
      </div>
    </div>
  )
}
