'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Get tenant from localStorage and redirect to tenant dashboard
    const tenant = localStorage.getItem('tenant')
    if (tenant) {
      try {
        const tenantObj = JSON.parse(tenant)
        router.push(`/dashboard/${tenantObj.subdomain}`)
      } catch {
        router.push('/auth/signin')
      }
    } else {
      router.push('/auth/signin')
    }
  }, [router])

  return <>{children}</>
}