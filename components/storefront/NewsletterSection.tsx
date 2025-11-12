'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'

interface NewsletterSectionProps {
  heading?: string
  subheading?: string
  buttonText?: string
  placeholder?: string
  backgroundColor?: string
  textColor?: string
  height?: number
  size?: {
    width?: number
    height?: number
  }
}

export function NewsletterSection({
  heading = 'Join Our Newsletter',
  subheading = 'Get exclusive offers and updates',
  buttonText = 'Subscribe',
  placeholder = 'Enter your email',
  backgroundColor = '#1f2937',
  textColor = '#ffffff',
  height,
  size
}: NewsletterSectionProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success')
      setEmail('')
      setTimeout(() => setStatus('idle'), 3000)
    }, 1000)
  }

  const resolvedHeight = height ?? size?.height
  const basePadding = resolvedHeight ? Math.max(24, Math.min(resolvedHeight / 4, 96)) : 80

  const sectionStyle: CSSProperties = {
    backgroundColor,
    minHeight: resolvedHeight ? `${resolvedHeight}px` : undefined,
    paddingBlock: `${basePadding}px`
  }

  if (resolvedHeight) {
    sectionStyle.display = 'flex'
    sectionStyle.alignItems = 'center'
  }

  return (
    <section 
      className="px-8 md:px-16 lg:px-24 w-full"
      style={sectionStyle}
    >
      <div className="w-full max-w-3xl mx-auto text-center">
        <h2 
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ color: textColor }}
        >
          {heading}
        </h2>
        
        {subheading && (
          <p 
            className="text-lg mb-8 opacity-90"
            style={{ color: textColor }}
          >
            {subheading}
          </p>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : buttonText}
          </button>
        </form>
        
        {status === 'success' && (
          <p className="mt-4 text-green-400 font-medium">
            ✓ Successfully subscribed!
          </p>
        )}
        
        {status === 'error' && (
          <p className="mt-4 text-red-400 font-medium">
            ✗ Something went wrong. Please try again.
          </p>
        )}
      </div>
    </section>
  )
}
