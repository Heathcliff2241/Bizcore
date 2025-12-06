"use client"

import Image from 'next/image'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCustomerSession } from './hooks/useCustomerSession'
import type { StorefrontContext } from './types'
import { useCart } from './hooks/useCart'
import { resolveStorefrontHref } from './utils/links'

interface ProductDetailProps {
  id: number | string
  slug: string
  name: string
  price: number
  image?: string
  description?: string
  storefront?: StorefrontContext
}

export function ProductDetail({ id, slug, name, price, image, description, storefront }: ProductDetailProps) {
  const { data: session } = useCustomerSession()
  const { addToCart } = useCart(storefront?.subdomain, session?.user?.id)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    setLoading(true)
    try {
      addToCart({ id, name, price, quantity: qty })
      // simple feedback (could be a toast)
      window.alert(`${qty} x ${name} added to cart`)
    } finally {
      setLoading(false)
    }
  }

  const viewCartUrl = resolveStorefrontHref('/cart', storefront)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <div className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
        {image ? (
          <div className="relative w-full aspect-[4/3]">
            <Image src={image} alt={name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>

      <div className="w-full">
        <h1 className="text-2xl font-bold mb-2">{name}</h1>
        <p className="text-xl font-semibold text-emerald-600 mb-4">₱{price.toFixed(2)}</p>
        {description && <p className="mb-6 text-slate-600">{description}</p>}

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-slate-700">Quantity</label>
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value || 1))} className="w-20 p-2 border rounded" />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleAdd} disabled={loading} className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800">
            {loading ? 'Adding…' : `Add to cart`}
          </button>
          {viewCartUrl && (
            <a href={viewCartUrl.href} className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50">View cart</a>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
