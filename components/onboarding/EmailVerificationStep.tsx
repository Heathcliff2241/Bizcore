'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import OtpInput from './OtpInput'

interface EmailVerificationStepProps {
  onSuccess: (email: string, verificationToken: string, businessName: string) => void
  onError?: (error: string) => void
}

type VerificationStep = 'email' | 'otp'

export default function EmailVerificationStep({ onSuccess, onError }: EmailVerificationStepProps) {
  const [step, setStep] = useState<VerificationStep>('email')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState(5)

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (step === 'otp' && countdownSeconds > 0) {
      const timer = setTimeout(() => setCountdownSeconds(countdownSeconds - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdownSeconds, step])

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), businessName: businessName.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send OTP')
      }

      setMaskedEmail(data.maskedEmail)
      setCountdownSeconds(600) // 10 minutes
      setStep('otp')
      setOtpError(null)
      setAttemptsRemaining(5)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request OTP'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    setOtpError(null)

    try {
      const response = await fetch('/api/onboarding/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining)
          setOtpError(`Invalid OTP. ${data.attemptsRemaining} attempts remaining.`)
        } else {
          setOtpError(data.message || data.error || 'Failed to verify OTP')
        }
        return
      }

      // Success!
      onSuccess(email, data.verificationToken, businessName)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify OTP'
      setOtpError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md mx-auto space-y-6"
    >
      {step === 'email' ? (
        // Email Input Step
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-2">Your Email Address *</label>
            <motion.input
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              type="email"
              required
              placeholder="owner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder:text-blue-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-2">Business Name *</label>
            <motion.input
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              type="text"
              required
              placeholder="e.g., The Coffee House"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder:text-blue-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-semibold hover:from-blue-500 hover:to-indigo-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </motion.button>
        </form>
      ) : (
        // OTP Verification Step
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-blue-700 mb-1">OTP sent to</p>
            <p className="text-lg font-semibold text-blue-900">{maskedEmail}</p>
            <p className="text-sm text-green-600 font-medium mt-3">Verify to unlock your 14-day free trial</p>
          </motion.div>

          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-3 text-center">
              Enter 6-digit code
            </label>
            <OtpInput
              length={6}
              onComplete={setOtp}
              disabled={isLoading}
              error={otpError || undefined}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setOtp('')
                setCountdownSeconds(0)
                setOtpError(null)
              }}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition disabled:opacity-60"
            >
              ← Change Email
            </button>

            <motion.button
              type="button"
              onClick={() => {
                setCountdownSeconds(600)
                handleRequestOtp({
                  preventDefault: () => {}
                } as React.FormEvent)
              }}
              disabled={isLoading || countdownSeconds > 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {countdownSeconds > 0 ? `Resend (${formatCountdown(countdownSeconds)})` : 'Resend OTP'}
            </motion.button>
          </div>

          <motion.button
            type="button"
            onClick={handleVerifyOtp}
            disabled={isLoading || otp.length !== 6}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg font-semibold hover:from-green-500 hover:to-emerald-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              '✓ Verify & Unlock Free Trial'
            )}
          </motion.button>

          {attemptsRemaining < 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm"
            >
              ⚠️ {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  )
}
