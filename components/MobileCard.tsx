'use client'

/**
 * Mobile Card Component
 * Converts table rows to mobile-friendly cards on small screens
 */

import { ReactNode } from 'react'

interface MobileCardProps {
  children: ReactNode
  className?: string
}

export function MobileCard({ children, className = '' }: MobileCardProps) {
  return (
    <div
      className={`block lg:hidden bg-white rounded-lg border border-gray-200 p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      {children}
    </div>
  )
}

interface MobileCardRowProps {
  label: string
  value: ReactNode
  className?: string
}

export function MobileCardRow({ label, value, className = '' }: MobileCardRowProps) {
  return (
    <div className={`flex justify-between items-start gap-4 ${className}`}>
      <span className="text-sm font-medium text-gray-600 min-w-[100px]">{label}:</span>
      <div className="text-sm text-gray-900 font-medium text-right flex-1">{value}</div>
    </div>
  )
}

interface MobileCardActionsProps {
  children: ReactNode
  className?: string
}

export function MobileCardActions({ children, className = '' }: MobileCardActionsProps) {
  return (
    <div className={`flex gap-2 pt-3 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  )
}


