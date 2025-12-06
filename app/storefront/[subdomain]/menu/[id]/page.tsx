import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import ProductDetail from '@/components/storefront/ProductDetail'

interface Params {
  params: { subdomain: string; id: string }
}

export async function generateMetadata({ params }: { params: { subdomain: string; id: string } }): Promise<Metadata> {
  try {
    const productId = parseInt(params.id.replace('product-', ''), 10)
    const product = await prisma.product.findFirst({
      where: { id: productId, tenant: { subdomain: params.subdomain } }
    })
    return {
      title: product?.name || 'Product',
      description: product?.description || ''
    }
  } catch {
    return {
      title: 'Product'
    }
  }
}

export default async function MenuProductPage({ params }: Params) {
  const { subdomain, id } = params
  try {
    // Extract product ID from format like "product-1"
    const productId = parseInt(id.replace('product-', ''), 10)
    
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenant: { subdomain }
      }
    })

    if (!product) return notFound()

    return (
      <div className="w-full">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
          <ProductDetail
            id={product.id}
            slug={product.name.toLowerCase().replace(/\s+/g, '-')}
            name={product.name}
            price={Number(product.price)}
            image={product.image ?? undefined}
            description={product.description ?? undefined}
            storefront={{
              id: product.tenantId as number,
              subdomain,
              name: '',
              settings: undefined,
              primaryColor: undefined,
              secondaryColor: undefined
            }}
          />
        </div>
      </div>
    )
  } catch (err) {
    console.error('Menu product page error:', err)
    return notFound()
  }
}
