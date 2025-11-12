'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function DashboardOverview() {
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    // Get tenant from localStorage and redirect appropriately
    const tenant = localStorage.getItem('tenant')
    if (tenant) {
      try {
        const tenantObj = JSON.parse(tenant)
        
        // Check if this is a newly registered user (within 5 minutes)
        const tenantCreatedAt = new Date(tenantObj.createdAt || tenantObj.created_at)
        const now = new Date()
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
        
        const isNewTenant = tenantCreatedAt > fiveMinutesAgo
        
        if (isNewTenant) {
          // New tenant - send to onboarding
          router.push('/onboarding')
        } else {
          // Existing tenant - send to dashboard
          router.push(`/dashboard/${tenantObj.subdomain}`)
        }
      } catch {
        router.push('/auth/signin')
      }
    } else {
      router.push('/auth/signin')
    }
  }, [router, session])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your dashboard...</p>
      </div>
    </div>
  )
}