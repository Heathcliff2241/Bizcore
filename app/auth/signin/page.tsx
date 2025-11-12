'use client'

import { signIn, useSession } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status, data: session } = useSession()

  // Clear logout flag after page load
  useEffect(() => {
    const justLoggedOut = searchParams.get('logout') === 'true'
    if (justLoggedOut) {
      // Clear the logout flag after 2 seconds
      const timer = setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('logout')
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
                headers: {
                  'Content-Type': 'application/json',
                },
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

  const fetchAndStoreTenant = async (token: string) => {
    try {
      const response = await fetch('/api/tenants', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        if (result.error.includes('CredentialsSignin')) {
          setError('Invalid email or password.')
        } else {
          setError(result.error || 'Login failed. Please try again.')
        }
        setLoading(false)
        return
      }

      if (result?.ok) {
        // Fetch the JWT token from session
        const session = await fetch('/api/auth/session').then(r => r.json())
        
        if (session?.user) {
          // Fetch tenant information
          const tenant = await fetchAndStoreTenant(session.user.token)
          
          if (tenant) {
            router.push(`/dashboard/${tenant.subdomain || tenant.name}`)
          } else {
            router.push('/dashboard')
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
        const session = await fetch('/api/auth/session').then(r => r.json())
        if (session?.user) {
          const tenant = await fetchAndStoreTenant(session.user.token)
          if (tenant) {
            router.push(`/dashboard/${tenant.subdomain || tenant.name}`)
          } else {
            router.push('/dashboard')
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

  const inputClasses = "w-full p-3 rounded-lg border border-emerald-200 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none text-slate-800 placeholder-slate-400"

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-100 overflow-hidden">
      {/* Floating gradient orbs for kinetic motion */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-10 w-56 h-56 rounded-full bg-emerald-300 blur-3xl opacity-30"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, -25, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-16 right-12 w-64 h-64 rounded-full bg-teal-300 blur-3xl opacity-25"
      />

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(31,38,135,0.15)] rounded-3xl p-10 w-full max-w-md"
      >
        <h1 className="text-3xl font-extrabold text-center text-emerald-700 mb-2 tracking-tight">
          Welcome to BizCore
        </h1>
        <p className="text-center text-sm text-emerald-800/70 mb-8">
          Access your business dashboard and BrandStudio
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-600 text-sm font-semibold text-center p-3 bg-red-100 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

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

          <motion.button
            type="submit"
            disabled={loading || demoMode}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02, boxShadow: "0 6px 14px rgba(16,185,129,0.3)" }}
            className={`w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 ${
              loading || demoMode ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading && demoMode ? 'Starting Demo...' : loading ? 'Signing in...' : 'Sign In'}
          </motion.button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-emerald-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/80 text-emerald-700 font-medium">Or try demo</span>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleDemoAccess}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            className={`w-full py-3 border-2 border-emerald-500 text-emerald-600 rounded-lg font-bold hover:bg-emerald-50 transition-all duration-300 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading && demoMode ? 'Starting Demo...' : 'Explore Demo Dashboard'}
          </motion.button>

          <div className="text-center pt-4">
            <p className="text-sm text-emerald-800/70">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/signup"
                className="text-emerald-600 font-semibold hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
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