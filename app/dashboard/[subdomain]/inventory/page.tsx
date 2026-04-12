import { redirect } from 'next/navigation'

interface InventoryPageProps {
  params: Promise<{
    subdomain: string
  }>
}

export default async function InventoryPage({ params }: InventoryPageProps) {
  const { subdomain } = await params
  redirect(`/dashboard/${subdomain}/catalog?tab=inventory`)
}
