/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import type { StorefrontContext } from './types'
import { useCart } from './hooks/useCart'
import Image from 'next/image'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ProductVariant {
  id: number
  name: string
  price: number
  isActive: boolean
}

interface Product {
  id: number
  name: string
  price: number
  description?: string
  imageUrl?: string
  image?: string
  slug: string
  productVariants?: ProductVariant[]
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
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
              imageUrl: p.image || p.imageUrl,
              image: p.image,
              slug: `product-${p.id}`,
              productVariants: p.productVariants || []
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

  const handleProductClick = (product: Product) => {
    if ((product.productVariants?.length ?? 0) > 0) {
      setSelectedProduct(product)
      setSelectedVariant(null)
      setQuantity(1)
    } else {
      handleAddToCart(product, null)
    }
  }

  const handleAddToCart = (product: Product, variant: ProductVariant | null) => {
    const finalPrice = variant ? variant.price : product.price
    const itemName = variant ? `${product.name} - ${variant.name}` : product.name
    
    console.log('[ProductGrid] Adding to cart:', { product, variant, quantity, subdomain: storefront?.subdomain, sessionId: session?.user?.id })
    
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: itemName,
        price: finalPrice,
        imageUrl: product.imageUrl || product.image,
        quantity: 1,
        variantId: variant?.id
      })
    }
    
    toast.success(`${quantity}x ${itemName} added to cart!`, {
      duration: 3000,
      position: 'bottom-right'
    })
    
    setSelectedProduct(null)
    setSelectedVariant(null)
    setQuantity(1)
  }

  return (
    <section 
      className={`w-full px-4 sm:px-6 md:px-8 ${isInDesigner || fullWidth ? '' : 'lg:px-12'}`}
      style={{
        background: backgroundColor || defaultGradient,
        minHeight: resolvedHeight ? `${resolvedHeight}px` : undefined,
        padding: isInDesigner ? '16px' : `${Math.max(16, Math.min(basePadding, 64))}px clamp(1rem, 5vw, 3rem)`
      }}
    >
      <div className={`w-full ${!fullWidth && !isInDesigner ? 'max-w-7xl mx-auto' : ''} h-full flex flex-col`}>
        {title && (
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-10 md:mb-12 text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            {title}
          </h2>
        )}
        
        <div 
          className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 flex-1"
          style={{ 
            gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, clamp(160px, 22vw, 280px)), 1fr))`,
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
            displayProducts.map((product, index) => {
              const hasVariants = (product.productVariants?.length ?? 0) > 0
              
              return (
                <div
                  key={product.id}
                  className="group cursor-pointer relative"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  {/* Card with glass morphism effect */}
                  <div
                    className="h-full flex flex-col transition-all duration-300 relative overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      padding: '16px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* Image Container */}
                    <div 
                      className="relative overflow-hidden aspect-square mb-4 transition-transform duration-500 group-hover:scale-105"
                      style={{
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)'
                      }}
                    >
                      {product.imageUrl || product.image ? (
                        <img
                          src={product.imageUrl || product.image}
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
                      
                      {/* Quick Shop Button - Overlay on Image */}
                      {hasVariants && (
                        <button
                          onClick={() => handleProductClick(product)}
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(4px)',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <span className="py-2 px-6 font-semibold text-white text-sm rounded-lg" style={{
                            background: 'rgba(102, 126, 234, 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}>
                            Quick Shop
                          </span>
                        </button>
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
                        hasVariants ? (
                          <p className="text-sm font-medium text-white/80" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            Click to select size
                          </p>
                        ) : (
                          <p className="text-xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            ₱{product.price.toFixed(2)}
                          </p>
                        )
                      )}

                      {/* Add to Cart or Select Variant Button */}
                      {showAddToCart && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleProductClick(product)
                          }}
                          className="w-full px-4 py-2.5 rounded-xl font-semibold text-sm text-white mt-auto transition-all duration-300 hover:scale-105 active:scale-95"
                          style={{
                            background: hasVariants 
                              ? 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)'
                              : 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            backdropFilter: 'blur(5px)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            cursor: 'pointer'
                          }}
                        >
                          {hasVariants ? 'Select Size' : 'Add to Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Popover Modal for Variant Selection */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-full transition-colors z-10"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>

            {/* Popover Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8">
              {/* Product Image */}
              <div className="flex items-center justify-center">
                <div
                  className="w-full aspect-square rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(100,200,255,0.2) 0%, rgba(150,100,255,0.2) 100%)'
                  }}
                >
                  {selectedProduct.imageUrl || selectedProduct.image ? (
                    <img
                      src={selectedProduct.imageUrl || selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details & Variant Selection */}
              <div className="flex flex-col justify-center space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-gray-600 mb-4">Select your preferred size</p>
                  {selectedProduct.description && (
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                      {selectedProduct.description}
                    </p>
                  )}
                </div>

                {/* Variant List */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedProduct.productVariants?.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!variant.isActive}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedVariant?.id === variant.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      } ${!variant.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{variant.name}</p>
                          <p className="text-sm text-gray-500">{variant.isActive ? 'Available' : 'Out of Stock'}</p>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                          ₱{variant.price.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700 transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center border-2 border-gray-300 rounded-lg py-2 font-semibold focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    if (!selectedVariant) {
                      toast.error('Please select a size', { duration: 2000 })
                      return
                    }
                    handleAddToCart(selectedProduct, selectedVariant)
                  }}
                  disabled={!selectedVariant}
                  className="w-full py-3 px-6 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: selectedVariant
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #ccc 0%, #999 100%)',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  Add {quantity}x to Cart - ₱{selectedVariant ? (selectedVariant.price * quantity).toFixed(2) : '0.00'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
