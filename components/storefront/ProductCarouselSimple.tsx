/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import type { StorefrontContext } from './types'
import { useCart } from './hooks/useCart'
import type { CartItem } from './hooks/useCart'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

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

interface ProductCarouselSimpleProps {
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
}

export function ProductCarouselSimple({
  products = [],
  itemsToShow = 4,
  autoPlay = true,
  interval = 5000,
  infinite = true,
  showDots = true,
  showArrows = true,
  title,
  backgroundColor = '#ffffff',
  storefront,
  height,
  size,
  fullWidth = true
}: ProductCarouselSimpleProps) {
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const { data: session } = useSession()
  const { addToCart } = useCart(storefront?.subdomain, session?.user?.id)

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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setSelectedVariant(null)
    setQuantity(1)
  }

  const handleAddToCart = async () => {
    if (!selectedProduct) return
    const cartItem: CartItem = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedVariant?.price || selectedProduct.price,
      quantity,
      imageUrl: selectedProduct.imageUrl
    }
    addToCart(cartItem)
    toast.success('Added to cart!')
    setSelectedProduct(null)
  }

  const resolvedHeight = size?.height ?? height ?? 400
  const isInDesigner = size !== undefined
  const basePadding = isInDesigner ? 16 : 60

  const visibleProducts = displayProducts.slice(currentIndex, currentIndex + itemsToShow)

  return (
    <section
      style={{
        background: backgroundColor,
        minHeight: `${resolvedHeight}px`,
        padding: isInDesigner ? '16px' : `${basePadding}px 0`
      }}
    >
      <div className={`w-full ${!fullWidth && !isInDesigner ? 'max-w-7xl mx-auto' : ''} h-full flex flex-col px-4 md:px-8`}>
        {title && (
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-900">
            {title}
          </h2>
        )}

        {/* Carousel Container */}
        <div className="relative flex-1 flex items-center">
          {/* Previous Button */}
          {showArrows && (
            <button
              onClick={handlePrev}
              className="absolute left-0 z-10 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
              disabled={!canGoPrev}
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
            </button>
          )}

          {/* Products Grid */}
          <div className="w-full px-12 flex-1">
            {loading ? (
              <div className="flex gap-4">
                {Array.from({ length: itemsToShow }).map((_, i) => (
                  <div key={i} className="flex-1 animate-pulse">
                    <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-4">
                {visibleProducts.map((product, index) => {
                  const hasVariants = (product.productVariants?.length ?? 0) > 0
                  return (
                    <div
                      key={product.id}
                      className="flex-1 group cursor-pointer"
                      style={{
                        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                      }}
                    >
                      {/* Card */}
                      <div
                        className="h-full flex flex-col transition-all duration-300 rounded-lg overflow-hidden"
                        style={{
                          background: '#ffffff',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          border: '1px solid #e5e7eb'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)'
                          e.currentTarget.style.transform = 'translateY(-4px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        {/* Image */}
                        <div className="relative overflow-hidden aspect-square bg-gray-100">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}

                          {hasVariants && (
                            <button
                              onClick={() => handleProductClick(product)}
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{ background: 'rgba(0, 0, 0, 0.6)' }}
                            >
                              <span className="py-2 px-4 font-semibold text-white text-sm rounded-lg bg-blue-600 hover:bg-blue-700">
                                Shop
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-3">
                          <h3 className="font-bold text-base text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-lg font-bold text-blue-600">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Next Button */}
          {showArrows && (
            <button
              onClick={handleNext}
              className="absolute right-0 z-10 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
              disabled={!canGoNext}
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>

        {/* Dots */}
        {showDots && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.max(0, displayProducts.length - itemsToShow + 1) }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentIndex(i)
                  setAutoPlayEnabled(false)
                }}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: currentIndex === i ? '#3b82f6' : '#d1d5db'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {selectedProduct.productVariants && selectedProduct.productVariants.length > 0 ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Variant
                    </label>
                    <select
                      value={selectedVariant?.id ?? ''}
                      onChange={(e) => {
                        const variant = selectedProduct.productVariants?.find(v => v.id === Number(e.target.value))
                        setSelectedVariant(variant || null)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a variant</option>
                      {selectedProduct.productVariants.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} - ${v.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-center"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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
