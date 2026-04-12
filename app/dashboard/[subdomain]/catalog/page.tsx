'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { Package, Boxes, Tag } from 'lucide-react'
import TabbedLayout, { type Tab } from '@/components/dashboard/TabbedLayout'
import { ProductsManager } from '@/components/dashboard/products/ProductsManager'
import { InventoryManager } from '@/components/dashboard/inventory/InventoryManager'
import { CategoryManager } from '@/components/dashboard/CategoryManager'

export default function CatalogPage() {
  const params = useParams<{ subdomain: string }>()
  const searchParams = useSearchParams()
  
  // Safely extract subdomain from params
  const subdomain = params && params.subdomain 
    ? typeof params.subdomain === 'string' 
      ? params.subdomain 
      : Array.isArray(params.subdomain) 
        ? params.subdomain[0] 
        : ''
    : ''
  
  const defaultTab = searchParams.get('tab') || 'products'

  const tabs: Tab[] = [
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      component: () => <ProductsManager subdomain={subdomain} />
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      component: () => <InventoryManager subdomain={subdomain} />
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Tag,
      component: () => <CategoryManager subdomain={subdomain} />
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <TabbedLayout tabs={tabs} defaultTab={defaultTab} />
    </div>
  )
}
