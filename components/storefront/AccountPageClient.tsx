'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ShoppingCart, Package, DollarSign, MapPin } from 'lucide-react'
import { AccountNavigation } from './AccountNavigation'
import { AccountContent } from './AccountContent'
import type { StorefrontContext } from './types'

interface CustomerData {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  address: Record<string, unknown> | null
  createdAt?: string
  tenantId: number
}

interface AccountPageClientProps {
  storefront: StorefrontContext
  subdomain: string
  tenantId: string
}

export function AccountPageClient({ storefront, subdomain }: AccountPageClientProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated via NextAuth
    if (status === 'loading') {
      return // Still loading
    }

    if (status === 'unauthenticated') {
      // Redirect to home with login modal
      console.log('[ACCOUNT_PAGE] User not authenticated, redirecting to home with login modal')
      router.push(`/storefront/${subdomain}?loginModal=true`)
      return
    }

    // User is authenticated, extract customer data from session
    if (!session?.user) {
      console.log('[ACCOUNT_PAGE] No user in session')
      router.push(`/storefront/${subdomain}?loginModal=true`)
      return
    }

    // Set customer data directly from NextAuth session
    setCustomerData({
      firstName: session.user.name?.split(' ')[0] || '',
      lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
      email: session.user.email || '',
      phone: null,
      address: null,
      tenantId: parseInt(session.user.tenantId as string) || 0
    })
    setLoading(false)
  }, [status, subdomain, router, session])

  if (status === 'loading' || loading) {
    return (
      <main className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-12">
          <div className="animate-pulse space-y-8">
            {/* Hero skeleton */}
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded-xl w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
            </div>
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 rounded-xl"></div>
              <div className="h-24 bg-gray-200 rounded-xl"></div>
              <div className="h-24 bg-gray-200 rounded-xl"></div>
            </div>
            {/* Content skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 h-64 bg-gray-200 rounded-xl"></div>
              <div className="md:col-span-3 h-96 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (status === 'unauthenticated' || !customerData) {
    return null // Will redirect
  }

  // Get customer initials for avatar
  const getInitials = () => {
    const firstName = customerData.firstName || ''
    const lastName = customerData.lastName || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
  }

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        {/* Hero Section with Profile Card */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
            
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-2 border-white/30 shadow-lg">
                  {getInitials()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-1">
                    {customerData.firstName} {customerData.lastName}
                  </h1>
                  <p className="text-blue-100 text-sm">{customerData.email}</p>
                  <p className="text-blue-200 text-xs mt-1">Member since {new Date().getFullYear()}</p>
                </div>
              </div>
              <Link href={`/storefront/${subdomain}`}>
                <button className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl active:scale-95">
                  <ShoppingCart className="w-5 h-5" />
                  Order More
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Lifetime purchases</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">₱0</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">All-time spending</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Addresses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Saved locations</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <AccountNavigation storefront={{ subdomain }} />
          </aside>
          <section className="lg:col-span-3">
            <AccountContent storefront={storefront} customer={customerData} activeTab="profile" />
          </section>
        </div>
      </div>
    </main>
  )
}
