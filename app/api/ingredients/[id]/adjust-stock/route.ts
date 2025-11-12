/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramId } = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(paramId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const { quantity_change, transaction_type, notes } = await request.json()

    if (quantity_change === undefined || !transaction_type) {
      return NextResponse.json(
        { error: 'quantity_change and transaction_type are required' },
        { status: 400 }
      )
    }

    const quantity = parseFloat(quantity_change)
    if (isNaN(quantity)) {
      return NextResponse.json(
        { error: 'Invalid quantity_change' },
        { status: 400 }
      )
    }

    // Get current ingredient
    const ingredient = await prisma.ingredient.findUnique({
      where: { id }
    })

    if (!ingredient) {

        return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: 404 }
    )
    }

    // Calculate new stock
    const newStock = ingredient.currentStock + quantity

    if (newStock < 0) {
      return NextResponse.json(
        { error: 'Stock cannot go below 0' },
        { status: 400 }
      )
    }

    // Update stock
    await prisma.ingredient.update({
      where: { id },
      data: { currentStock: newStock }
    })

    // Create transaction record
    const userIdRaw = (session.user as any)?.id
    const performedBy =
      typeof userIdRaw === 'string'
        ? parseInt(userIdRaw, 10)
        : typeof userIdRaw === 'number'
        ? userIdRaw
        : null

    if (performedBy === null || Number.isNaN(performedBy)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    await prisma.inventoryTransaction.create({
      data: {
        tenantId: ingredient.tenantId,
        ingredientId: id,
        type: transaction_type,
        quantity,
        reason: notes,
        performedBy
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Stock adjusted successfully'
    })
  } catch (error) {
    console.error('Failed to adjust stock:', error)
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}