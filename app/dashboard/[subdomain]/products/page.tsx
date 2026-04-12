import { redirect } from 'next/navigation'

interface ProductsPageProps {
  params: Promise<{
    subdomain: string
  }>
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { subdomain } = await params
  redirect(`/dashboard/${subdomain}/catalog?tab=products`)
}
