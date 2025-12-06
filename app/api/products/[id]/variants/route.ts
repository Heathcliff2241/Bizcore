import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)
  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  }

  try {
    const productId = parseInt(params.id)

    // Verify product belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenant.id
      }
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, data: variants })
  } catch (error) {
    console.error('Failed to fetch variants:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch variants' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)
  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  }

  try {
    const productId = parseInt(params.id)
    const body = await request.json()
    const { name, price, isActive } = body

    if (!name || !price) {
      return NextResponse.json(
        { message: 'Name and price are required' },
        { status: 400 }
      )
    }

    // Verify product belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenant.id
      }
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name,
        price: parseFloat(price),
        isActive: isActive !== false
      }
    })

    return NextResponse.json({ success: true, data: variant })
  } catch (error) {
    console.error('Failed to create variant:', error)
    return NextResponse.json({ success: false, message: 'Failed to create variant' }, { status: 500 })
  }
}
