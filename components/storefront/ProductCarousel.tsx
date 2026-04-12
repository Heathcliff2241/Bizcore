/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { StorefrontContext } from './types'
import { useCart } from './hooks/useCart'

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
  slug: string
  productVariants?: ProductVariant[]
}

interface ProductCarouselProps {
  products?: Product[]
  itemsToShow?: number
  autoPlay?: boolean
  interval?: number
  infinite?: boolean
  showDots?: boolean
  showArrows?: boolean
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

export function ProductCarousel({
  products = [],
  itemsToShow = 4,
  autoPlay = true,
  interval = 5000,
  infinite = true,
  showDots = true,
  showArrows = true,
  title,
  backgroundColor,
  storefront,
  height,
  size,
  fullWidth = true,
  showAddToCart = true
}: ProductCarouselProps) {
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay)
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

  // Auto-play carousel
  useEffect(() => {
    if (!autoPlayEnabled || displayProducts.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        const maxIndex = Math.max(0, displayProducts.length - itemsToShow)
        if (prev >= maxIndex) {
          return infinite ? 0 : prev
        }
        return prev + 1
      })
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlayEnabled, displayProducts.length, itemsToShow, infinite, interval])

  const maxIndex = Math.max(0, displayProducts.length - itemsToShow)
  const canGoNext = currentIndex < maxIndex || infinite
  const canGoPrev = currentIndex > 0 || infinite

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    } else if (infinite) {
      setCurrentIndex(maxIndex)
    }
    setAutoPlayEnabled(false)
  }

  const handleNext = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1)
    } else if (infinite) {
      setCurrentIndex(0)
    }
    setAutoPlayEnabled(false)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setAutoPlayEnabled(false)
  }

  const resolvedHeight = height ?? size?.height
  const basePadding = resolvedHeight ? Math.max(24, Math.min(resolvedHeight / 6, 72)) : 64
  const isInDesigner = !!size

  const defaultGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  const visibleProducts = displayProducts.slice(currentIndex, currentIndex + itemsToShow)

  // Handle product click - open modal if variants exist
  const handleProductClick = (product: Product) => {
    if ((product.productVariants?.length ?? 0) > 0) {
      setSelectedProduct(product)
      setSelectedVariant(null)
      setQuantity(1)
    } else {
      handleAddToCart(product, null)
    }
  }

  // Handle add to cart
  const handleAddToCart = (product: Product, variant: ProductVariant | null) => {
    const price = variant ? variant.price : product.price
    const variantName = variant ? ` - ${variant.name}` : ''
    
    addToCart({
      id: product.id,
      name: product.name + variantName,
      price: price,
      imageUrl: product.imageUrl,
      quantity: quantity
    })
    toast.success(`${product.name}${variantName} added to cart!`, {
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
      onMouseEnter={() => setAutoPlayEnabled(false)}
      onMouseLeave={() => autoPlay && setAutoPlayEnabled(true)}
    >
      <div className={`w-full ${!fullWidth && !isInDesigner ? 'max-w-7xl mx-auto' : ''} h-full flex flex-col`} style={{ gap: 'clamp(1.5rem, 4vw, 2rem)' }}>
        {title && (
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center text-white" style={{ margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            {title}
          </h2>
        )}
        
        {/* Carousel Container */}
        <div className="relative flex-1 flex items-center justify-center gap-2 sm:gap-3 md:gap-4" style={{ display: 'flex', alignItems: 'center' }}>
          {/* Previous Button */}
          {showArrows && (
            <button
              onClick={handlePrev}
              disabled={!canGoPrev && !infinite}
              style={{
                width: 'clamp(36px, 2.5vw, 44px)',
                height: 'clamp(36px, 2.5vw, 44px)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(5px)',
                cursor: !canGoPrev && !infinite ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                opacity: (!canGoPrev && !infinite) ? 0.5 : 1,
                color: 'white'
              }}
              aria-label="Previous products"
            >
              <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Products Grid */}
          <div className="relative flex-1 overflow-hidden">
            <div 
              className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-6 transition-all duration-500"
              style={{ 
                gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, clamp(140px, 20vw, 280px)), 1fr))`,
              }}
            >
              {loading ? (
                Array.from({ length: itemsToShow }).map((_, index) => (
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
                visibleProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="group cursor-default"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                  >
                    {/* Card with glass morphism effect */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-white opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Quick Shop Button Overlay */}
                        {showAddToCart && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleProductClick(product)
                            }}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: 'rgba(0, 0, 0, 0.4)',
                              backdropFilter: 'blur(4px)',
                              borderRadius: '16px'
                            }}
                          >
                            <div className="px-4 py-2 rounded-lg font-semibold text-sm text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                              {(product.productVariants?.length ?? 0) > 0 ? 'Quick Shop' : 'Add to Cart'}
                            </div>
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

                        {(product.productVariants?.length ?? 0) > 0 ? (
                          <p className="text-sm font-medium text-white/80" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            Click to select size
                          </p>
                        ) : (
                          <p className="text-xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            ₱{product.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Next Button */}
          {showArrows && (
            <button
              onClick={handleNext}
              disabled={!canGoNext && !infinite}
              style={{
                width: 'clamp(36px, 2.5vw, 44px)',
                height: 'clamp(36px, 2.5vw, 44px)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(5px)',
                cursor: !canGoNext && !infinite ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                opacity: (!canGoNext && !infinite) ? 0.5 : 1,
                color: 'white'
              }}
              aria-label="Next products"
            >
              <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Dots Indicator */}
        {showDots && displayProducts.length > itemsToShow && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.ceil(displayProducts.length - itemsToShow + 1) }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex ? 'w-8 h-3 bg-white' : 'w-3 h-3 bg-white bg-opacity-40 hover:bg-opacity-60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Variant Modal */}
      {selectedProduct && selectedProduct.productVariants && selectedProduct.productVariants.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
              <h3 className="text-xl font-bold text-gray-900">Select {selectedProduct.name}</h3>
              <button
                onClick={() => {
                  setSelectedProduct(null)
                  setSelectedVariant(null)
                  setQuantity(1)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 grid md:grid-cols-2 gap-6">
              {/* Product Image */}
              <div className="flex flex-col items-center justify-center bg-gray-100 rounded-xl p-4 md:h-96">
                {selectedProduct.imageUrl ? (
                  <div className="relative w-full h-64 md:h-80">
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* Variants Selection */}
              <div className="flex flex-col gap-4">
                {selectedProduct.description && (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Select Size</label>
                  <div className="space-y-2">
                    {selectedProduct.productVariants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          selectedVariant?.id === variant.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        disabled={!variant.isActive}
                        style={{ opacity: variant.isActive ? 1 : 0.5 }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{variant.name}</span>
                          <span className="text-lg font-bold text-gray-900">₱{variant.price.toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Selector */}
                {selectedVariant && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-lg font-bold">−</span>
                      </button>
                      <span className="text-lg font-semibold text-gray-900 w-8 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Total Price */}
                {selectedVariant && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total</span>
                      <span className="text-2xl font-bold text-gray-900">₱{(selectedVariant.price * quantity).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    if (selectedVariant) {
                      handleAddToCart(selectedProduct, selectedVariant)
                    }
                  }}
                  disabled={!selectedVariant}
                  className={`mt-6 w-full px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                    selectedVariant
                      ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 cursor-pointer'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {selectedVariant ? `Add ${quantity}× ${selectedVariant.name} to Cart` : 'Select a size'}
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
