'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ResetForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(()=>{
    if (!token) {
      setError('Invalid reset token')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      if (res.ok) {
        setSuccess('Password has been reset. Redirecting to sign in...')
        setTimeout(()=>router.push('/auth/signin'), 1500)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to reset password')
      }
    } catch {
      setError('Unexpected error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="text-sm text-slate-500 mt-2">Set a new password for your account.</p>
        <form onSubmit={handleSubmit} className="mt-4">
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required placeholder="New password" className="w-full p-3 border rounded mb-3" />
          <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required placeholder="Confirm password" className="w-full p-3 border rounded mb-3" />
          <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded">Save new password</button>
        </form>
        {success && <div className="mt-4 text-green-600">{success}</div>}
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  )
}