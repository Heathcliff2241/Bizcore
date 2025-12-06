import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveTenant } from '@/lib/tenant'

export async function GET(request: NextRequest) {
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

    const ingredients = await prisma.ingredient.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: { ingredients }
    })
  } catch (error) {
    console.error('Failed to fetch ingredients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ingredients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const {
      name,
      unit_of_measure,
      current_stock,
      low_stock_threshold,
      unit_cost,
      supplier,
      description
    } = await request.json()

    if (!name || !unit_of_measure || current_stock === undefined || low_stock_threshold === undefined) {
      return NextResponse.json(
        { error: 'Name, unit_of_measure, current_stock, and low_stock_threshold are required' },
        { status: 400 }
      )
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

    const ingredient = await prisma.ingredient.create({
      data: {
        tenantId: tenant.id,
        name,
        unit: unit_of_measure,
        currentStock: currentStockValue,
        minStock: lowStockValue,
        costPerUnit: unitCostValue,
        supplier,
        description
      }
    })

    return NextResponse.json({
      success: true,
      data: { ingredient }
    })
  } catch (error) {
    console.error('Failed to create ingredient:', error)
    return NextResponse.json(
      { error: 'Failed to create ingredient' },
      { status: 500 }
    )
  }
}