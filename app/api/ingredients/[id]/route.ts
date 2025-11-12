import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function PUT(
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

    const { name, unit_of_measure, current_stock, low_stock_threshold, unit_cost, supplier, description } = await request.json()

    if (!name || !unit_of_measure || current_stock === undefined || low_stock_threshold === undefined) {
      return NextResponse.json(
        { error: 'Name, unit_of_measure, current_stock, and low_stock_threshold are required' },
        { status: 400 }
      )
    }

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        unit: unit_of_measure,
        currentStock: parseFloat(current_stock),
        minStock: parseFloat(low_stock_threshold),
        costPerUnit: unit_cost ? parseFloat(unit_cost) : 0,
        supplier,
        description
      }
    })

    return NextResponse.json({
      success: true,
      data: { ingredient }
    })
  } catch (error) {
    console.error('Failed to update ingredient:', error)
    return NextResponse.json(
      { error: 'Failed to update ingredient' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if ingredient is used in products
    const productIngredients = await prisma.productIngredient.findMany({
      where: { ingredientId: id }
    })

    if (productIngredients.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete ingredient that is used in products' },
        { status: 400 }
      )
    }

    await prisma.ingredient.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Ingredient deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete ingredient:', error)
    return NextResponse.json(
      { error: 'Failed to delete ingredient' },
      { status: 500 }
    )
  }
}