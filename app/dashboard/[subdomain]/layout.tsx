/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { ChevronLeft, ChevronRight, LogOut, LayoutDashboard, ShoppingCart, Package, Users, UserCog, Palette, Settings, ExternalLink, Tag, BarChart3, CreditCard as CreditCardIcon } from 'lucide-react'
import { ThemeProvider, useTheme } from '../theme-context'
import { SettingsProvider } from '@/lib/settings-context'
import { getBrandStudioIframeUrl } from '@/lib/getAppUrl'

const links = [
  { name: 'Overview', pattern: '/dashboard/[subdomain]' as const, icon: LayoutDashboard },
  { name: 'Orders', pattern: '/dashboard/[subdomain]/orders' as const, icon: ShoppingCart },
  { name: 'Inventory', pattern: '/dashboard/[subdomain]/inventory' as const, icon: Package },
  { name: 'Products', pattern: '/dashboard/[subdomain]/products' as const, icon: Package },
  { name: 'Categories', pattern: '/dashboard/[subdomain]/categories' as const, icon: Tag },
  { name: 'Customers', pattern: '/dashboard/[subdomain]/customers' as const, icon: Users },
  { name: 'Employees', pattern: '/dashboard/[subdomain]/employees' as const, icon: UserCog },
  { name: 'Analytics', pattern: '/dashboard/[subdomain]/analytics' as const, icon: BarChart3 },
  { name: 'Brand Studio', path: '/brandstudio', icon: Palette, external: true },
  { name: 'Billing & Subscriptions', pattern: '/dashboard/[subdomain]/billing/subscriptions' as const, icon: CreditCardIcon },
  { name: 'Settings', pattern: '/dashboard/[subdomain]/settings' as const, icon: Settings }
]

function DashboardLayoutContent({
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
  const { theme } = useTheme()

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
    console.log('[LOGOUT] Starting logout process')
    try {
      // Clear all localStorage items
      console.log('[LOGOUT] Clearing localStorage')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('tenant')
      localStorage.removeItem('bizcore_rate_limit') // Also clear rate limit data

      // Sign out using NextAuth with logout flag to prevent auto-redirect
      console.log('[LOGOUT] Calling NextAuth signOut')
      try {
        await fetch('/api/auth/clear-session', { method: 'POST', credentials: 'include' })
      } catch (err) {
        console.warn('[LOGOUT] clear-session failed', err)
      }
      await signOut({
        callbackUrl: '/auth/signin?logout=true',
        redirect: true
      })
      console.log('[LOGOUT] NextAuth signOut completed')
    } catch (error) {
      console.error('[LOGOUT] Logout error:', error)
      // Force redirect even if signOut fails - use window.location for full page reload
      console.log('[LOGOUT] Force redirect due to error')
      window.location.href = '/auth/signin?logout=true'
    }
  }

  // Handle BrandStudio click
  const handleBrandStudioClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowBrandStudioDialog(true)
  }

  // Open BrandStudio in new window
  const openBrandStudio = () => {
    const rawSubdomain = params.subdomain
    const subdomain = Array.isArray(rawSubdomain) ? rawSubdomain[0] : rawSubdomain
    
    // Get tenant data from localStorage
    const tenant = localStorage.getItem('tenant')
    let tenantId = ''
    
    console.log('[Dashboard] localStorage tenant raw:', tenant)
    
    if (tenant) {
      try {
        const tenantObj = JSON.parse(tenant)
        console.log('[Dashboard] Parsed tenant object:', tenantObj)
        tenantId = String(tenantObj.id || '')
        console.log('[Dashboard] Extracted tenantId:', tenantId, 'type:', typeof tenantObj.id)
      } catch (e) {
        console.error('Failed to parse tenant data:', e)
      }
    } else {
      console.log('[Dashboard] No tenant in localStorage')
    }
    
    // Build URL with both subdomain and tenantId using the helper
    const brandStudioUrl = getBrandStudioIframeUrl({ subdomain: String(subdomain), tenantId })
    console.log('[Dashboard] Opening BrandStudio with URL:', brandStudioUrl, { subdomain, tenantId })
    window.open(brandStudioUrl, '_blank')
    setShowBrandStudioDialog(false)
  }

  // Build tenant-specific paths
  const getTenantPath = (link: (typeof links)[number]) => {
    const rawSubdomain = params.subdomain
    const subdomain = Array.isArray(rawSubdomain)
      ? rawSubdomain[0]
      : rawSubdomain ?? ''

    if (link.external) {
      return {
        href: link.path,
        pathString: link.path,
        disabled: false
      }
    }

    if (!link.pattern) {
      return {
        href: '/',
        pathString: '/',
        disabled: false
      }
    }
    const pathString = link.pattern.replace('[subdomain]', subdomain)


      if (!subdomain) {
        return {
          href: '#',
          pathString,
          disabled: true
        }
      }

    return {
      href: pathString,
      pathString,
      disabled: false
    }
  }

  return (
        <div className="flex h-screen" style={{ backgroundColor: theme.background || '#f9fafb' }}>
          {/* Sidebar */}
          <aside
            className={`bg-white border-r transition-all duration-300 flex flex-col h-screen fixed inset-y-0 left-0 z-40 ${
              sidebarOpen ? 'w-64 p-4' : 'w-20 p-2'
            }`}
            style={{ 
              borderRightColor: theme.surface || '#f3f4f6',
              boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.02), 0 1px 3px 0 rgba(0, 0, 0, 0.04)'
            }}
          >
            {/* Logo and Brand */}
            <div className={`mb-8 flex items-center justify-between ${sidebarOpen ? '' : 'justify-center'}`}>
              {sidebarOpen && (
                <h1 
                  className="text-2xl font-bold transition-colors"
                  style={{ color: theme.text || '#111827' }}
                >
                  {tenantName}
                </h1>
              )}
              <div className="flex-shrink-0">
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm transition-all duration-200 ${!sidebarOpen && 'ml-auto'}`}
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                  }}
                >
                  {tenantName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1">
              <ul className={`space-y-1 ${!sidebarOpen && 'space-y-2'}`}>
                {links.map((link) => {
                  const Icon = link.icon
                  const { href, pathString, disabled } = getTenantPath(link)
                  const key = link.pattern ?? link.path ?? link.name
                  const isOverviewLink = link.pattern === '/dashboard/[subdomain]'
                  const isActive = isOverviewLink
                    ? pathname === pathString
                    : pathname === pathString || pathname.startsWith(`${pathString}/`)
                  
                  // Special handling for BrandStudio external link
                  if (link.external && link.path) {
                    return (
                      <li key={key}>
                        <button
                          onClick={handleBrandStudioClick}
                          title={!sidebarOpen ? link.name : ''}
                          className={`w-full flex items-center px-3.5 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                            !sidebarOpen && 'justify-center'
                          }`}
                          style={{
                            color: theme.text || '#374151',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${theme.primary}08`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <Icon size={20} className="flex-shrink-0" />
                          {sidebarOpen && <span className="ml-3 text-sm">{link.name}</span>}
                          {sidebarOpen && <ExternalLink size={14} className="ml-auto opacity-50" />}
                        </button>
                      </li>
                    )
                  }
                  
                  return (
                    <li key={key}>
                      {disabled ? (
                        <span
                          className={`flex items-center px-3.5 py-2.5 rounded-lg text-gray-400 cursor-not-allowed ${
                            !sidebarOpen && 'justify-center'
                          }`}
                        >
                          <Icon size={20} className="flex-shrink-0" />
                          {sidebarOpen && <span className="ml-3 text-sm">{link.name}</span>}
                        </span>
                      ) : (
                        <Link
                          href={href}
                          title={!sidebarOpen ? link.name : ''}
                          className={`flex items-center px-3.5 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                            !sidebarOpen && 'justify-center'
                          }`}
                          style={{
                            backgroundColor: isActive ? `${theme.primary}15` : 'transparent',
                            color: isActive ? theme.primary : (theme.text || '#374151'),
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = `${theme.primary}08`
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          <Icon size={20} className="flex-shrink-0" />
                          {sidebarOpen && <span className="ml-3 text-sm">{link.name}</span>}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="space-y-2 mt-auto pt-4 border-t" style={{ borderColor: theme.surface || '#f3f4f6' }}>
              <button
                onClick={handleLogout}
                title={!sidebarOpen ? 'Logout' : ''}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                  !sidebarOpen && 'justify-center'
                }`}
                style={{ color: theme.text || '#374151' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2'
                  e.currentTarget.style.color = '#dc2626'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = theme.text || '#374151'
                }}
              >
                <LogOut size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="ml-3 text-sm">Logout</span>}
              </button>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                  !sidebarOpen && 'justify-center'
                }`}
                title={sidebarOpen ? 'Collapse' : 'Expand'}
                style={{ color: theme.text || '#374151' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.primary}08`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {sidebarOpen ? (
                  <>
                    <ChevronLeft size={20} />
                    <span className="ml-3 text-sm">Collapse</span>
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                <div className="flex items-start gap-4">
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${theme.primary}15` }}
                  >
                    <Palette className="w-6 h-6" style={{ color: theme.primary }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text || '#111827' }}>
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
                        className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm"
                        style={{ backgroundColor: theme.primary }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = `0 4px 12px ${theme.primary}40`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
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
  )
}

export default function TenantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <DashboardLayoutContent>
          {children}
        </DashboardLayoutContent>
      </ThemeProvider>
    </SettingsProvider>
  )
}
