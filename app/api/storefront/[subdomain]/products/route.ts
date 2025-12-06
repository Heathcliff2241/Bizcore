import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ subdomain: string }> }) {
  const { searchParams } = new URL(request.url)
  const { subdomain } = await params
  const limit = parseInt(searchParams.get('limit') || '12')

  try {
    // Find tenant by subdomain
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain }
    })

    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
    }

    // Fetch active products for this tenant
    const products = await prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Format products for storefront
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category_name: product.category?.name
    }))

    return NextResponse.json({
      success: true,
      products: formattedProducts
    })
  } catch (error) {
    console.error('Failed to fetch storefront products:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch products'
    }, { status: 500 })
  }
}