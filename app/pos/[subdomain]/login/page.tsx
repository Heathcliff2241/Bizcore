'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function POSLoginPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string

  const [loginMode, setLoginMode] = useState<'password' | 'pin'>('pin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    // Check if user is already logged in
    const posToken = localStorage.getItem('pos_token')
    const posEmployee = localStorage.getItem('pos_employee')

    if (posToken && posEmployee) {
      // Already logged in, redirect to dashboard
      router.push(`/pos/${subdomain}`)
      return
    }

    // Fetch store name
    fetch(`/api/tenant/${subdomain}`)
      .then(res => res.json())
      .then(data => {
        if (data.tenant) {
          setStoreName(data.tenant.name)
        }
      })
      .catch(() => {})
  }, [subdomain, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/pos/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          email,
          password: loginMode === 'password' ? password : undefined,
          pin: loginMode === 'pin' ? pin : undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Store token in localStorage
        localStorage.setItem('pos_token', data.token)
        localStorage.setItem('pos_employee', JSON.stringify(data.employee))
        localStorage.setItem('pos_tenant', JSON.stringify(data.tenant))
        
        // Store settings (including tax)
        if (data.settings) {
          localStorage.setItem('pos_settings', JSON.stringify(data.settings))
        }

        // Redirect to POS
        router.push(`/pos/${subdomain}`)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePinInput = (value: string) => {
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setPin(value)
    }
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
              <h1 className="text-3xl font-bold text-blue-900 mb-2 text-center">POS Login</h1>
              {storeName && (
                <p className="text-blue-600 text-center text-sm mb-6">
                  {storeName}
                </p>
              )}
              {!storeName && (
                <p className="text-blue-600 text-center text-sm mb-6">
                  Access your POS system
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Login Mode Toggle */}
              <div className="flex rounded-lg bg-blue-50 p-1 mb-6 border border-blue-200">
                <button
                  type="button"
                  onClick={() => setLoginMode('pin')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    loginMode === 'pin'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg'
                      : 'text-blue-700 hover:text-blue-900'
                  }`}
                >
                  PIN Login
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('password')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    loginMode === 'password'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg'
                      : 'text-blue-700 hover:text-blue-900'
                  }`}
                >
                  Password Login
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses}
                    placeholder="Email Address"
                  />
                </motion.div>

                {loginMode === 'pin' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <input
                      type="password"
                      inputMode="numeric"
                      required
                      value={pin}
                      onChange={(e) => handlePinInput(e.target.value)}
                      className={`${inputClasses} text-center text-2xl tracking-widest`}
                      placeholder="••••"
                      maxLength={6}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClasses}
                      placeholder="Password"
                    />
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/40"
                >
                  {loading ? 'Logging in...' : 'Login to POS'}
                </motion.button>
              </form>

              <div className="mt-6 text-center text-sm text-blue-700">
                <p>Need help? Contact your manager</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
