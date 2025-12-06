'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (res.ok) {
        setMessage('If this email exists, you will receive password reset instructions.')
      } else {
        const data = await res.json()
        setError(data.error || 'Error submitting request')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow">
        <h1 className="text-2xl font-semibold">Forgot your password</h1>
        <p className="text-sm text-slate-500 mt-2">Enter your email and we'll send a link to reset your password.</p>
        <form onSubmit={handleSubmit} className="mt-4">
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="Email address" className="w-full p-3 border rounded mb-3" />
          <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded">Send Reset Link</button>
        </form>
        {message && <div className="mt-4 text-green-600">{message}</div>}
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  )
}
