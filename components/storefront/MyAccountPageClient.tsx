'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserIcon, 
  ShoppingBagIcon, 
  MapPinIcon, 
  LockClosedIcon 
} from '@heroicons/react/24/outline'
import { ProfileTabContent } from './account/ProfileTabContent'
import { OrdersTabContent } from './account/OrdersTabContent'
import { AddressesTabContent } from './account/AddressesTabContent'
import { SecurityTabContent } from './account/SecurityTabContent'

interface Address {
  id: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface OrderItem {
  id: number
  productId: string
  quantity: number
  price: number
  product?: {
    id: string
    name: string
    image?: string
  }
}

interface Order {
  id: number
  orderNumber: string
  total: number
  status: string
  paymentStatus: string
  tax: number
  createdAt: Date | string
  orderItems: OrderItem[]
}

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  createdAt?: string | Date
}

interface MyAccountPageClientProps {
  customer: Customer
  orders: Order[]
  addresses: Address[]
  taxRate: number
  subdomain: string
}

const TABS = [
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: UserIcon,
    description: 'Personal information' 
  },
  { 
    id: 'orders', 
    label: 'Orders', 
    icon: ShoppingBagIcon,
    description: 'Order history' 
  },
  { 
    id: 'addresses', 
    label: 'Addresses', 
    icon: MapPinIcon,
    description: 'Saved locations' 
  },
  { 
    id: 'security', 
    label: 'Security', 
    icon: LockClosedIcon,
    description: 'Password & security' 
  }
]

export function MyAccountPageClient({
  customer,
  orders,
  addresses,
  taxRate,
  subdomain
}: MyAccountPageClientProps) {
  const [activeTab, setActiveTab] = useState<string>('profile')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTabContent customer={customer} />
      case 'orders':
        return <OrdersTabContent orders={orders} taxRate={taxRate} subdomain={subdomain} />
      case 'addresses':
        return <AddressesTabContent addresses={addresses} />
      case 'security':
        return <SecurityTabContent />
      default:
        return <ProfileTabContent customer={customer} />
    }
  }

  return (
    <div className="space-y-8">
      {/* Mobile Tab Selector - Dropdown on small screens, Horizontal scroll on medium */}
      <div className="lg:hidden">
        <div className="relative">
          {/* Mobile horizontal scroll tabs */}
          <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap font-medium text-sm transition-all flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Desktop Tab Navigation - Horizontal with icons */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-4 gap-4">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl transition-all border-2 ${
                  activeTab === tab.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    activeTab === tab.id ? 'text-gray-900' : 'text-gray-400'
                  }`}
                />
                <div className="text-center">
                  <p className={`font-semibold text-sm ${
                    activeTab === tab.id ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {tab.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{tab.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area with Animation */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 md:p-8 lg:p-10"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
