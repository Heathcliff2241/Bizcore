'use client'

import { useEffect } from 'react'

interface ViewedProduct {
  id: number
  name: string
  slug: string
  timestamp: number
}

const STORAGE_KEY = 'storefront_viewed_products'
const MAX_HISTORY = 20

export function useProductViewTracking(productId: number, productName: string, slug: string) {
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as ViewedProduct[]
      
      // Remove if already exists to avoid duplicates
      const filtered = history.filter(p => p.id !== productId)
      
      // Add new view to the beginning
      filtered.unshift({
        id: productId,
        name: productName,
        slug,
        timestamp: Date.now()
      })
      
      // Keep only last MAX_HISTORY items
      const trimmed = filtered.slice(0, MAX_HISTORY)
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch (error) {
      console.error('Failed to track product view:', error)
    }
  }, [productId, productName, slug])
}

export function getViewedProducts(): ViewedProduct[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as ViewedProduct[]
  } catch {
    return []
  }
}

export function clearViewedProducts() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silent error
  }
}
