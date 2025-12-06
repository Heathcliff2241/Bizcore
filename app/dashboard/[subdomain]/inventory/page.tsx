import { InventoryManager } from '@/components/dashboard/inventory/InventoryManager'

interface InventoryPageProps {
  params: Promise<{
    subdomain: string
  }>
}

export default async function InventoryPage({ params }: InventoryPageProps) {
  const { subdomain } = await params
  return <InventoryManager subdomain={subdomain} />
}
