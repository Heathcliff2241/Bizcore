'use client'

import { EmployeeManager } from '@/components/dashboard/EmployeeManager'
import { useTheme } from '../../theme-context'
import { useParams } from 'next/navigation'

export default function TenantEmployeesPage() {
  const { theme } = useTheme()
  const params = useParams<{ subdomain: string }>()
  const subdomain = Array.isArray(params.subdomain) ? params.subdomain[0] : params.subdomain
  
  return <EmployeeManager subdomain={subdomain} theme={theme} />
}
