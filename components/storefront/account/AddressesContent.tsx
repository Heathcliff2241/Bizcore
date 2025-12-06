'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPinIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

interface Address {
  id: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface AddressesContentProps {
  customer?: any
}

export function AddressesContent({ customer }: AddressesContentProps): JSX.Element {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  })

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch(`/api/customers/addresses`)
        if (!res.ok) throw new Error('Failed to fetch addresses')
        const data = await res.json()
        setAddresses(data.addresses || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [])

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveAddress = async () => {
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/customers/addresses/${editingId}` : `/api/customers/addresses`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to save address')

      setFormData({ line1: '', line2: '', city: '', state: '', postalCode: '', country: '' })
      setShowForm(false)
      setEditingId(null)
      router.refresh()

      // Refetch addresses
      const fetchRes = await fetch(`/api/customers/addresses`)
      const data = await fetchRes.json()
      setAddresses(data.addresses || [])
    } catch (err) {
      console.error(err)
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
      console.error(err)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading addresses...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Saved Addresses</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Address
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <h4 className="font-semibold text-slate-900 mb-4">{editingId ? 'Edit' : 'Add'} Address</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1 *</label>
              <input
                type="text"
                value={formData.line1}
                onChange={(e) => handleAddressChange('line1', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label>
              <input
                type="text"
                value={formData.line2}
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
                  value={formData.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  value={formData.state}
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
                  value={formData.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveAddress}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Save Address
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({ line1: '', line2: '', city: '', state: '', postalCode: '', country: '' })
                }}
                className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-300 rounded-lg">
          <MapPinIcon className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500">No addresses on file</p>
          <p className="text-sm text-slate-400">Add your first address for faster checkout</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map(address => (
            <div key={address.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{address.line1}</p>
                  {address.line2 && <p className="text-sm text-slate-600">{address.line2}</p>}
                  <p className="text-sm text-slate-600">{address.city}, {address.state} {address.postalCode}</p>
                  <p className="text-sm text-slate-600">{address.country}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setEditingId(address.id)
                    setFormData({
                      line1: address.line1,
                      line2: address.line2 || '',
                      city: address.city,
                      state: address.state,
                      postalCode: address.postalCode,
                      country: address.country
                    })
                    setShowForm(true)
                  }}
                  className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 py-1"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAddress(address.id)}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 py-1"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
