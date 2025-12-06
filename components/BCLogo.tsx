import React from 'react'

export default function BCLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="BizCore logo"
    >
      <defs>
        <linearGradient id="bc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      {/* Container */}
      <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#bc-grad)" />

      {/* B – clear spine + two bowls */}
      <path
        d="
          M22 20
          v24
          m0-24
          c10 0 14 4 14 10
          c0 6-4 8-8 9
          c4 1 8 3 8 9
          c0 6-4 10-14 10
        "
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* C – open, unmistakable */}
      <path
        d="
          M42 22
          c-6 0-10 4-10 10
          s4 10 10 10
        "
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
