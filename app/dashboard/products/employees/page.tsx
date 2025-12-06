'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProductsEmployeesRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const tenant = localStorage.getItem('tenant')

    if (tenant) {
      try {
        const tenantObj = JSON.parse(tenant)
        if (tenantObj?.subdomain) {
          router.replace(`/dashboard/${tenantObj.subdomain}/employees`)
          return
        }
      } catch (error) {
        console.error('Failed to parse tenant from storage:', error)
      }
    }

    router.replace('/auth/signin')
  }, [router])

  return null
}
