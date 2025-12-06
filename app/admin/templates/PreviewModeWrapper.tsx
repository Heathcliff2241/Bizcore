'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface PreviewModeWrapperProps {
  children: ReactNode
}

/**
 * Wraps template preview content to prevent actual form submissions,
 * navigation, and account modifications while in preview mode.
 * Allows visual interactions like button hover/click feedback.
 */
export function PreviewModeWrapper({ children }: PreviewModeWrapperProps) {
  useEffect(() => {
    // Intercept form submissions
    const handleFormSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement
      const action = form.getAttribute('action')
      
      // Block actual form submissions - show demo message instead
      if (action && (
        action.includes('/auth') ||
        action.includes('/login') ||
        action.includes('/signup') ||
        action.includes('/checkout') ||
        action.includes('/api') ||
        action.includes('/account')
      )) {
        e.preventDefault()
        e.stopPropagation()
        showDemoMessage('Form submission blocked in preview mode')
        return false
      }
    }

    // Intercept link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a') as HTMLAnchorElement | null
      
      if (!link) return

      const href = link.getAttribute('href')
      
      // Block navigation to actual routes
      if (href && (
        href.startsWith('/auth') ||
        href.startsWith('/login') ||
        href.startsWith('/signup') ||
        href.startsWith('/cart') ||
        href.startsWith('/checkout') ||
        href.startsWith('/account') ||
        href.startsWith('/api')
      )) {
        e.preventDefault()
        e.stopPropagation()
        showDemoMessage('Navigation blocked in preview mode')
        return false
      }
    }

    // Intercept window.location changes using Object.defineProperty
    const originalAssign = window.location.assign
    const originalReplace = window.location.replace

    try {
      Object.defineProperty(window.location, 'assign', {
        value: function(url: string) {
          if (url && typeof url === 'string' && (
            url.includes('/auth') ||
            url.includes('/login') ||
            url.includes('/checkout')
          )) {
            showDemoMessage('Navigation blocked in preview mode')
            return
          }
          return originalAssign.call(this, url)
        },
        writable: false
      })

      Object.defineProperty(window.location, 'replace', {
        value: function(url: string) {
          if (url && typeof url === 'string' && (
            url.includes('/auth') ||
            url.includes('/login') ||
            url.includes('/checkout')
          )) {
            showDemoMessage('Navigation blocked in preview mode')
            return
          }
          return originalReplace.call(this, url)
        },
        writable: false
      })
    } catch (e) {
      // Silently fail if property cannot be redefined
      console.debug('Could not override location methods:', e)
    }

    // Prevent fetch/XHR to sensitive endpoints
    const originalFetch = window.fetch
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' 
        ? input 
        : input instanceof URL 
        ? input.toString() 
        : ((input as unknown) as Record<string, string>).url || ''
      
      if (url && (
        url.includes('/api/auth') ||
        url.includes('/api/checkout') ||
        url.includes('/api/account') ||
        url.includes('/auth/')
      )) {
        showDemoMessage('API request blocked in preview mode')
        return Promise.reject(new Error('Blocked in preview mode'))
      }
      return originalFetch(input, init)
    }

    // Attach event listeners
    document.addEventListener('submit', handleFormSubmit, true)
    document.addEventListener('click', handleLinkClick, true)

    return () => {
      document.removeEventListener('submit', handleFormSubmit, true)
      document.removeEventListener('click', handleLinkClick, true)
      window.fetch = originalFetch
    }
  }, [])

  return (
    <>
      {children}
      <PreviewModeOverlay />
    </>
  )
}

/**
 * Overlay banner indicating preview mode
 */
function PreviewModeOverlay() {
  return (
    <div className="fixed bottom-4 left-4 right-4 pointer-events-none z-50">
      <div className="bg-blue-500/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium max-w-sm">
        👁️ Preview Mode - Interactions are disabled (view only)
      </div>
    </div>
  )
}

/**
 * Show demo notification for blocked actions
 */
function showDemoMessage(message: string) {
  // Remove existing toast if present
  const existing = document.querySelector('[data-preview-toast]')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.setAttribute('data-preview-toast', 'true')
  toast.className = 'fixed top-4 right-4 bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-bounce'
  toast.textContent = message
  document.body.appendChild(toast)

  // Auto-remove after 3 seconds
  setTimeout(() => toast.remove(), 3000)
}
