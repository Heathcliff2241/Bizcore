import Image from 'next/image'
import Link from 'next/link'
import type { StorefrontContext } from './types'
import { resolveStorefrontHref } from './utils/links'

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
}

export function ProductGrid({
  products = [],
  columns = 3,
  showPrice = true,
  showRating = false,
  title,
  backgroundColor = '#ffffff',
  storefront,
  height,
  size
}: ProductGridProps) {
  // Mock products if none provided
  const displayProducts = products.length > 0 ? products : [
    { id: 1, name: 'Product 1', price: 29.99, slug: 'product-1' },
    { id: 2, name: 'Product 2', price: 39.99, slug: 'product-2' },
    { id: 3, name: 'Product 3', price: 49.99, slug: 'product-3' },
    { id: 4, name: 'Product 4', price: 59.99, slug: 'product-4' },
    { id: 5, name: 'Product 5', price: 69.99, slug: 'product-5' },
    { id: 6, name: 'Product 6', price: 79.99, slug: 'product-6' },
  ]

  const resolvedHeight = height ?? size?.height
  const basePadding = resolvedHeight ? Math.max(24, Math.min(resolvedHeight / 6, 72)) : 64

  return (
    <section 
      className="px-8 md:px-16 lg:px-24 w-full"
      style={{
        backgroundColor,
        minHeight: resolvedHeight ? `${resolvedHeight}px` : undefined,
        paddingBlock: `${basePadding}px`
      }}
    >
      <div className="w-full max-w-7xl mx-auto h-full flex flex-col">
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {title}
          </h2>
        )}
        
        <div 
          className="grid gap-6 flex-1"
          style={{ 
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {displayProducts.map((product) => {
            const resolved = resolveStorefrontHref(`/products/${product.slug}`, storefront)
            return (
              <Link
                key={product.id}
                href={resolved.href}
                className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                target={resolved.isExternal ? '_blank' : undefined}
                rel={resolved.isExternal ? 'noopener noreferrer' : undefined}
              >
              <div className="aspect-square bg-gray-200 relative overflow-hidden">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                
                {showPrice && (
                  <p className="text-2xl font-bold text-gray-900">
                    ${product.price.toFixed(2)}
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
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
