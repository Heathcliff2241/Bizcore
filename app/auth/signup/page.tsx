'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SignUp() {
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, businessName }),
      })

      if (response.ok) {
        router.push('/auth/signin?message=Registration successful! Please sign in.')
      } else {
        const data = await response.json()
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "w-full p-3 rounded-lg border border-emerald-200 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none text-slate-800 placeholder-slate-400";

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-100 overflow-hidden">
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
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(31,38,135,0.15)] rounded-3xl p-10 w-full max-w-md"
      >
        <h1 className="text-3xl font-extrabold text-center text-emerald-700 mb-6 tracking-tight">
          Create Your BizCore Account
        </h1>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-600 text-sm font-semibold text-center p-2 bg-red-100 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              id="name"
              name="name"
              type="text"
              required
              className={inputClasses}
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              id="businessName"
              name="businessName"
              type="text"
              className={inputClasses}
              placeholder="Business Name (Optional)"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

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
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className={inputClasses}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02, boxShadow: "0 6px 14px rgba(16,185,129,0.3)" }}
            className={`w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </motion.button>
        </form>

        <div className="text-center mt-8 text-sm text-emerald-800/70">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-emerald-600 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  )
}