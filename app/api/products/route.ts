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

export async function GET(request: NextRequest) {
  console.log('[API /products] Request headers:', Object.fromEntries(request.headers.entries()))
  console.log('[API /products] Cookies:', request.cookies.getAll())
  
  const session = await getServerSession(authOptions)
  console.log('[API /products] Session:', session ? 'Found' : 'Not found', session?.user?.email)
  
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
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true
          }
        },
        productVariants: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      cost_price: product.cost,
      image: product.image,
      sku: null,
      category_id: product.categoryId,
      category_name: product.category?.name,
      track_inventory: product.trackInventory,
      current_stock: product.currentStock,
      low_stock_threshold: product.lowStockThreshold,
      is_active: product.isActive,
      Ingredients: product.productIngredients.map((pi) => ({
        id: pi.ingredient.id,
        name: pi.ingredient.name,
        unit_of_measure: pi.ingredient.unit,
        ProductIngredient: {
          quantity_required: pi.quantity
        }
      })),
      productVariants: product.productVariants,
      Category: product.category ? { id: product.category.id, name: product.category.name } : null
    }))

    return NextResponse.json({ success: true, data: formattedProducts })
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    console.log('[API /products POST] Received payload:', {
      track_inventory,
      current_stock,
      low_stock_threshold,
      fullBody: body
    })

    if (!name) {
      return NextResponse.json({ success: false, message: 'Product name is required' }, { status: 400 })
    }

    // Price is optional if variants are used, defaults to 0
    const parsedPrice = Number(price ?? 0)
    const parsedCost = Number(cost_price ?? 0)

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ success: false, message: 'Price must be a valid non-negative number' }, { status: 400 })
    }

    const parsedCategoryId = category_id !== undefined && category_id !== null && category_id !== '' ? Number(category_id) : null

    if (parsedCategoryId !== null && !Number.isInteger(parsedCategoryId)) {
      return NextResponse.json({ success: false, message: 'Category must be a valid identifier' }, { status: 400 })
    }

    const parsedCurrentStock = Number(current_stock ?? 0)
    const parsedLowStockThreshold = Number(low_stock_threshold ?? 10)

    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
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

    console.log('[API /products POST] Product created:', {
      id: product.id,
      trackInventory: product.trackInventory,
      currentStock: product.currentStock,
      lowStockThreshold: product.lowStockThreshold
    })

    // Log the activity
    await logTenantActivity(
      tenant.id,
      'PRODUCT_CREATED',
      undefined,
      {
        productId: product.id,
        productName: name,
        price: parsedPrice,
        cost: parsedCost,
        categoryId: parsedCategoryId,
        ingredientCount: Array.isArray(ingredients) ? ingredients.length : 0
      }
    )

    return NextResponse.json({ success: true, data: { product } })
  } catch (error) {
    console.error('Failed to create product:', error)
    return NextResponse.json({ success: false, message: 'Failed to create product' }, { status: 500 })
  }
}
