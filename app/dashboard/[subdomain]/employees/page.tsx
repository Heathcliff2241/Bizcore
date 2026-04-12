import { redirect } from 'next/navigation'

interface EmployeesPageProps {
  params: Promise<{ subdomain: string }>
}

export default async function EmployeesPage({ params }: EmployeesPageProps) {
  const { subdomain } = await params
  redirect(`/dashboard/${subdomain}/people?tab=team`)
}
