'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductCard } from './ProductCard'
import type { StorefrontContext } from './types'

interface Product {
  id: number
  name: string
  price: number
  imageUrl?: string
  slug: string
  categoryName?: string
}

interface MenuWithCategoriesProps {
  products: Product[]
  storefront: StorefrontContext
  fullWidth?: boolean
}

interface ProductsByCategory {
  [categoryName: string]: Product[]
}

export function MenuWithCategories({ products, storefront, fullWidth = true }: MenuWithCategoriesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Group products by category and calculate categories
  const { categorizedProducts, categories } = useMemo(() => {
    const grouped: ProductsByCategory = {}
    
    products.forEach(product => {
      const category = product.categoryName || 'Uncategorized'
      
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(product)
    })

    const cats = Object.keys(grouped).sort()
    return {
      categorizedProducts: grouped,
      categories: cats
    }
  }, [products])

  // Filter products based on selected category
  const displayedProducts = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') {
      return products
    }
    return categorizedProducts[selectedCategory] || []
  }, [selectedCategory, products, categorizedProducts])

  return (
    <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''}`}>
      <div className={`w-full space-y-8 ${fullWidth ? 'px-8 md:px-16 lg:px-24' : ''}`}>
      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 md:gap-3">
          <motion.button
            onClick={() => setSelectedCategory('all')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 ${
              selectedCategory === 'all' || !selectedCategory
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Products
          </motion.button>
          
          <AnimatePresence mode="wait">
            {categories.map((category, idx) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Products Grid */}
      <div>
        <AnimatePresence mode="wait">
          {displayedProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-slate-500 font-medium text-lg">No products found</p>
              <p className="text-slate-400 text-sm mt-2">Try selecting a different category</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {displayedProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ProductCard
                    product={product}
                    storefront={storefront}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  )
}
