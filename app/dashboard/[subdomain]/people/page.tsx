'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { Users, UserCog } from 'lucide-react'
import TabbedLayout, { type Tab } from '@/components/dashboard/TabbedLayout'
import { EmployeeManager } from '@/components/dashboard/EmployeeManager'
import { useTheme } from '../../theme-context'

// Import the full CustomersPage component
import CustomersPageContent from './customers-tab'

export default function PeoplePage() {
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
  
  const { theme } = useTheme()

  const tabs: Tab[] = [
    // {
    //   id: 'customers',
    //   label: 'Customers',
    //   icon: Users,
    //   component: () => <CustomersPageContent subdomain={subdomain} />
    // },
    {
      id: 'team',
      label: 'Team',
      icon: UserCog,
      component: () => <EmployeeManager subdomain={subdomain} theme={theme} />
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <TabbedLayout tabs={tabs} defaultTab={searchParams.get('tab') || 'customers'} />
    </div>
  )
}
