'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Palette, ShoppingCart, Package, BarChart3, ArrowLeft } from 'lucide-react'

interface BrandStudioFrameProps {
  className?: string
}

export default function BrandStudioFrame({ className = '' }: BrandStudioFrameProps) {
  const params = useParams()
  const rawSubdomain = params.subdomain
  const subdomain = Array.isArray(rawSubdomain) ? rawSubdomain[0] : rawSubdomain ?? ''
  const backUrl = subdomain ? `/dashboard/${subdomain}` : '/'

  return (
    <div className={`flex flex-col items-center justify-center min-h-[600px] w-full p-6 text-center ${className}`}>
      {/* Glow Effect Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 blur-3xl animate-pulse" />
      </div>

      {/* Main Glass Card */}
      <div className="relative max-w-lg w-full bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:shadow-amber-500/5">
        
        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 shadow-inner">
          <Palette className="w-8 h-8 text-amber-600 animate-wiggle" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-amber-100 text-amber-800 border border-amber-200/50 mb-4 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          POS Focus Build
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-3">
          BrandStudio Creative Suite
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed mb-8">
          This workspace is optimized exclusively for **Point of Sale (POS)** and **Inventory Management** workflows. 
          The drag-and-drop storefront builder has been deactivated to streamline operations.
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-gray-200/60 mb-6" />

        {/* Active Subsystems Checklist */}
        <div className="text-left mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Available Modules in this Build
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-gray-700">POS Checkout</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <Package className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-gray-700">Live Inventory</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-gray-700">POS Analytics</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 line-through">
              <Palette className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-400">Storefront Editor</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href={backUrl}
            className="group flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gray-900 text-white font-medium transition-all duration-300 hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-900/10"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}