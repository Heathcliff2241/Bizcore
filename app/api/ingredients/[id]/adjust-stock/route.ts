import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    const tenant = await resolveTenant(session, subdomain)

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

  const ingredientId = Number(id)

    if (!Number.isFinite(ingredientId)) {
      return NextResponse.json({ error: 'Invalid ingredient id' }, { status: 400 })
    }

    const { quantity_change, transaction_type, notes } = await request.json()

    const quantityChange = Number(quantity_change)

    if (!Number.isFinite(quantityChange) || quantityChange === 0) {
      return NextResponse.json({ error: 'Quantity change must be a non-zero number' }, { status: 400 })
    }

    if (!transaction_type || typeof transaction_type !== 'string') {
      return NextResponse.json({ error: 'Transaction type is required' }, { status: 400 })
    }

    const ingredient = await prisma.ingredient.findFirst({
      where: { id: ingredientId, tenantId: tenant.id }
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    const updatedStock = ingredient.currentStock + quantityChange

    if (updatedStock < 0) {
      return NextResponse.json({ error: 'Stock cannot be negative' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedIngredient = await tx.ingredient.update({
        where: { id: ingredientId },
        data: { currentStock: updatedStock }
      })

      const performedBy = Number(session.user.id)

      await tx.inventoryTransaction.create({
        data: {
          tenantId: tenant.id,
          ingredientId,
          type: transaction_type,
          quantity: quantityChange,
          reason: notes,
          performedBy: Number.isFinite(performedBy) ? performedBy : undefined
        }
      })

      return updatedIngredient
    })

    return NextResponse.json({ data: { ingredient: result } })
  } catch (error) {
    console.error('[INGREDIENT_ADJUST_STOCK_POST]', error)
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 })
  }
}