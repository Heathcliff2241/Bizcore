'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CategoryManager } from '@/components/dashboard/CategoryManager'

export default function CategoriesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Get tenant from localStorage
  const tenant = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tenant') || '{}') : {}
  const subdomain = tenant?.subdomain

  return <CategoryManager subdomain={subdomain} />
}
