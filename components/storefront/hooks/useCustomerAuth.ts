'use client'

import { useState } from 'react'

export interface CustomerSession {
  customerId: string
  tenantId: string
  email: string
  role: 'customer'
  token: string
}

/**
 * Hook for customer JWT-based authentication
 * Stores token in localStorage and provides login/logout/session methods
 * This is independent of NextAuth to avoid JWT_SESSION_ERROR issues
 */
export function useCustomerAuth() {
  const [session, setSession] = useState<CustomerSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load session from localStorage on first call
  const loadSession = () => {
    try {
      const stored = localStorage.getItem('customer-session')
      if (stored) {
        const parsed = JSON.parse(stored)
        setSession(parsed)
        return parsed
      }
    } catch (err) {
      console.error('[useCustomerAuth] Failed to load session:', err)
      localStorage.removeItem('customer-session')
    }
    return null
  }

  // Login with email/password
  const login = async (subdomain: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain, email, password })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      const data = await response.json()
      const sessionData: CustomerSession = {
        customerId: data.customer.id,
        tenantId: data.tenant.id,
        email: data.customer.email,
        role: 'customer',
        token: data.token
      }

      localStorage.setItem('customer-session', JSON.stringify(sessionData))
      setSession(sessionData)
      return sessionData
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const logout = () => {
    localStorage.removeItem('customer-session')
    setSession(null)
  }

  // Get current session
  const getSession = () => {
    if (!session) {
      return loadSession()
    }
    return session
  }

  // Get auth header for API calls
  const getAuthHeader = () => {
    const currentSession = getSession()
    if (currentSession?.token) {
      return { Authorization: `Bearer ${currentSession.token}` }
    }
    return {}
  }

  return {
    session: session || loadSession(),
    loading,
    error,
    login,
    logout,
    getAuthHeader,
    isAuthenticated: !!session
  }
}
