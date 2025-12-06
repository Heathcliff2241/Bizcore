'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useParams } from 'next/navigation'

interface Theme {
  primary: string
  secondary: string
  accent?: string
  background?: string
  surface?: string
  text?: string
}

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>({
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#6EE7B7',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827'
  })

  const params = useParams()

  useEffect(() => {
    // Fetch settings when provider mounts or subdomain changes
    const fetchThemeSettings = async () => {
      try {
        const rawSubdomain = params?.subdomain
        const subdomain = Array.isArray(rawSubdomain) ? rawSubdomain[0] : rawSubdomain ?? ''
        
        if (!subdomain) return

        // First, check localStorage for tenant colors (from onboarding)
        const tenantData = localStorage.getItem('tenant')
        if (tenantData) {
          try {
            const tenant = JSON.parse(tenantData)
            if (tenant.primaryColor || tenant.secondaryColor) {
              setTheme((prev) => ({
                ...prev,
                primary: tenant.primaryColor || prev.primary,
                secondary: tenant.secondaryColor || prev.secondary
              }))
              return // Use localStorage colors, don't fetch
            }
          } catch {
            // Continue to fetch from API if localStorage parse fails
          }
        }

        // Fetch from settings API as fallback
        const querySuffix = `?subdomain=${encodeURIComponent(subdomain)}`
        const response = await fetch(`/api/settings${querySuffix}`)
        
        if (!response.ok) return

        const data = await response.json()
        if (data.success && data.data?.brandColors) {
          setTheme({
            primary: data.data.brandColors.primary || '#10B981',
            secondary: data.data.brandColors.secondary || '#34D399',
            accent: data.data.brandColors.accent || '#6EE7B7',
            background: data.data.brandColors.background || '#ffffff',
            surface: data.data.brandColors.surface || '#f9fafb',
            text: data.data.brandColors.text || '#111827'
          })
        }
      } catch (error) {
        console.error('Failed to fetch theme settings:', error)
      }
    }

    fetchThemeSettings()
  }, [params])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}