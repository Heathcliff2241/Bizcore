import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'
import { logTenantActivity } from '@/lib/activityLogger'

interface IngredientInput {
  ingredient_id: number;
  quantity_required: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
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

  const productId = Number(id)

  if (!Number.isInteger(productId)) {
    return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 })
  }

  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: tenant.id },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true
          }
        },
        productVariants: true
      }
    })

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
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

  const productId = Number(id)

  if (!Number.isInteger(productId)) {
    return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      price,
      cost_price,
      image,
      category_id,
      is_active,
      track_inventory,
      current_stock,
      low_stock_threshold,
      ingredients
    } = body

    console.log('[API /products/[id] PUT] Received payload:', {
      track_inventory,
      current_stock,
      low_stock_threshold,
      fullBody: body
    })

    const existingProduct = await prisma.product.findFirst({
      where: { id: productId, tenantId: tenant.id }
    })

    if (!existingProduct) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    if (!name || price === undefined || price === null) {
      return NextResponse.json({ success: false, message: 'Name and price are required' }, { status: 400 })
    }

    const parsedPrice = Number(price)
    const parsedCost = Number(cost_price ?? 0)

    if (!Number.isFinite(parsedPrice)) {
      return NextResponse.json({ success: false, message: 'Price must be a valid number' }, { status: 400 })
    }

    const parsedCategoryId = category_id !== undefined && category_id !== null && category_id !== '' ? Number(category_id) : null

    if (parsedCategoryId !== null && !Number.isInteger(parsedCategoryId)) {
      return NextResponse.json({ success: false, message: 'Category must be a valid identifier' }, { status: 400 })
    }

    await prisma.productIngredient.deleteMany({
      where: { productId }
    })

    const parsedCurrentStock = Number(current_stock ?? 0)
    const parsedLowStockThreshold = Number(low_stock_threshold ?? 10)

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: parsedPrice,
        cost: Number.isFinite(parsedCost) ? parsedCost : 0,
        image,
        categoryId: parsedCategoryId,
        isActive: Boolean(is_active ?? true),
        trackInventory: Boolean(track_inventory ?? false),
        currentStock: Number.isFinite(parsedCurrentStock) ? parsedCurrentStock : 0,
        lowStockThreshold: Number.isFinite(parsedLowStockThreshold) ? parsedLowStockThreshold : 10,
        productIngredients: {
          create: Array.isArray(ingredients)
            ? ingredients.map((ing: IngredientInput) => ({
                ingredientId: ing.ingredient_id,
                quantity: ing.quantity_required
              }))
            : []
        }
      },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true
          }
        }
      }
    })

    console.log('[API /products/[id] PUT] Product saved:', {
      id: product.id,
      trackInventory: product.trackInventory,
      currentStock: product.currentStock,
      lowStockThreshold: product.lowStockThreshold
    })

    // Log the activity
    await logTenantActivity(
      tenant.id,
      'PRODUCT_UPDATED',
      undefined,
      {
        productId: product.id,
        productName: product.name,
        changes: {
          name: existingProduct.name !== name,
          price: existingProduct.price !== parsedPrice,
          cost: existingProduct.cost !== parsedCost,
          category: existingProduct.categoryId !== parsedCategoryId,
          status: existingProduct.isActive !== Boolean(is_active ?? true)
        },
        newPrice: parsedPrice,
        newCost: parsedCost
      }
    )

    return NextResponse.json({ success: true, data: { product } })
  } catch (error) {
    console.error('Failed to update product:', error)
    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
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

  const productId = Number(id)

  if (!Number.isInteger(productId)) {
    return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 })
  }

  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: tenant.id }
    })

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    await prisma.product.delete({
      where: { id: productId }
    })

    // Log the activity
    await logTenantActivity(
      tenant.id,
      'PRODUCT_DELETED',
      undefined,
      {
        productId: product.id,
        productName: product.name,
        price: product.price,
        cost: product.cost
      }
    )

    return NextResponse.json({ success: true, message: 'Product deleted' })
  } catch (error) {
    console.error('Failed to delete product:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete product' }, { status: 500 })
  }
}
