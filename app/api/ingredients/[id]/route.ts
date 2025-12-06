import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { resolveTenant } from '@/lib/tenant'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    const tenant = await resolveTenant(session, subdomain)

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

  const id = Number(rawId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const {
      name,
      unit_of_measure,
      current_stock,
      low_stock_threshold,
      unit_cost,
      supplier,
      description,
      is_active
    } = await request.json()

    if (!name || !unit_of_measure || current_stock === undefined || low_stock_threshold === undefined) {
      return NextResponse.json(
        { error: 'Name, unit_of_measure, current_stock, and low_stock_threshold are required' },
        { status: 400 }
      )
    }

    const ingredient = await prisma.ingredient.findFirst({
      where: { id, tenantId: tenant.id }
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    const currentStockValue = Number(current_stock)
    const lowStockValue = Number(low_stock_threshold)
    const unitCostValue = unit_cost !== undefined && unit_cost !== null && unit_cost !== '' ? Number(unit_cost) : 0

    if (!Number.isFinite(currentStockValue) || !Number.isFinite(lowStockValue)) {
      return NextResponse.json(
        { error: 'current_stock and low_stock_threshold must be valid numbers' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(unitCostValue)) {
      return NextResponse.json(
        { error: 'unit_cost must be a valid number' },
        { status: 400 }
      )
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        unit: unit_of_measure,
        currentStock: currentStockValue,
        minStock: lowStockValue,
        costPerUnit: unitCostValue,
        supplier,
        description,
        ...(typeof is_active === 'boolean' ? { isActive: is_active } : {})
      }
    })

    return NextResponse.json({
      success: true,
      data: { ingredient: updated }
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
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    const tenant = await resolveTenant(session, subdomain)

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

  const id = Number(rawId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const ingredient = await prisma.ingredient.findFirst({
      where: { id, tenantId: tenant.id }
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    // Check if ingredient is used in products
    const productIngredients = await prisma.productIngredient.findMany({
      where: { ingredientId: ingredient.id }
    })

    if (productIngredients.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete ingredient that is used in products' },
        { status: 400 }
      )
    }

    await prisma.ingredient.update({
      where: { id: ingredient.id },
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