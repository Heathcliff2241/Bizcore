'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, LogOut } from 'lucide-react'
import type { StorefrontContext } from './types'

interface AccountHeaderProps {
  storefront: StorefrontContext
  customerName?: string
  customerEmail?: string
}

export function AccountHeader({ storefront, customerName, customerEmail }: AccountHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push(`/storefront/${storefront.subdomain}`)
  }

  return (
    <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Back button and branding */}
          <div className="flex items-center gap-3">
            <Link 
              href={`/storefront/${storefront.subdomain}`}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Back to home"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{storefront.name}</h1>
              <p className="text-xs text-slate-500">Account</p>
            </div>
          </div>

          {/* User info and logout */}
          <div className="flex items-center gap-4">
            {customerEmail && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{customerName || 'Customer'}</p>
                <p className="text-xs text-slate-500">{customerEmail}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
