import React from 'react'

export default function BizCoreWordmark({ className = 'text-3xl' }: { className?: string }) {
  return (
    <span className={`inline-block font-black tracking-tight text-slate-900 ${className}`} aria-label="BizCore">
      BizCore
    </span>
  )
}
