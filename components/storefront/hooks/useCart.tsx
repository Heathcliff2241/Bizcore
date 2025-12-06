"use client"
import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react'

export interface CartItem {
  id?: string | number
  name: string
  price: number
  quantity?: number
  description?: string
  imageUrl?: string
  options?: string[]
}

// Global cart context for real-time updates
interface CartContextType {
  carts: Record<string, CartItem[]>
  updateCart: (key: string, cart: CartItem[]) => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [carts, setCarts] = useState<Record<string, CartItem[]>>({})

  const updateCart = useCallback((key: string, cart: CartItem[]) => {
    setCarts(prev => ({
      ...prev,
      [key]: [...cart] // Ensure new array reference
    }))
  }, [])

  return (
    <CartContext.Provider value={{ carts, updateCart }}>
      {children}
    </CartContext.Provider>
  )
}

function useCartContext() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export function useCart(subdomain: string | undefined, userId?: string | null) {
  const { carts, updateCart } = useCartContext()
  const key = userId
    ? `storefront_cart_${subdomain ?? 'global'}_user_${userId}`
    : `storefront_cart_${subdomain ?? 'global'}_guest`

  // Get cart from context, fallback to localStorage
  const [localCart, setLocalCart] = useState<CartItem[]>(() => {
    try {
      if (typeof window === 'undefined') return []
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch (e) {
      console.warn('useCart: failed to load from localStorage', e)
      return []
    }
  })

  // Use context cart if available, otherwise use local state
  const cart = carts[key] || localCart

  // Sync context updates to localStorage
  useEffect(() => {
    if (carts[key]) {
      try {
        localStorage.setItem(key, JSON.stringify(carts[key]))
      } catch (e) {
        console.warn('useCart: failed to save to localStorage', e)
      }
    }
  }, [carts, key])

  // Clear cart when user logs out
  useEffect(() => {
    if (userId === null || userId === undefined) {
      updateCart(key, [])
    }
  }, [userId, key, updateCart])

  const addToCart = useCallback((item: CartItem) => {
    const existing = cart.find((i) => i.id === item.id)
    if (existing) {
      const newQuantity = (Number(existing.quantity) || 0) + (Number(item.quantity) || 1)
      const newCart = cart.map((i) => (i.id === item.id ? { ...i, quantity: newQuantity } : i))
      updateCart(key, newCart)
      return newCart
    }
    const newItem = { ...item, quantity: Number(item.quantity) || 1 }
    const newCart = [...cart, newItem]
    updateCart(key, newCart)
    return newCart
  }, [cart, key, updateCart])

  const removeFromCart = useCallback((id: string | number) => {
    const newCart = cart.filter((i) => i.id !== id)
    updateCart(key, newCart)
    return newCart
  }, [cart, key, updateCart])

  const updateQuantity = useCallback((id: string | number, quantity: number) => {
    const newCart = cart.map((i) => (i.id === id ? { ...i, quantity: Number(quantity) } : i))
    updateCart(key, newCart)
    return newCart
  }, [cart, key, updateCart])

  const clearCart = useCallback(() => {
    const newCart: CartItem[] = []
    updateCart(key, newCart)
    return newCart
  }, [key, updateCart])

  return { cart, addToCart, removeFromCart, updateQuantity, clearCart }
}
