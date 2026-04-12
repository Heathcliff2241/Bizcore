'use client'

import { useState, useEffect } from 'react'
import { getViewedProducts } from './hooks/useProductViewTracking'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { StorefrontContext } from './types'
import { resolveStorefrontHref } from './utils/links'

interface RecentlyViewedProps {
  storefront?: StorefrontContext
  limit?: number
}

interface ViewedProduct {
  id: number
  name: string
  slug: string
  timestamp: number
}

export function RecentlyViewedProducts({ storefront, limit = 5 }: RecentlyViewedProps) {
  const [products, setProducts] = useState<ViewedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const viewed = getViewedProducts()
    setProducts(viewed.slice(0, limit))
    setIsLoading(false)
  }, [limit])

  if (isLoading || products.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 mb-8"
    >
      <h3 className="text-xl font-bold mb-4">Recently Viewed</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((product) => {
          const resolved = resolveStorefrontHref(`/home/${product.slug}`, storefront)
          return (
            <motion.div
              key={`${product.id}-${product.timestamp}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Link href={resolved.href} className="group">
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg overflow-hidden mb-2 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 line-clamp-2">
                  {product.name}
                </h4>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}
