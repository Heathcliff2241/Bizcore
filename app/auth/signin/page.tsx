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
  const [rateLimitTime, setRateLimitTime] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [showOtpStep, setShowOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const [userEmail, setUserEmail] = useState('')
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
      // First, check if the user exists
      const checkUserResponse = await fetch('/api/auth/signin/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const checkUserData = await checkUserResponse.json()

      if (!checkUserData.exists) {
        setError(checkUserData.message || 'Account not found. Please check your email and try again.')
        setLoading(false)
        return
      }

      // User exists, now request OTP
      const otpResponse = await fetch('/api/auth/signin/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!otpResponse.ok) {
        const data = await otpResponse.json()
        // If rate limited, set the countdown timer
        if (data.retryAfter) {
          setRateLimitTime(data.retryAfter)
        } else {
          setError(data.message || 'Failed to send OTP. Please try again.')
        }
        setLoading(false)
        return
      }

      // OTP sent successfully
      setUserEmail(email)
      setShowOtpStep(true)
      setOtp('')
      setLoading(false)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg || 'Failed to request OTP. Please try again.')
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign in using OTP provider directly
      console.log('🔐 SignIn: Calling signIn with otp provider', { email: userEmail, otp })
      const result = await signIn('otp', {
        email: userEmail,
        otp: otp,
        redirect: false,
        callbackUrl: '/dashboard'
      })

      if (result?.error) {
        console.error('❌ SignIn Error:', result.error)
        setError(result.error || 'Invalid OTP. Please try again.')
        setLoading(false)
        return
      }

      if (result?.ok) {
        console.log('✅ SignIn Successful, fetching session...')
        // Fetch the latest session
        const session = await fetch('/api/auth/session', { credentials: 'include' }).then(r => r.json())
        
        if (session?.user) {
          // Smart role-based routing
          const userRole = session.user.role || 'user'
                    
          if (userRole === 'admin') {
            localStorage.removeItem('tenant')
            localStorage.removeItem('auth_token')
            router.push('/admin')
          } else {
            // Store tenant in localStorage if available
            if (session.user.tenantId && session.user.subdomain) {
              localStorage.setItem('tenant', JSON.stringify({
                id: session.user.tenantId,
                subdomain: session.user.subdomain,
                name: session.user.subdomain
              }))
              router.push(`/dashboard/${session.user.subdomain}`)
            } else {
              const tenant = await fetchAndStoreTenant()
              if (tenant) {
                router.push(`/dashboard/${tenant.subdomain || tenant.name}`)
              } else {
                router.push('/dashboard')
              }
            }
          }
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg || 'OTP verification failed.')
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
            {showOtpStep ? (
              <form className="space-y-5" onSubmit={handleVerifyOtp}>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-sm font-semibold text-center p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <p className="text-blue-900 font-medium">Verification Code Sent</p>
                  <p className="text-blue-700 mt-1">Enter the 6-digit code sent to {userEmail}</p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength={6}
                  required
                  className={inputClasses}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/40"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => {
                    setShowOtpStep(false)
                    setOtp('')
                    setUserEmail('')
                    setError('')
                  }}
                  className="w-full py-2 text-blue-600 text-sm font-semibold hover:underline"
                >
                  Back to Sign In
                </motion.button>
              </form>
            ) : (
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

                <div className="text-right">
                  <Link
                    href="/auth/forgot"
                    className="text-sm text-blue-600 font-semibold hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/40"
                >
                  {loading ? 'Sending code...' : 'Continue'}
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
            )}
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