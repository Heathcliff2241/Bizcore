import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, assume tenantId from user, but since multi-tenant, need to get from session or something
    // For simplicity, get all ingredients for now
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
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

    const { name, unit_of_measure, current_stock, low_stock_threshold, unit_cost, supplier, description } = await request.json()

    if (!name || !unit_of_measure || current_stock === undefined || low_stock_threshold === undefined) {
      return NextResponse.json(
        { error: 'Name, unit_of_measure, current_stock, and low_stock_threshold are required' },
        { status: 400 }
      )
    }

    // For now, hardcode tenantId, but should get from user
    const tenantId = 1

    const ingredient = await prisma.ingredient.create({
      data: {
        tenantId,
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
    console.error('Failed to create ingredient:', error)
    return NextResponse.json(
      { error: 'Failed to create ingredient' },
      { status: 500 }
    )
  }
}