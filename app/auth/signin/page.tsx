'use client'

import { signIn, useSession } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getRateLimitTimeRemaining } from '@/lib/rateLimit'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [rateLimitTime, setRateLimitTime] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status, data: session } = useSession()

  // Set mounted flag for client-only operations
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Clear logout flag after page load
  useEffect(() => {
    const justLoggedOut = searchParams.get('logout') === 'true'
    if (justLoggedOut) {
      // Clear the logout flag after 2 seconds
      const timer = setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('logout')
        url.searchParams.delete('role')
        router.replace(url.pathname + url.search)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  // Redirect if already logged in and has a tenant
  useEffect(() => {
    // Check if user just logged out (prevent auto-redirect)
    const justLoggedOut = searchParams.get('logout') === 'true'
    
    if (status === 'authenticated' && !justLoggedOut) {
      // Admins should go to admin dashboard, not tenant dashboard
      if (session?.user?.role === 'admin') {
        // Clear any tenant data for admin users
        localStorage.removeItem('tenant')
        localStorage.removeItem('auth_token')
        router.push('/admin')
        return
      }

      // For tenant users, fetch and redirect to their tenant dashboard
      const tenant = localStorage.getItem('tenant')
      if (tenant) {
        try {
          const tenantObj = JSON.parse(tenant)
          router.push(`/dashboard/${tenantObj.subdomain || tenantObj.name}`)
        } catch {
          router.push('/dashboard')
        }
      } else {
        // Try to fetch tenant if session exists but no tenant in localStorage
        const checkTenant = async () => {
          if (session?.user) {
            try {
              const response = await fetch('/api/tenants', {
                credentials: 'include',
              })
              if (response.ok) {
                const data = await response.json()
                if (data.tenant) {
                  localStorage.setItem('tenant', JSON.stringify(data.tenant))
                  router.push(`/dashboard/${data.tenant.subdomain || data.tenant.name}`)
                  return
                }
              }
            } catch (err) {
              console.error('Error fetching tenant:', err)
            }
          }
          router.push('/dashboard')
        }
        checkTenant()
      }
    }
  }, [status, session, router, searchParams])

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setError(message)
    }
  }, [searchParams])

  // Check rate limit status on mount and email change
  useEffect(() => {
    if (!isMounted) return
    
    const rateLimitKey = `auth_${email}`
    const timeRemaining = getRateLimitTimeRemaining(rateLimitKey)
    
    if (timeRemaining > 0) {
      setRateLimitTime(timeRemaining)
    } else {
      setRateLimitTime(0)
      setError('')
    }
  }, [email, isMounted])

  // Countdown timer effect - only updates error message
  useEffect(() => {
    if (rateLimitTime <= 0) {
      setError('')
      return
    }
    
    setError(`Too many failed attempts. Try again in ${rateLimitTime} seconds.`)
    
    const interval = setInterval(() => {
      setRateLimitTime(prev => {
        const newTime = prev - 1
        if (newTime <= 0) {
          setError('')
          clearInterval(interval)
          return 0
        }
        setError(`Too many failed attempts. Try again in ${newTime} seconds.`)
        return newTime
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [rateLimitTime])

  const fetchAndStoreTenant = async () => {
    try {
      const response = await fetch('/api/tenants', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.tenant) {
          localStorage.setItem('tenant', JSON.stringify(data.tenant))
          return data.tenant
        }
      }
    } catch (err) {
      console.error('Error fetching tenant:', err)
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign in with NextAuth
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      })

      if (result?.error) {
        console.log('[SIGNIN] Auth error:', result.error)
        
        if (result.error === 'Too many failed attempts. Please try again later.') {
          // Rate limited - fetch accurate time remaining from server
          try {
            const response = await fetch(`/api/auth/rate-limit?email=${encodeURIComponent(email)}`)
            if (response.ok) {
              const data = await response.json()
              const timeRemaining = data.timeRemaining || 900 // fallback to 15 minutes
              
              // Sync to localStorage for client-side countdown
              if (typeof window !== 'undefined') {
                const rateLimitKey = `auth_${email}`
                const now = Date.now()
                const resetTime = now + (timeRemaining * 1000)
                const stored = localStorage.getItem('bizcore_rate_limit')
                const allRecords = stored ? JSON.parse(stored) : {}
                allRecords[rateLimitKey] = { count: 6, resetTime }
                localStorage.setItem('bizcore_rate_limit', JSON.stringify(allRecords))
              }
              
              setRateLimitTime(timeRemaining)
              setError(`Too many failed attempts. Try again in ${timeRemaining} seconds.`)
            } else {
              // Fallback if API fails
              setRateLimitTime(900)
              setError('Too many failed attempts. Try again in 15 minutes.')
            }
          } catch (err) {
            console.error('[SIGNIN] Failed to fetch rate limit time:', err)
            setRateLimitTime(900)
            setError('Too many failed attempts. Try again in 15 minutes.')
          }
        } else if (result.error.includes('CredentialsSignin')) {
          console.log('[SIGNIN] Regular auth failure')
          setError('Invalid email or password.')
        } else {
          setError(result.error || 'Login failed. Please try again.')
        }
        setLoading(false)
        return
      }

      if (result?.ok) {
        // Fetch the JWT token from session
        const session = await fetch('/api/auth/session', { credentials: 'include' }).then(r => r.json())
        
        if (session?.user) {
          // Smart role-based routing
          const userRole = session.user.role || 'user'
                    
          if (userRole === 'admin') {
            // Route admin to super admin dashboard
            // Clear any tenant-related data
            localStorage.removeItem('tenant')
            localStorage.removeItem('auth_token')
            router.push('/admin')
          } else {
            // Route tenant users to their dashboard
            const tenant = await fetchAndStoreTenant()
            if (tenant) {
              router.push(`/dashboard/${tenant.subdomain || tenant.name}`)
            } else {
              router.push('/dashboard')
            }
          }
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        setError('Connection failed. Please check if the server is running and accessible.')
      } else if (errorMsg.includes('404')) {
        setError('API endpoint not found. Please verify the server configuration.')
      } else if (errorMsg.includes('500')) {
        setError('Server error. Please try again later.')
      } else {
        setError(`Login error: ${errorMsg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemoAccess = async () => {
    setError('')
    setLoading(true)
    setDemoMode(true)

    try {
      const result = await signIn('credentials', {
        email: 'demo@brandstudio.com',
        password: 'password',
        redirect: false,
        callbackUrl: '/dashboard'
      })

      if (result?.error) {
        setError('Demo access unavailable. Please contact support.')
        setDemoMode(false)
      } else if (result?.ok) {
        const session = await fetch('/api/auth/session', { credentials: 'include' }).then(r => r.json())
        if (session?.user) {
          // Smart role-based routing for demo
          const userRole = session.user.role || 'user'
                    
          if (userRole === 'admin') {
            // Clear tenant data for admin
            localStorage.removeItem('tenant')
            localStorage.removeItem('auth_token')
            router.push('/admin')
          } else {
            const tenant = await fetchAndStoreTenant()
            if (tenant) {
              router.push(`/dashboard/${tenant.subdomain || tenant.name}`)
            } else {
              router.push('/dashboard')
            }
          }
        } else {
          router.push('/dashboard')
        }
      }
    } catch {
      setError('An error occurred. Please try again.')
      setDemoMode(false)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const inputClasses = "w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-slate-900 placeholder:text-blue-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/30 transition-all"

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-white overflow-x-hidden relative">
      {/* Dark blue gradient accent overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-transparent to-indigo-900" />
      </div>

      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{ x: [-60, 60, -60], y: [0, 30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full opacity-10 left-0 top-0 w-96 h-96 blur-3xl bg-gradient-to-br from-blue-600 to-blue-400"
        />
        <motion.div
          animate={{ x: [60, -60, 60], y: [0, -30, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-80 h-80 rounded-full opacity-8 right-0 top-1/3 blur-3xl bg-gradient-to-br from-blue-700 to-indigo-600"
        />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100/50"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold text-blue-900 mb-2 text-center">Welcome</h1>
              <p className="text-blue-600 text-center text-sm mb-6">
                Access your business dashboard and BrandStudio
              </p>
            </motion.div>
             
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm font-semibold text-center p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
              <input
                id="email"
                name="email"
                type="email"
                required
                className={inputClasses}
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
              <input
                id="password"
                name="password"
                type="password"
                required
                className={inputClasses}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              </motion.div>

              <motion.button
                type="submit"
                disabled={loading || demoMode}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/40"
              >
                {loading && demoMode ? 'Starting Demo...' : loading ? 'Signing in...' : 'Sign In'}
              </motion.button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-blue-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-blue-600 font-medium">Or try demo</span>
                </div>
              </div>

              <motion.button
                type="button"
                onClick={handleDemoAccess}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading && demoMode ? 'Starting Demo...' : 'Explore Demo Dashboard'}
              </motion.button>

              <div className="text-center pt-4">
                <p className="text-sm text-blue-700">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/auth/signup"
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </form>
            </motion.div>
            </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  )
}