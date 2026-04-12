import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { variantId } = await params
    const { ingredientId, quantity } = await request.json()

    // Verify the variant belongs to a product owned by this user
    const variant = await prisma.productVariant.findUnique({
      where: { id: Number(variantId) },
      include: {
        product: {
          include: {
            tenant: {
              include: {
                tenantUsers: {
                  where: { userId: Number(session.user.id) }
                }
              }
            }
          }
        }
      }
    })

    if (!variant || !variant.product) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // Check authorization
    const isOwner = variant.product.tenant.tenantUsers.length > 0
    if (!isOwner && variant.product.tenantId !== Number(session.user.tenantId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Save or update variant ingredient
    await prisma.$executeRaw`
      INSERT INTO "variant_ingredients" ("variantId", "ingredientId", "quantity", "createdAt", "updatedAt")
      VALUES (${Number(variantId)}, ${Number(ingredientId)}, ${Number(quantity)}, NOW(), NOW())
      ON CONFLICT ("variantId", "ingredientId") 
      DO UPDATE SET "quantity" = ${Number(quantity)}, "updatedAt" = NOW()
    `

    return NextResponse.json({ success: true, data: { variantId: Number(variantId), ingredientId: Number(ingredientId), quantity: Number(quantity) } })
  } catch (error) {
    console.error('Failed to save variant ingredient:', error)
    return NextResponse.json(
      { error: 'Failed to save variant ingredient' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { variantId } = await params
    const { ingredientId } = await request.json()

    // Verify authorization
    const variant = await prisma.productVariant.findUnique({
      where: { id: Number(variantId) },
      include: {
        product: {
          include: {
            tenant: {
              include: {
                tenantUsers: {
                  where: { userId: Number(session.user.id) }
                }
              }
            }
          }
        }
      }
    })

    if (!variant?.product) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    const isOwner = variant.product.tenant.tenantUsers.length > 0
    if (!isOwner && variant.product.tenantId !== Number(session.user.tenantId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete variant ingredient
    await prisma.$executeRaw`
      DELETE FROM "variant_ingredients"
      WHERE "variantId" = ${Number(variantId)} AND "ingredientId" = ${Number(ingredientId)}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete variant ingredient:', error)
    return NextResponse.json(
      { error: 'Failed to delete variant ingredient' },
      { status: 500 }
    )
  }
}
