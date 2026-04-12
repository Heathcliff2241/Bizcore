import { redirect } from 'next/navigation'

interface CustomersPageProps {
  params: Promise<{ subdomain: string }>
}

export default async function CustomersPage({ params }: CustomersPageProps) {
  const { subdomain } = await params
  redirect(`/dashboard/${subdomain}/people?tab=customers`)
}