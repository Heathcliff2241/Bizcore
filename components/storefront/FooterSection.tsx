"use client"

import type { StorefrontContext } from './types'

interface FooterSectionProps {
  storefront?: StorefrontContext
  backgroundColor?: string
  textColor?: string
  height?: number
  size?: {
    width?: number
    height?: number
  }
  fullWidth?: boolean
  companyName?: string
}

export function FooterSection({
  backgroundColor = '#0a0a0a',
  textColor = '#ffffff',
  height,
  size,
  companyName
}: FooterSectionProps) {
  const resolvedHeight = height ?? size?.height ?? 180

  return (
    <footer 
      className="w-full flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundColor,
        color: textColor,
        height: `${resolvedHeight}px`,
        minHeight: `${resolvedHeight}px`,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
        }}
      />

      <div className="text-center z-10 px-4 sm:px-8 md:px-12">
        <p className="text-lg sm:text-xl text-gray-400 mb-2 sm:mb-3 tracking-wide font-light">
          Proudly powered by
        </p>
        <h2
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 25%, #c084fc 50%, #e879f9 75%, #60a5fa 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradient-shift 8s ease infinite',
            filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.4))',
            letterSpacing: '-0.02em',
          }}
        >
          BizCore
        </h2>
        <div
          className="mt-3 sm:mt-4 h-1 mx-auto rounded-full"
          style={{
            width: '120px',
            background: 'linear-gradient(90deg, transparent 0%, #a78bfa 50%, transparent 100%)',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)',
          }}
        />
        <p className="text-xs sm:text-sm opacity-60 mt-3 sm:mt-4">
          &copy; {new Date().getFullYear()} {companyName || 'Storefront'}. All rights reserved.
        </p>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </footer>
  )
}
