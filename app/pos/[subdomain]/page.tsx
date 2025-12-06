'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCartIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowRightIcon,
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
}

interface Product {
  id: number
  name: string
  price: number
  image?: string
  stockQuantity?: number
  category?: { name: string }
  variants?: ProductVariant[]
}

interface CartItem {
  product: Product
  variantId?: number
  variantName?: string
  variantPrice?: number
  quantity: number
  notes?: string
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
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null)

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('pos_token')
    const storedEmployee = localStorage.getItem('pos_employee')
    const storedTenant = localStorage.getItem('pos_tenant')

    if (!token || !storedEmployee || !storedTenant) {
      // POS login route is hosted under /pos/[subdomain]/login (not under /storefront)
      router.push(`/pos/${subdomain}/login`)
      return
    }

    const employeeData = JSON.parse(storedEmployee) as EmployeeInfo
    const tenantData = JSON.parse(storedTenant) as TenantInfo
    setEmployee(employeeData)
    setTenant(tenantData)

    // Load tax settings from stored settings (set during login)
    const storedSettings = localStorage.getItem('pos_settings')
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings) as Record<string, unknown> | null
        if (settings && 'tax' in settings) {
          const taxConfig = settings.tax as Record<string, unknown> | null
          if (taxConfig && typeof taxConfig.defaultTaxPercent === 'number') {
            setTenantTaxRate(taxConfig.defaultTaxPercent)
          }
        }
      } catch (error) {
        console.error('Failed to parse stored settings:', error)
      }
    }

    const loadProducts = async () => {
      try {
        const res = await fetch('/api/pos/products', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await res.json()

        if (!res.ok) {
          console.error('Failed to fetch products:', data?.error ?? res.statusText)
          return
        }

        if (Array.isArray(data.products)) {
          setProducts(data.products)

          const cats = new Set<string>(
            data.products.map((product: Product) => product.category?.name ?? 'Uncategorized')
          )
          setCategories(['all', ...Array.from(cats)])
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadProducts()
  }, [router, subdomain])

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

  const addToCart = (product: Product) => {
    // Check if product is in stock
    if ((product.stockQuantity ?? 0) <= 0) {
      alert('This product is out of stock')
      return
    }

    // If product has variants, show variant selection modal
    if ((product.variants?.length ?? 0) > 0) {
      setSelectedProductForVariant(product)
      setShowVariantModal(true)
      return
    }

    const existing = cart.find(item => item.product.id === product.id && !item.variantId)
    
    // Check if adding more would exceed available stock
    const requestedQuantity = existing ? existing.quantity + 1 : 1
    if (requestedQuantity > (product.stockQuantity ?? 0)) {
      alert(`Only ${product.stockQuantity} unit(s) available in stock`)
      return
    }
    
    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id && !item.variantId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const addVariantToCart = (variant: ProductVariant) => {
    if (!selectedProductForVariant) return

    const product = selectedProductForVariant
    const existing = cart.find(
      item => item.product.id === product.id && item.variantId === variant.id
    )

    const requestedQuantity = existing ? existing.quantity + 1 : 1
    if (requestedQuantity > (product.stockQuantity ?? 0)) {
      alert(`Only ${product.stockQuantity} unit(s) available in stock`)
      return
    }

    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id && item.variantId === variant.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        product,
        variantId: variant.id,
        variantName: variant.name,
        variantPrice: variant.price,
        quantity: 1
      }])
    }

    setShowVariantModal(false)
    setSelectedProductForVariant(null)
  }

  const removeFromCart = (productId: number, variantId?: number) => {
    setCart(cart.filter(item => {
      if (item.product.id !== productId) return true
      if (variantId === undefined) return item.variantId !== undefined
      return item.variantId !== variantId
    }))
  }

  const updateQuantity = (productId: number, quantity: number, variantId?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId)
    } else {
      setCart(cart.map(item =>
        item.product.id === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => {
      const price = item.variantPrice ?? item.product.price
      return sum + (price * item.quantity)
    }, 0)
    const tax = subtotal * (tenantTaxRate / 100)
    return { subtotal, tax, total: subtotal + tax }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setProcessingOrder(true)

    try {
      const token = localStorage.getItem('pos_token')
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes
      }))

      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          paymentMethod,
          discount: 0
        })
      })

      if (res.ok) {
        const data = await res.json()
        
        // Clear cart
  setCart([])
        
        // Show success message
        alert(`Order ${data.order.orderNumber} completed successfully!`)
        
        // TODO: Show print receipt option
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

  const handleLogout = () => {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_employee')
    localStorage.removeItem('pos_tenant')
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
                      className={`bg-gradient-to-br from-white to-slate-50 rounded-xl md:rounded-2xl p-3 md:p-4 transition-all duration-200 text-left group border border-slate-200/50 ${
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
                      <div className="relative mb-2 md:mb-3 overflow-hidden rounded-lg md:rounded-xl bg-slate-100">
                        {product.image ? (
                          <motion.div whileHover={!isOutOfStock ? { scale: 1.1 } : {}} className="overflow-hidden">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={240}
                              height={128}
                              className={`w-full h-24 md:h-32 object-cover ${isOutOfStock ? 'grayscale' : ''}`}
                            />
                          </motion.div>
                        ) : (
                          <div className="w-full h-24 md:h-32 flex items-center justify-center bg-slate-100">
                            <RectangleStackIcon className={`w-10 h-10 md:w-12 md:h-12 ${isOutOfStock ? 'text-slate-300' : 'text-slate-400'}`} />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm md:text-base mb-1 md:mb-2">
                        {product.name}
                      </h3>
                      <div className="flex items-end justify-between gap-2">
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
                    key={item.product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl md:rounded-2xl p-3 md:p-4 mb-3 md:mb-4 border border-slate-200/50 hover:border-blue-300/50 transition-colors group"
                  >
                    <div className="flex justify-between items-start gap-2 md:gap-3 mb-2 md:mb-3">
                      <h3 className="font-semibold text-slate-900 text-sm md:text-base line-clamp-1 flex-1">
                        {item.product.name}
                        {item.variantName && <span className="text-slate-600"> - {item.variantName}</span>}
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeFromCart(item.product.id, item.variantId)}
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
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variantId)}
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
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variantId)}
                          className="w-6 h-6 md:w-7 md:h-7 rounded text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center text-sm font-bold transition-colors"
                        >
                          +
                        </motion.button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs md:text-sm text-slate-500">
                          ₱{(item.variantPrice ?? item.product.price).toFixed(2)} each
                        </p>
                        <p className="font-bold text-blue-600 text-sm md:text-base">
                          ₱{((item.variantPrice ?? item.product.price) * item.quantity).toFixed(2)}
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
        {showVariantModal && selectedProductForVariant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowVariantModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Select Size</h2>
                <p className="text-slate-600 text-sm mt-2">{selectedProductForVariant.name}</p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                {(selectedProductForVariant.variants ?? []).map((variant) => (
                  <motion.button
                    key={variant.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addVariantToCart(variant)}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-900">{variant.name}</p>
                      </div>
                      <p className="font-bold text-lg text-blue-600">₱{variant.price.toFixed(2)}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowVariantModal(false)}
                className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
