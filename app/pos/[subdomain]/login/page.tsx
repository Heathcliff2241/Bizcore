'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function POSLoginPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const subdomain = params.subdomain as string

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [storeName, setStoreName] = useState('')
  const [showOtpStep, setShowOtpStep] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [usePin, setUsePin] = useState(false)

  // Redirect to POS page if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userType = (session.user as any).userType
      if (userType === 'pos_employee') {
        router.push(`/pos/${subdomain}`)
      }
    }
  }, [session, status, subdomain, router])

  // Fetch store name
  useEffect(() => {
    fetch(`/api/tenant/${subdomain}`)
      .then(res => res.json())
      .then(data => {
        if (data.tenant) {
          setStoreName(data.tenant.name)
        }
      })
      .catch(() => {})
  }, [subdomain])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Request OTP from the API
      const res = await fetch('/api/pos/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          email,
          password: usePin ? undefined : password,
          pin: usePin ? pin : undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Save email and show OTP step
        setUserEmail(email)
        setShowOtpStep(true)
        setOtp('')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use NextAuth signIn with pos-employee-otp provider
      // Use redirect: false so we can explicitly redirect to the correct POS page
      const result = await signIn('pos-employee-otp', {
        email: userEmail,
        otp,
        subdomain,
        redirect: false
      })

      if (result?.error) {
        setError(result.error || 'OTP verification failed')
        setLoading(false)
      } else if (result?.ok) {
        // Manually redirect to POS page after successful authentication
        router.push(`/pos/${subdomain}`)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
      setLoading(false)
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
                    Back to Login
                  </motion.button>
                </form>
              ) : (
                <>
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
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClasses}
                        placeholder="your@email.com"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            setUsePin(!usePin)
                            setPassword('')
                            setPin('')
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Use {usePin ? 'Password' : 'PIN'} instead
                        </button>
                      </div>
                      {usePin ? (
                        <div>
                          <label className="block text-sm font-medium text-blue-900 mb-2">
                            PIN
                          </label>
                          <input
                            type="password"
                            required
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className={inputClasses}
                            placeholder="Enter your PIN"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-blue-900 mb-2">
                            Password
                          </label>
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClasses}
                            placeholder="Enter your password"
                          />
                        </div>
                      )}
                    </motion.div>

                    <motion.button
                      type="submit"
                      disabled={loading || !email || (!usePin ? !password : !pin)}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.02 }}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/40"
                    >
                      {loading ? 'Sending code...' : 'Send Verification Code'}
                    </motion.button>
                  </form>

                  <div className="mt-6 text-center text-sm text-blue-700">
                    <p>A verification code will be sent to your email</p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
