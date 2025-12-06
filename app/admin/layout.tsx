'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  PowerIcon,
  SparklesIcon,
  BellIcon,
  CheckCircleIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: number
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: <HomeIcon className="w-5 h-5" />
  },
  {
    name: 'Tenants',
    href: '/admin/tenants',
    icon: <BuildingOfficeIcon className="w-5 h-5" />
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: <UsersIcon className="w-5 h-5" />
  },
  {
    name: 'Business Metrics',
    href: '/admin/businessmetrics',
    icon: <ChartBarIcon className="w-5 h-5" />
  },
  {
    name: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: <CreditCardIcon className="w-5 h-5" />
  },
  {
    name: 'Templates',
    href: '/admin/templates',
    icon: <SparklesIcon className="w-5 h-5" />
  },
  {
    name: 'Notifications',
    href: '/admin/notifications',
    icon: <BellIcon className="w-5 h-5" />
  },
  {
    name: 'Activities',
    href: '/admin/activities',
    icon: <ListBulletIcon className="w-5 h-5" />
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: <Cog6ToothIcon className="w-5 h-5" />
  }
]

function AdminNavigation({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/admin/notifications?unreadOnly=true&limit=1')
        if (response.ok) {
          const data = await response.json()
          setUnreadNotifications(data.pagination?.total || 0)
        }
      } catch (error) {
        console.error('Failed to fetch unread notifications:', error)
      }
    }

    fetchUnreadCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        exit={{ x: -300 }}
        transition={{ duration: 0.3 }}
        className={`bg-white border-r border-blue-100/50 backdrop-blur-sm fixed left-0 top-0 h-screen z-30 flex flex-col`}
        style={{ width: sidebarOpen ? '256px' : '80px' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 p-4 border-b border-blue-100/50"
        >
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <h1 className="text-lg font-bold text-blue-900">BizCore</h1>
                <p className="text-xs text-blue-600">Super Admin</p>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-5 h-5" />
              </motion.button>
            </>
          )}
          {!sidebarOpen && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Bars3Icon className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = item.href === '/admin' 
              ? pathname === '/admin'
              : pathname === item.href || pathname?.startsWith(item.href + '/')
            
            // Add unread count badge for notifications
            const displayBadge = item.href === '/admin/notifications' ? unreadNotifications : item.badge
            
            return (
              <motion.div 
                key={item.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/30'
                          : 'text-blue-700 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`}>
                          {item.icon}
                        </div>
                        {sidebarOpen && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="truncate"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </div>
                      {sidebarOpen && displayBadge && displayBadge > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {displayBadge}
                        </motion.span>
                      )}
                    </Link>
                </motion.div>
              </motion.div>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-blue-100/50 p-4 space-y-2"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoggingOut}
            onClick={async () => {
              setIsLoggingOut(true)
              try {
                // Clear all localStorage items
                localStorage.removeItem('auth_token')
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                localStorage.removeItem('tenant')
                localStorage.removeItem('bizcore_rate_limit')

                // Call clear-session endpoint to clear all session cookies
                try {
                  await fetch('/api/auth/clear-session', {
                    method: 'POST',
                    credentials: 'include'
                  })
                } catch (err) {
                  console.warn('[LOGOUT] clear-session failed:', err)
                }

                // Sign out using NextAuth
                await signOut({
                  callbackUrl: '/auth/signin?logout=true&role=admin',
                  redirect: true
                })
              } catch (error) {
                console.error('[LOGOUT] Logout error:', error)
                // Force redirect even if signOut fails
                window.location.href = '/auth/signin?logout=true&role=admin'
              } finally {
                setIsLoggingOut(false)
              }
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-blue-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <PowerIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (isLoggingOut ? 'Logging out...' : 'Logout')}
          </motion.button>
        </motion.div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.div
        animate={{ marginLeft: sidebarOpen ? '256px' : '80px' }}
        transition={{ duration: 0.3 }}
        className="flex-1 bg-gradient-to-br from-white via-blue-50/40 to-white min-h-screen flex flex-col"
              >
                

        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 md:p-8"
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </motion.main>
      </motion.div>
    </>
  )
}

export default function AdminLayout({
  children,
}: {
  children?: React.ReactNode
}) {
    return (
    <AdminNavigation>
      {children}
    </AdminNavigation>
  )
}
