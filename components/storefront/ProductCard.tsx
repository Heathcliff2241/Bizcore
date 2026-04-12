'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useCustomerSession } from './hooks/useCustomerSession'
import { useCart } from './hooks/useCart'
import { resolveStorefrontHref } from './utils/links'
import { getResponsiveSizes } from './utils/responsiveImages'
import type { StorefrontContext } from './types'

interface Product {
  id: number
  name: string
  price: number
  imageUrl?: string
  slug: string
}

interface ProductCardProps {
  product: Product
  showPrice?: boolean
  showRating?: boolean
  showAddToCart?: boolean
  storefront?: StorefrontContext
}

export function ProductCard({
  product,
  showPrice = true,
  showRating = false,
  showAddToCart = true,
  storefront
}: ProductCardProps) {
  const { data: session } = useCustomerSession()
  const { addToCart } = useCart(storefront?.subdomain, session?.user?.id)
  const [isAdding, setIsAdding] = useState(false)
  const [showAddedFeedback, setShowAddedFeedback] = useState(false)

  const resolved = resolveStorefrontHref(`/home/${product.slug}`, storefront)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsAdding(true)
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1
    })

    setShowAddedFeedback(true)
    setTimeout(() => setShowAddedFeedback(false), 2000)
    setTimeout(() => setIsAdding(false), 300)
  }

  return (
    <div className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow h-full flex flex-col">
      {/* Product Image */}
      <Link href={resolved.href} target={resolved.isExternal ? '_blank' : undefined} rel={resolved.isExternal ? 'noopener noreferrer' : undefined}>
        <div className="aspect-square bg-gray-200 relative overflow-hidden cursor-pointer">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes={getResponsiveSizes('product')}
              loading="lazy"
              quality={75}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        <Link href={resolved.href} target={resolved.isExternal ? '_blank' : undefined} rel={resolved.isExternal ? 'noopener noreferrer' : undefined}>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2 cursor-pointer">
            {product.name}
          </h3>
        </Link>

        {/* Price and Rating */}
        <div className="mb-4 flex-1">
          {showPrice && (
            <p className="text-2xl font-bold text-emerald-600">
              ₱{product.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}

          {showRating && (
            <div className="flex items-center mt-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">(4.5)</span>
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        {showAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-all ${
              showAddedFeedback
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
            } ${isAdding ? 'opacity-75' : ''}`}
          >
            <ShoppingCart size={18} />
            {showAddedFeedback ? 'Added!' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  )
}
