'use client'

import { useEffect, useState } from 'react'
import { componentMap } from './index'
import type { StorefrontContext } from './types'

interface ComponentData {
  id: string
  type: string
  props: Record<string, unknown>
  children?: ComponentData[]
  hidden?: boolean
}

interface PageWrapperProps {
  children: React.ReactNode
  storefront: StorefrontContext
}

export function PageWithDesignedHeader({ children, storefront }: PageWrapperProps) {
  const [headerFooterComponents, setHeaderFooterComponents] = useState<{
    header: ComponentData | null
    footer: ComponentData | null
  }>({ header: null, footer: null })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHeaderFooter = async () => {
      try {
        const res = await fetch(`/api/storefront/${storefront.subdomain}/landing-page-design`)
        if (!res.ok) throw new Error('Failed to fetch landing page')
        const data = await res.json()

        const components = data.components || []
        const header = components.find((c: ComponentData) => c.type.startsWith('header') && !c.hidden)
        const footer = components.find((c: ComponentData) => c.type.startsWith('footer') && !c.hidden)

        setHeaderFooterComponents({ header, footer })
      } catch (error) {
        console.error('Error fetching header/footer:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHeaderFooter()
  }, [storefront.subdomain])

  const renderComponent = (component: ComponentData) => {
    const Component = componentMap[component.type as keyof typeof componentMap]
    if (!Component) return null

    const componentProps = component.props as Record<string, unknown> ?? {}
    return (
      <Component
        key={component.id}
        {...componentProps}
        storefront={storefront}
      />
    )
  }

  if (isLoading) {
    return <>{children}</>
  }

  return (
    <>
      {headerFooterComponents.header && renderComponent(headerFooterComponents.header)}
      {children}
      {headerFooterComponents.footer && renderComponent(headerFooterComponents.footer)}
    </>
  )
}
