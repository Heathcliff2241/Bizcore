'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OrdersPage() {
  const router = useRouter()

  useEffect(() => {
    const tenant = localStorage.getItem('tenant')
    if (tenant) {
      try {
        const tenantObj = JSON.parse(tenant)
        router.push(`/dashboard/${tenantObj.subdomain}/orders`)
      } catch {
        router.push('/auth/signin')
      }
    } else {
      router.push('/auth/signin')
    }
  }, [router])

  return null
}
