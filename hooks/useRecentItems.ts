'use client'

import { useEffect, useState } from 'react'

export type RecentItemType = 'order' | 'product' | 'customer' | 'tenant'

export interface RecentItem {
  id: string | number
  type: RecentItemType
  title: string
  subtitle?: string
  url: string
  timestamp: number
}

const STORAGE_KEY = 'bizcore_recent_items'
const MAX_ITEMS = 5

/**
 * Hook to track and manage recently viewed items
 * Stores in localStorage with timestamp for ordering
 */
export function useRecentItems(subdomain?: string) {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])

  // Get storage key with subdomain
  const getStorageKey = () => {
    return subdomain ? `${STORAGE_KEY}_${subdomain}` : STORAGE_KEY
  }

  // Load recent items from localStorage
  useEffect(() => {
    const loadRecentItems = () => {
      try {
        const stored = localStorage.getItem(getStorageKey())
        if (stored) {
          const items: RecentItem[] = JSON.parse(stored)
          // Sort by timestamp descending (most recent first)
          const sorted = items.sort((a, b) => b.timestamp - a.timestamp)
          setRecentItems(sorted.slice(0, MAX_ITEMS))
        }
      } catch (error) {
        console.error('Failed to load recent items:', error)
      }
    }

    loadRecentItems()
  }, [subdomain])

  // Add a new recent item
  const addRecentItem = (item: Omit<RecentItem, 'timestamp'>) => {
    try {
      const newItem: RecentItem = {
        ...item,
        timestamp: Date.now(),
      }

      // Load existing items
      const stored = localStorage.getItem(getStorageKey())
      let items: RecentItem[] = stored ? JSON.parse(stored) : []

      // Remove duplicate if exists (same id and type)
      items = items.filter(
        (i) => !(i.id === newItem.id && i.type === newItem.type)
      )

      // Add new item at the beginning
      items.unshift(newItem)

      // Keep only MAX_ITEMS
      items = items.slice(0, MAX_ITEMS)

      // Save to localStorage
      localStorage.setItem(getStorageKey(), JSON.stringify(items))

      // Update state
      setRecentItems(items)
    } catch (error) {
      console.error('Failed to add recent item:', error)
    }
  }

  // Clear all recent items
  const clearRecentItems = () => {
    try {
      localStorage.removeItem(getStorageKey())
      setRecentItems([])
    } catch (error) {
      console.error('Failed to clear recent items:', error)
    }
  }

  // Remove a specific recent item
  const removeRecentItem = (id: string | number, type: RecentItemType) => {
    try {
      const stored = localStorage.getItem(getStorageKey())
      if (stored) {
        let items: RecentItem[] = JSON.parse(stored)
        items = items.filter((i) => !(i.id === id && i.type === type))
        localStorage.setItem(getStorageKey(), JSON.stringify(items))
        setRecentItems(items)
      }
    } catch (error) {
      console.error('Failed to remove recent item:', error)
    }
  }

  return {
    recentItems,
    addRecentItem,
    clearRecentItems,
    removeRecentItem,
  }
}

