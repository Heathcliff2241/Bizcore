import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
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
    const variantId = parseInt(params.variantId)
    const body = await request.json()
    const { name, price, isActive } = body

    // Verify product and variant belong to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenant.id
      }
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId
      }
    })

    if (!variant) {
      return NextResponse.json({ message: 'Variant not found' }, { status: 404 })
    }

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(name && { name }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to update variant:', error)
    return NextResponse.json({ success: false, message: 'Failed to update variant' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
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
    const variantId = parseInt(params.variantId)

    // Verify product and variant belong to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenant.id
      }
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId
      }
    })

    if (!variant) {
      return NextResponse.json({ message: 'Variant not found' }, { status: 404 })
    }

    await prisma.productVariant.delete({
      where: { id: variantId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete variant:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete variant' }, { status: 500 })
  }
}
