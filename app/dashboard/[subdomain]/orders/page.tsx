/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrdersManager } from '@/components/dashboard/orders/OrdersManager'

interface OrdersPageProps {
  params: Promise<{
    subdomain: string
  }>
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { subdomain } = await params
  return <OrdersManager subdomain={subdomain} />
}

