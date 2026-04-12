/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import type { StorefrontContext } from './types'
import { useCart } from './hooks/useCart'
import type { CartItem } from './hooks/useCart'

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

interface ProductGridSimpleProps {
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
}

export function ProductGridSimple({
  products = [],
  columns = 3,
  showPrice = true,
  title,
  backgroundColor = '#ffffff',
  storefront,
  height,
  size,
  fullWidth = true
}: ProductGridSimpleProps) {
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
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

  const displayProducts = products.length > 0 
    ? products 
    : fetchedProducts.length > 0 
      ? fetchedProducts 
      : [
          { id: 1, name: 'Product 1', price: 29.99, slug: 'product-1' },
          { id: 2, name: 'Product 2', price: 39.99, slug: 'product-2' },
          { id: 3, name: 'Product 3', price: 49.99, slug: 'product-3' },
        ]

  const resolvedHeight = size?.height ?? height
  const isInDesigner = size !== undefined

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
      imageUrl: selectedProduct.imageUrl || selectedProduct.image
    }
    addToCart(cartItem)
    toast.success('Added to cart!')
    setSelectedProduct(null)
  }

  return (
    <section
      style={{
        background: backgroundColor,
        minHeight: resolvedHeight ? `${resolvedHeight}px` : undefined,
        padding: isInDesigner ? '16px' : '60px 0'
      }}
    >
      <div className={`w-full ${!fullWidth && !isInDesigner ? 'max-w-7xl mx-auto' : ''} h-full flex flex-col px-4 md:px-8`}>
        {title && (
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-900">
            {title}
          </h2>
        )}
        
        <div 
          className="grid gap-8 flex-1"
          style={{ 
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))
          ) : (
            displayProducts.map((product, index) => {
              const hasVariants = (product.productVariants?.length ?? 0) > 0
              
              return (
                <div
                  key={product.id}
                  className="group cursor-pointer"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  {/* Card with shadow */}
                  <div
                    className="h-full flex flex-col transition-all duration-300 overflow-hidden rounded-lg"
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
                    {/* Image Container */}
                    <div 
                      className="relative overflow-hidden aspect-square bg-gray-100 transition-transform duration-500 group-hover:scale-105"
                    >
                      {product.imageUrl || product.image ? (
                        <Image
                          src={(product.imageUrl || product.image) as string}
                          alt={product.name}
                          fill
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {hasVariants && (
                        <button
                          onClick={() => handleProductClick(product)}
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: 'rgba(0, 0, 0, 0.6)'
                          }}
                        >
                          <span className="py-2 px-6 font-semibold text-white text-sm rounded-lg bg-blue-600 hover:bg-blue-700">
                            Quick Shop
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">{product.name}</h3>
                      
                      {showPrice && (
                        <p className="text-xl font-bold text-blue-600 mb-3">
                          ${product.price.toFixed(2)}
                        </p>
                      )}

                      {!hasVariants && (
                        <button
                          onClick={() => {
                            setSelectedProduct(product)
                            setQuantity(1)
                            handleAddToCart()
                          }}
                          className="mt-auto py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add to Cart
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

      {/* Modal for variant selection */}
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
