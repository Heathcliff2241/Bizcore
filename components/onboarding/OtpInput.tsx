'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface OtpInputProps {
  length?: number
  onComplete: (otp: string) => void
  disabled?: boolean
  error?: string
}

export default function OtpInput({ length = 6, onComplete, disabled = false, error }: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>(new Array(length).fill(null))

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (value: string, index: number) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only keep last digit

    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if complete
    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newOtp = [...otp]

      if (otp[index]) {
        // Clear current input
        newOtp[index] = ''
      } else if (index > 0) {
        // Focus previous and clear it
        newOtp[index - 1] = ''
        inputRefs.current[index - 1]?.focus()
      }

      setOtp(newOtp)
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '') // Extract only digits

    if (pastedData.length >= length) {
      const newOtp = pastedData.slice(0, length).split('')
      setOtp(newOtp)
      onComplete(newOtp.join(''))
      inputRefs.current[length - 1]?.focus()
    }
  }

  return (
    <div className="w-full">
      <div className="flex gap-3 justify-center mb-4">
        {otp.map((digit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <input
              ref={(ref) => {
                if (inputRefs.current) inputRefs.current[index] = ref
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              disabled={disabled}
              className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all focus:outline-none ${
                error
                  ? 'border-red-500 bg-red-50 text-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-500/20'
                  : digit
                    ? 'border-blue-600 bg-blue-50 text-blue-900 focus:border-blue-700 focus:ring-2 focus:ring-blue-500/20'
                    : 'border-blue-200 bg-white text-blue-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-text'}`}
            />
          </motion.div>
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 text-center font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
