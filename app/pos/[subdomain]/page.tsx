/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCartIcon,
  XMarkIcon,
  CheckCircleIcon,
  SparklesIcon,
  PowerIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  PhoneIcon,
  RectangleStackIcon,
  FireIcon,
  StarIcon,
  HeartIcon,
  BoltIcon
} from '@heroicons/react/24/outline'

interface ProductVariant {
  id: number
  name: string
  price: number
  isActive: boolean
  stockQuantity?: number
}

interface Product {
  id: number
  name: string
  price: number
  image?: string
  stockQuantity?: number
  category?: { name: string }
  productVariants?: ProductVariant[]
}

interface CartItem {
  product: Product
  variant?: ProductVariant
  quantity: number
  notes?: string
  itemPrice: number
}

interface EmployeeInfo {
  id: number
  firstName: string
  lastName: string
  email: string
  role: 'cashier' | 'manager' | 'admin'
}

interface TenantInfo {
  id: number
  name: string
  subdomain: string
}

export default function POSPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const { data: session, status } = useSession()

  const [employee, setEmployee] = useState<EmployeeInfo | null>(null)
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [tenantTaxRate, setTenantTaxRate] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  // Persist POS cart in localStorage so it survives refreshes
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(`pos_cart_${params?.subdomain}`) : null
      if (raw) return JSON.parse(raw) as CartItem[]
    } catch {
      // ignore
    }
    return []
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash')
  const [processingOrder, setProcessingOrder] = useState(false)
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null)
  const [variantModalQuantity, setVariantModalQuantity] = useState(1)
  const [receipt, setReceipt] = useState<any>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  // Check authentication and redirect if not authenticated
  const loadProductsAndSettings = useCallback(async () => {
    try {
      // Get employee and tenant info from session
      const sessionUser = session?.user as { id?: string; name?: string; email?: string; role?: string; tenantId?: string; subdomain?: string; userType?: string }
      if (!sessionUser.id || !sessionUser.tenantId) {
        router.push(`/pos/${subdomain}/login`)
        return
      }

      const employeeData: EmployeeInfo = {
        id: parseInt(sessionUser.id),
        firstName: sessionUser.name?.split(' ')[0] || 'Employee',
        lastName: sessionUser.name?.split(' ').slice(1).join(' ') || '',
        email: sessionUser.email || '',
        role: (sessionUser.role as 'cashier' | 'manager' | 'admin') || 'cashier'
      }

      const tenantData: TenantInfo = {
        id: parseInt(sessionUser.tenantId),
        name: 'Store',
        subdomain: sessionUser.subdomain || subdomain
      }

      setEmployee(employeeData)
      setTenant(tenantData)

      // Fetch products from API
      try {
        const res = await fetch('/api/pos/products')
        const data = await res.json()

        if (res.ok && Array.isArray(data.products)) {
          setProducts(data.products)
          const cats = new Set<string>(
            data.products.map((product: Product) => product.category?.name ?? 'Uncategorized')
          )
          setCategories(['all', ...Array.from(cats)])
          
          // Set default tax rate (can be customized per tenant)
          setTenantTaxRate(12) // Default 12% tax rate
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      setLoading(false)
    }
  }, [session?.user, subdomain, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/pos/${subdomain}/login`)
      return
    }

    if (status === 'authenticated' && session?.user) {
      const sessionUser = session.user as { userType?: string }
      if (sessionUser.userType !== 'pos_employee') {
        // Non-POS employees shouldn't access this page
        router.push(`/pos/${subdomain}/login`)
        return
      }

      // Load products and settings using NextAuth session
      loadProductsAndSettings()
    }
  }, [status, session, router, subdomain, loadProductsAndSettings])

  // Save POS cart to localStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`pos_cart_${subdomain}`, JSON.stringify(cart))
      }
    } catch (e) {
      console.warn('Unable to save POS cart to localStorage:', e)
    }
  }, [cart, subdomain])

  const addToCart = (product: Product, variant?: ProductVariant) => {
    // Determine which stock to check
    const availableStock = variant ? (variant.stockQuantity ?? 0) : (product.stockQuantity ?? 0)
    
    // Check if product is in stock
    if (availableStock <= 0) {
      alert('This product is out of stock')
      return
    }

    // If product has variants and no variant is selected, show modal
    if ((product.productVariants?.length ?? 0) > 0 && !variant) {
      setVariantModalProduct(product)
      setVariantModalQuantity(1)
      return
    }

    // Determine the final price
    const itemPrice = variant ? variant.price : product.price

    const existing = cart.find(item => 
      item.product.id === product.id && 
      (!variant || item.variant?.id === variant.id)
    )
    
    // Check if adding more would exceed available stock
    const requestedQuantity = existing ? existing.quantity + 1 : 1
    if (requestedQuantity > availableStock) {
      alert(`Only ${availableStock} unit(s) available in stock`)
      return
    }
    
    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id && (!variant || item.variant?.id === variant.id)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, variant, quantity: 1, itemPrice }])
    }
  }

  const removeFromCart = (productId: number, variantId?: number) => {
    setCart(cart.filter(item => !(item.product.id === productId && (variantId ? item.variant?.id === variantId : !item.variant))))
  }

  const updateQuantity = (productId: number, variantId: number | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId)
      return
    }

    // Find the cart item to check available stock
    const cartItem = cart.find(item => 
      item.product.id === productId && (variantId ? item.variant?.id === variantId : !item.variant)
    )

    if (!cartItem) return

    // Check available stock based on variant or product
    const availableStock = variantId 
      ? cartItem.variant?.stockQuantity ?? 0
      : cartItem.product.stockQuantity ?? 0

    // Validate quantity doesn't exceed stock
    if (quantity > availableStock) {
      alert(`Only ${availableStock} unit(s) available in stock`)
      return
    }

    setCart(cart.map(item =>
      item.product.id === productId && (variantId ? item.variant?.id === variantId : !item.variant)
        ? { ...item, quantity }
        : item
    ))
  }

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0)
    const tax = subtotal * (tenantTaxRate / 100)
    return { subtotal, tax, total: subtotal + tax }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setProcessingOrder(true)

    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        variantId: item.variant?.id ?? null,
        quantity: item.quantity,
        notes: item.notes
      }))

      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          paymentMethod,
          discount: 0
        }),
        credentials: 'include' // Include cookies for NextAuth session
      })

      if (res.ok) {
        const data = await res.json()
        
        // Clear cart
        setCart([])
        
        // Show receipt modal
        setReceipt(data.order)
        setShowReceipt(true)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to process order')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to process order')
    } finally {
      setProcessingOrder(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push(`/pos/${subdomain}/login`)
  }

  const getCategoryIcon = (category: string) => {
    const iconClass = "w-4 h-4"
    const categoryLower = category.toLowerCase()

    if (categoryLower.includes('drink') || categoryLower.includes('beverage')) return <PhoneIcon className={iconClass} />
    if (categoryLower.includes('food') || categoryLower.includes('meal')) return <RectangleStackIcon className={iconClass} />
    if (categoryLower.includes('hot') || categoryLower.includes('coffee')) return <FireIcon className={iconClass} />
    if (categoryLower.includes('sweet') || categoryLower.includes('dessert')) return <HeartIcon className={iconClass} />
    if (categoryLower.includes('premium') || categoryLower.includes('special')) return <StarIcon className={iconClass} />
    if (categoryLower.includes('fast') || categoryLower.includes('quick')) return <BoltIcon className={iconClass} />
    if (categoryLower.includes('all')) return <SparklesIcon className={iconClass} />
    
    return <RectangleStackIcon className={iconClass} />
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category?.name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const { subtotal, tax, total } = calculateTotal()

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 font-medium">Loading POS...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100"
    >
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white border-b border-slate-200/50 backdrop-blur-sm sticky top-0 z-40"
      >
        <div className="max-w-full px-6 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-slate-900">{tenant?.name}</h1>
                <p className="text-xs md:text-sm text-slate-500 truncate">
                  {employee?.firstName} {employee?.lastName} • {employee?.role && employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                </p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-xl md:text-2xl font-bold text-blue-900">BizCore POS</h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex-shrink-0 p-2 md:p-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Logout"
            >
              <PowerIcon className="w-5 h-5 md:w-6 md:h-6" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 flex overflow-hidden gap-0 md:gap-4 md:p-4">
        {/* Products Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex-1 flex flex-col overflow-hidden bg-white rounded-2xl md:rounded-3xl shadow-sm md:shadow-lg border border-slate-200/50"
        >
          {/* Search and Categories */}
          <div className="flex-shrink-0 p-4 md:p-6 border-b border-slate-200/50 space-y-3 md:space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 md:px-5 py-3 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400 text-slate-900"
              />
            </motion.div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              <AnimatePresence>
                {categories.map((cat, idx) => (
                  <motion.button
                    key={cat}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 flex items-center gap-2 ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {getCategoryIcon(cat)}
                    {cat === 'all' ? 'All' : cat}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <AnimatePresence mode="wait">
              {filteredProducts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-full text-center"
                >
                  <div>
                    <p className="text-slate-500 font-medium text-lg">No products found</p>
                    <p className="text-slate-400 text-sm mt-2">Try adjusting your search</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
                >
                  {filteredProducts.map((product, idx) => {
                    const isOutOfStock = (product.stockQuantity ?? 0) <= 0
                    const hasVariants = (product.productVariants?.length ?? 0) > 0
                    
                    return (
                    <motion.button
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      whileHover={!isOutOfStock ? { y: -8, scale: 1.02 } : {}}
                      whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock}
                      className={`relative bg-gradient-to-br from-white to-slate-50 rounded-xl md:rounded-2xl p-3 md:p-4 transition-all duration-200 text-left group border border-slate-200/50 ${
                        isOutOfStock 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:shadow-xl hover:border-blue-300/50'
                      }`}
                    >
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-red-500/10 rounded-xl md:rounded-2xl flex items-center justify-center">
                          <span className="text-sm font-semibold text-red-700">Out of Stock</span>
                        </div>
                      )}
                      <div className="relative mb-2 md:mb-3 overflow-hidden rounded-lg md:rounded-xl bg-slate-100 z-0">
                        {product.image ? (
                          <motion.div whileHover={!isOutOfStock ? { scale: 1.1 } : {}} className="overflow-hidden relative z-0">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={240}
                              height={128}
                              className={`w-full h-24 md:h-32 object-cover relative z-0 ${isOutOfStock ? 'grayscale' : ''}`}
                            />
                          </motion.div>
                        ) : (
                          <div className="w-full h-24 md:h-32 flex items-center justify-center bg-slate-100">
                            <RectangleStackIcon className={`w-10 h-10 md:w-12 md:h-12 ${isOutOfStock ? 'text-slate-300' : 'text-slate-400'}`} />
                          </div>
                        )}
                      </div>
                      {hasVariants && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10">
                          {product.productVariants?.length} sizes
                        </div>
                      )}
                      <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm md:text-base mb-1 md:mb-2">
                        {product.name}
                      </h3>
                      <div className="flex items-end justify-between gap-2">
                        <div className="flex-1">
                          {hasVariants ? (
                            <p className="text-xs text-slate-500 font-medium">Click to select size</p>
                          ) : (
                            <motion.p
                              whileHover={!isOutOfStock ? { scale: 1.05 } : {}}
                              className={`text-base md:text-lg font-bold ${
                                isOutOfStock
                                  ? 'text-gray-400'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent'
                              }`}
                            >
                              ₱{product.price.toFixed(2)}
                            </motion.p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg whitespace-nowrap ${
                          (product.stockQuantity ?? 0) > 5
                            ? 'bg-emerald-100 text-emerald-700'
                            : (product.stockQuantity ?? 0) > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {product.stockQuantity ?? 0} stock
                        </span>
                      </div>
                    </motion.button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Cart Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full md:w-96 lg:w-[420px] bg-white rounded-2xl md:rounded-3xl shadow-sm md:shadow-lg border border-slate-200/50 flex flex-col overflow-hidden flex-shrink-0"
        >
          {/* Cart Header */}
          <div className="flex-shrink-0 p-4 md:p-6 border-b border-slate-200/50 flex items-center gap-3">
            <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900">Order</h2>
              <p className="text-xs md:text-sm text-slate-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4">
            <AnimatePresence mode="popLayout">
              {cart.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-full text-center"
                >
                  <div>
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex justify-center mb-3"
                    >
                      <ShoppingCartIcon className="w-12 h-12 md:w-16 md:h-16 text-slate-300" />
                    </motion.div>
                    <p className="text-slate-500 font-medium">No items yet</p>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">Add products to start</p>
                  </div>
                </motion.div>
              ) : (
                cart.map((item, idx) => (
                  <motion.div
                    key={`${item.product.id}-${item.variant?.id ?? 'base'}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl md:rounded-2xl p-3 md:p-4 mb-3 md:mb-4 border border-slate-200/50 hover:border-blue-300/50 transition-colors group"
                  >
                    <div className="flex justify-between items-start gap-2 md:gap-3 mb-2 md:mb-3">
                      <h3 className="font-semibold text-slate-900 text-sm md:text-base line-clamp-1 flex-1">
                        {item.product.name}
                        {item.variant && <span className="text-slate-600"> - {item.variant.name}</span>}
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                        className="text-slate-400 hover:text-red-500 flex-shrink-0 p-1"
                      >
                        <XMarkIcon className="w-4 h-4 md:w-5 md:h-5" />
                      </motion.button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200/50 p-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)}
                          className="w-6 h-6 md:w-7 md:h-7 rounded text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center justify-center text-sm font-bold transition-colors"
                        >
                          −
                        </motion.button>
                        <span className="w-8 md:w-10 text-center font-bold text-slate-900 text-sm md:text-base">
                          {item.quantity}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)}
                          className="w-6 h-6 md:w-7 md:h-7 rounded text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center text-sm font-bold transition-colors"
                        >
                          +
                        </motion.button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs md:text-sm text-slate-500">
                          ₱{item.itemPrice.toFixed(2)} each
                        </p>
                        <p className="font-bold text-blue-600 text-sm md:text-base">
                          ₱{(item.itemPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Totals and Checkout */}
          <AnimatePresence>
            {cart.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-shrink-0 border-t border-slate-200/50 px-3 md:px-4 py-3 md:py-4 space-y-2.5 md:space-y-3 bg-gradient-to-t from-slate-50/50"
              >
                {/* Price Summary - Compact */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-1.5"
                >
                  <div className="flex justify-between text-xs md:text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm text-slate-600">
                    <span>Tax ({tenantTaxRate}%)</span>
                    <span className="font-medium">₱{tax.toFixed(2)}</span>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-between text-sm md:text-base font-bold pt-1.5 border-t border-slate-200/50"
                  >
                    <span className="text-slate-900">Total</span>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                      ₱{total.toFixed(2)}
                    </span>
                  </motion.div>
                </motion.div>

                {/* Payment Method - More Compact */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-xs md:text-xs font-semibold text-slate-900 mb-1.5">
                    Payment
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['cash', 'gcash'] as const).map((method) => (
                      <motion.button
                        key={method}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-1.5 md:py-2 px-2 md:px-3 rounded-lg font-medium text-xs capitalize transition-all duration-200 flex items-center justify-center gap-1 ${
                          paymentMethod === method
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {method === 'cash' && <CurrencyDollarIcon className="w-3.5 h-3.5" />}
                        {method === 'gcash' && <CreditCardIcon className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{method === 'gcash' ? 'GCash' : method}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Charge Button - Compact */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  disabled={processingOrder}
                  className="w-full py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm md:text-base rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingOrder ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span className="text-xs md:text-sm">Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-xs md:text-sm">Charge ₱{total.toFixed(2)}</span>
                    </>
                  )}
                </motion.button>

                {/* Clear Button - Compact */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCart([])}
                  className="w-full py-1.5 text-xs text-slate-600 hover:text-red-600 font-medium transition-colors"
                >
                  Clear
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Variant Selection Modal */}
      <AnimatePresence>
        {variantModalProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setVariantModalProduct(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Select Size
                    </h3>
                    <p className="text-sm text-blue-100 mt-1">
                      {variantModalProduct.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setVariantModalProduct(null)}
                    className="text-white hover:text-blue-100 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Variants List */}
              <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                {variantModalProduct.productVariants?.map((variant) => {
                  const isOutOfStock = (variant.stockQuantity ?? 0) <= 0
                  
                  return (
                  <motion.div
                    key={variant.id}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      isOutOfStock 
                        ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed' 
                        : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {variant.name}
                        </p>
                        <p className={`text-xs mt-1 ${
                          isOutOfStock 
                            ? 'text-red-600 font-semibold' 
                            : 'text-slate-500'
                        }`}>
                          {isOutOfStock 
                            ? 'Out of Stock' 
                            : `${variant.stockQuantity ?? 0} available`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-blue-600">
                          ₱{variant.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
                      whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                      onClick={() => {
                        if (!isOutOfStock) {
                          addToCart(variantModalProduct, variant)
                          setVariantModalProduct(null)
                          setVariantModalQuantity(1)
                        }
                      }}
                      disabled={isOutOfStock}
                      className={`w-full py-2 px-3 font-semibold rounded-lg transition-colors text-sm ${
                        isOutOfStock
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </motion.button>
                  </motion.div>
                  )
                })}
              </div>

              {/* Quantity Selector */}
              <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      setVariantModalQuantity(Math.max(1, variantModalQuantity - 1))
                    }
                    className="w-10 h-10 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 font-bold transition-colors"
                  >
                    −
                  </motion.button>
                  <span className="text-xl font-bold text-slate-900 w-12 text-center">
                    {variantModalQuantity}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      setVariantModalQuantity(variantModalQuantity + 1)
                    }
                    className="w-10 h-10 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 font-bold transition-colors"
                  >
                    +
                  </motion.button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setVariantModalProduct(null)}
                  className="flex-1 py-2 px-4 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Receipt Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 text-center rounded-t-2xl">
                <CheckCircleIcon className="w-12 h-12 mx-auto mb-3" />
                <h2 className="text-2xl font-bold mb-1">Order Confirmed!</h2>
                <p className="text-blue-100">Order #{receipt.orderNumber}</p>
              </div>

              {/* Receipt Content */}
              <div className="p-6 space-y-4">
                {/* Order Number and Time */}
                <div className="text-center pb-4 border-b border-slate-200">
                  <p className="text-sm text-slate-500">Completed at</p>
                  <p className="text-slate-900 font-semibold">
                    {new Date(receipt.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 mb-3">Items</h3>
                  {receipt.orderItems?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm py-2 border-b border-slate-100">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.product?.name}</p>
                        {item.variant && (
                          <p className="text-xs text-slate-500">{item.variant.name}</p>
                        )}
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-slate-900">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="text-slate-900 font-semibold">
                      ₱{((receipt.total - receipt.tax).toFixed(2))}
                    </span>
                  </div>
                  {receipt.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Discount</span>
                      <span className="text-red-600 font-semibold">
                        -₱{receipt.discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax (12%)</span>
                    <span className="text-slate-900 font-semibold">
                      ₱{receipt.tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-lg font-bold text-indigo-600">
                      ₱{receipt.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="text-center py-2 px-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Payment Method</p>
                  <p className="text-sm font-semibold text-slate-900 capitalize">
                    {receipt.paymentMethod === 'gcash' ? 'GCash' : 'Cash'}
                  </p>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="border-t border-slate-200 p-6 flex gap-3 bg-slate-50 rounded-b-2xl">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.print()}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4" />
                  </svg>
                  Print Receipt
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowReceipt(false)
                    setReceipt(null)
                  }}
                  className="flex-1 py-3 px-4 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
