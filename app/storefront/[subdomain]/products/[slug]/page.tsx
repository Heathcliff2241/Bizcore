import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import ProductDetail from '@/components/storefront/ProductDetail'

interface Params {
  params: Promise<{ subdomain: string; slug: string }>
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params
  const product = await prisma.product.findFirst({ where: { slug: params.slug } })
  return {
    title: product?.name || 'Product',
    description: product?.description || ''
  }
}

export default async function ProductPage(props: Params) {
  const params = await props.params
  const { subdomain, slug } = params
  try {
    const product = await prisma.product.findFirst({
      where: { slug, tenant: { subdomain } },
    })
    if (!product) return notFound()

    return (
      <div className="w-full">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
          <ProductDetail id={product.id} slug={product.slug || ''} name={product.name} price={Number(product.price)} image={product.image ?? undefined} description={product.description ?? undefined} storefront={{ id: product.tenantId as number, subdomain, name: '', settings: undefined, primaryColor: undefined, secondaryColor: undefined }} />
        </div>
      </div>
    )
  } catch (err) {
    console.error('Product page error:', err)
    return notFound()
  }
}
