import { ProductsManager } from '@/components/dashboard/products/ProductsManager'

interface ProductsPageProps {
  params: Promise<{
    subdomain: string
  }>
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { subdomain } = await params
  return <ProductsManager subdomain={subdomain} />
}
