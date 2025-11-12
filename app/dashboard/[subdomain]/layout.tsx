'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { ChevronLeft, ChevronRight, LogOut, LayoutDashboard, ShoppingCart, Package, Users, Palette, Settings, ExternalLink } from 'lucide-react'
import { ThemeProvider } from '../theme-context'
import { SettingsProvider } from '@/lib/settings-context'

const links = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', path: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Inventory', path: '/dashboard/inventory', icon: Package },
  { name: 'Products', path: '/dashboard/products', icon: Package },
  { name: 'Customers', path: '/dashboard/customers', icon: Users },
  { name: 'Brand Studio', path: '/brandstudio', icon: Palette, external: true },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
]

export default function TenantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tenantName, setTenantName] = useState<string>('')
  const [showBrandStudioDialog, setShowBrandStudioDialog] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // Get tenant name from localStorage or params
    const tenant = localStorage.getItem('tenant')
    if (tenant) {
      try {
        const tenantObj = JSON.parse(tenant)
        setTenantName(tenantObj.name || 'BizCore')
      } catch {
        setTenantName('BizCore')
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('tenant')
      
      // Sign out using NextAuth with logout flag
      await signOut({ 
        callbackUrl: '/auth/signin?logout=true',
        redirect: true 
      })
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if signOut fails
      router.push('/auth/signin?logout=true')
    }
  }

  // Handle BrandStudio click
  const handleBrandStudioClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowBrandStudioDialog(true)
  }

  // Open BrandStudio in new window
  const openBrandStudio = () => {
    const subdomain = params.subdomain
    
    // Get tenant data from localStorage
    const tenant = localStorage.getItem('tenant')
    let tenantId = ''
    
    if (tenant) {
      try {
        const tenantObj = JSON.parse(tenant)
        tenantId = tenantObj.id || ''
      } catch {
        console.error('Failed to parse tenant data')
      }
    }
    
    // Build URL with both subdomain and tenantId
    const brandStudioUrl = `http://localhost:5174?subdomain=${subdomain}&tenantId=${tenantId}`
    window.open(brandStudioUrl, '_blank')
    setShowBrandStudioDialog(false)
  }

  // Build tenant-specific paths
  const getTenantPath = (basePath: string) => {
    const subdomain = params.subdomain
    if (basePath === '/dashboard') {
      return `/dashboard/${subdomain}`
    }
    return `/dashboard/${subdomain}${basePath.replace('/dashboard', '')}`
  }

  return (
    <SettingsProvider>
      <ThemeProvider>
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar */}
          <aside
            className={`bg-white border-r border-gray-100 flex flex-col h-screen fixed inset-y-0 left-0 z-40 transition-all duration-300 ${
              sidebarOpen ? 'w-64 p-4' : 'w-20 p-2'
            }`}
          >
            {/* Logo and Brand */}
            <div className={`mb-8 flex items-center justify-between ${sidebarOpen ? '' : 'justify-center'}`}>
              {sidebarOpen && <h1 className="text-2xl font-bold text-gray-900">{tenantName}</h1>}
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold ${!sidebarOpen && 'ml-auto'}`}>
                  {tenantName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1">
              <ul className={`space-y-2 ${!sidebarOpen && 'space-y-4'}`}>
                {links.map((link) => {
                  const Icon = link.icon
                  const tenantPath = getTenantPath(link.path)
                  const isActive = pathname === tenantPath || pathname.startsWith(tenantPath + '/')
                  
                  // Special handling for BrandStudio external link
                  if (link.external) {
                    return (
                      <li key={link.path}>
                        <button
                          onClick={handleBrandStudioClick}
                          title={!sidebarOpen ? link.name : ''}
                          className={`w-full flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-100 ${
                            !sidebarOpen && 'justify-center'
                          }`}
                        >
                          <Icon size={20} className="flex-shrink-0" />
                          {sidebarOpen && <span className="ml-3">{link.name}</span>}
                          {sidebarOpen && <ExternalLink size={14} className="ml-auto opacity-50" />}
                        </button>
                      </li>
                    )
                  }
                  
                  return (
                    <li key={link.path}>
                      <Link
                        href={tenantPath}
                        title={!sidebarOpen ? link.name : ''}
                        className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        } ${!sidebarOpen && 'justify-center'}`}
                      >
                        <Icon size={20} className="flex-shrink-0" />
                        {sidebarOpen && <span className="ml-3">{link.name}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Footer with Toggle and Logout */}
            <div className="space-y-2 mt-auto">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title={!sidebarOpen ? 'Logout' : ''}
                className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors ${!sidebarOpen && 'justify-center'}`}
              >
                <LogOut size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="ml-3">Logout</span>}
              </button>

              {/* Toggle Sidebar Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${!sidebarOpen && 'justify-center'}`}
                title={sidebarOpen ? 'Collapse' : 'Expand'}
              >
                {sidebarOpen ? (
                  <>
                    <ChevronLeft size={20} />
                    <span className="ml-3">Collapse</span>
                  </>
                ) : (
                  <ChevronRight size={20} />
                )}
              </button>
            </div>
          </aside>

          {/* Main content */}
          <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
            {children}
          </div>

          {/* BrandStudio Confirmation Dialog */}
          {showBrandStudioDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Open BrandStudio Editor
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      BrandStudio will open in a new tab for the best creative experience. 
                      This gives you more screen space and flexibility to design your perfect storefront.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowBrandStudioDialog(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={openBrandStudio}
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2"
                      >
                        Open Editor
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ThemeProvider>
    </SettingsProvider>
  )
}
