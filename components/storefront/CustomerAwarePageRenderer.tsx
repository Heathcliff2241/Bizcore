'use client'

import { PageRenderer } from '@/components/storefront/PageRenderer'
import { CustomerWelcome } from '@/components/storefront/CustomerWelcome'
import { CustomerStats } from '@/components/storefront/CustomerStats'
import type { StorefrontContext } from '@/components/storefront/types'

interface ComponentData {
  id: string
  type: string
  props: Record<string, unknown>
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  rotation?: number
  zIndex?: number
  hidden?: boolean
  children?: ComponentData[]
}

interface CustomerAwarePageRendererProps {
  components: ComponentData[]
  storefront: StorefrontContext
  showCustomerWelcome?: boolean
  showCustomerStats?: boolean
}

export function CustomerAwarePageRenderer({
  components,
  storefront,
  showCustomerWelcome = true,
  showCustomerStats = true
}: CustomerAwarePageRendererProps) {
  return (
    <div>
      {showCustomerWelcome && <CustomerWelcome storefront={storefront} />}
      {showCustomerStats && <CustomerStats />}
      <PageRenderer components={components} storefront={storefront} />
    </div>
  )
}
