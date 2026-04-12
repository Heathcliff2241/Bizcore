import { redirect } from 'next/navigation'

interface CategoriesPageProps {
  params: Promise<{ subdomain: string }>
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { subdomain } = await params
  redirect(`/dashboard/${subdomain}/catalog?tab=categories`)
}
