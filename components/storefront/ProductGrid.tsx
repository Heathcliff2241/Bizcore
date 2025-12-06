/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import type { StorefrontContext } from './types'
import { useCart } from './hooks/useCart'

interface Product {
  id: number
  name: string
  price: number
  imageUrl?: string
  slug: string
}

interface ProductGridProps {
  products?: Product[]
  columns?: number
  showPrice?: boolean
  showRating?: boolean
  title?: string
  backgroundColor?: string
  storefront?: StorefrontContext
  height?: number
  size?: {
    width?: number
    height?: number
  }
  fullWidth?: boolean
  showAddToCart?: boolean
}

export function ProductGrid({
  products = [],
  columns = 3,
  showPrice = true,
  title,
  backgroundColor,
  storefront,
  height,
  size,
  fullWidth = true,
  showAddToCart = true
}: ProductGridProps) {
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()
  const { addToCart } = useCart(storefront?.subdomain, session?.user?.id)

  // Fetch products if none provided and we have storefront context
  useEffect(() => {
    if (products.length === 0 && storefront?.subdomain) {
      setLoading(true)
      fetch(`/api/storefront/${storefront.subdomain}/products?limit=12`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.products) {
            const transformedProducts = data.products.map((p: any) => ({
              id: p.id,
              name: p.name,
              price: Number(p.price),
              imageUrl: p.image,
              slug: `product-${p.id}`
            }))
            setFetchedProducts(transformedProducts)
          }
        })
        .catch(err => console.error('Failed to fetch products:', err))
        .finally(() => setLoading(false))
    }
  }, [products.length, storefront?.subdomain])

  // Use provided products, or fetched products, or mock products as fallback
  const displayProducts = products.length > 0 
    ? products 
    : fetchedProducts.length > 0 
      ? fetchedProducts 
      : [
          { id: 1, name: 'Product 1', price: 29.99, slug: 'product-1' },
          { id: 2, name: 'Product 2', price: 39.99, slug: 'product-2' },
          { id: 3, name: 'Product 3', price: 49.99, slug: 'product-3' },
          { id: 4, name: 'Product 4', price: 59.99, slug: 'product-4' },
          { id: 5, name: 'Product 5', price: 69.99, slug: 'product-5' },
          { id: 6, name: 'Product 6', price: 79.99, slug: 'product-6' },
        ]

  const resolvedHeight = height ?? size?.height
  const basePadding = resolvedHeight ? Math.max(24, Math.min(resolvedHeight / 6, 72)) : 64
  const isInDesigner = !!size

  const defaultGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

  return (
    <section 
      className={`w-full ${isInDesigner || fullWidth ? '' : 'px-8 md:px-16 lg:px-24'}`}
      style={{
        background: backgroundColor || defaultGradient,
        minHeight: resolvedHeight ? `${resolvedHeight}px` : undefined,
        padding: isInDesigner ? '16px' : `${basePadding}px 0`
      }}
    >
      <div className={`w-full ${!fullWidth && !isInDesigner ? 'max-w-7xl mx-auto' : ''} h-full flex flex-col`}>
        {title && (
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            {title}
          </h2>
        )}
        
        <div 
          className="grid gap-6 flex-1"
          style={{ 
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {loading ? (
            // Loading skeleton with glass effect
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div 
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    padding: '16px'
                  }}
                >
                  <div className="bg-white bg-opacity-20 aspect-square rounded-2xl mb-4"></div>
                  <div className="h-4 bg-white bg-opacity-20 rounded mb-2"></div>
                  <div className="h-4 bg-white bg-opacity-20 rounded w-2/3"></div>
                </div>
              </div>
            ))
          ) : (
            displayProducts.map((product, index) => (
              <div
                key={product.id}
                className="group cursor-pointer"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Card with glass morphism effect */}
                <div
                  className="h-full flex flex-col transition-all duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Image */}
                  <div 
                    className="relative overflow-hidden aspect-square mb-4 transition-transform duration-500 group-hover:scale-105"
                    style={{
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)'
                    }}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-white opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3 flex-1 flex flex-col">
                    <h3 
                      className="font-semibold text-white text-base leading-tight"
                      style={{
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        minHeight: '40px'
                      }}
                    >
                      {product.name}
                    </h3>

                    {showPrice && (
                      <p className="text-xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        ₱{product.price.toFixed(2)}
                      </p>
                    )}

                    {/* Add to Cart Button */}
                    {showAddToCart && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('Add to cart clicked for:', product.name, 'subdomain:', storefront?.subdomain)
                          addToCart({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            imageUrl: product.imageUrl,
                            quantity: 1
                          })
                          toast.success(`${product.name} added to cart!`, {
                            duration: 3000,
                            position: 'bottom-right'
                          })
                          console.log('Added to cart successfully')
                        }}
                        className="w-full px-4 py-2.5 rounded-xl font-semibold text-sm text-white mt-auto transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          backdropFilter: 'blur(5px)',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                          cursor: 'pointer'
                        }}
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}
