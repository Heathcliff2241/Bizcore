import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export interface Address {
  id?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface CustomerData {
  id: number
  firstName?: string
  lastName?: string
  email: string
  name?: string
  phone?: string
  address?: Address[]
  totalOrders?: number
  totalSpent?: number
  lastOrderDate?: string
  preferences?: {
    newsletter?: boolean
    notifications?: boolean
  }
}

export function useCustomer() {
  const { data: session } = useSession()
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) {
      setCustomer(null)
      return
    }

    const fetchCustomer = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/customers/${session.user.id}`)
        if (!res.ok) throw new Error('Failed to fetch customer')
        const data = await res.json()
        
        // Transform API response to CustomerData
        const customerData = data.data?.customer || data
        const name = customerData.firstName && customerData.lastName 
          ? `${customerData.firstName} ${customerData.lastName}`
          : customerData.email?.split('@')[0] || 'Customer'
        
        setCustomer({
          ...customerData,
          name
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomer()
  }, [session?.user?.id])

  return { customer, isLoading, error, isLoggedIn: !!session?.user?.id }
}
