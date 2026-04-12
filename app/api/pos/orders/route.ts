import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activityLogger'
import { createPOSOrderSchema } from '@/lib/validation'
import { z } from 'zod'

// POST /api/pos/orders - Create a new POS order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verify session and POS employee status
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionUser = session.user as { id?: string; tenantId?: string; userType?: string }
    if (sessionUser.userType !== 'pos_employee') {
      return NextResponse.json({ error: 'Only POS employees can create orders' }, { status: 403 })
    }

    const employeeId = sessionUser.id ? parseInt(sessionUser.id) : null
    const tenantId = sessionUser.tenantId ? parseInt(sessionUser.tenantId) : null

    if (!employeeId || !tenantId) {
      return NextResponse.json({ error: 'Invalid employee or tenant' }, { status: 400 })
    }

    const body = await request.json()
    
    // Validate input with Zod
    let validated
    try {
      validated = createPOSOrderSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
        return NextResponse.json(
          { error: 'Invalid request data', details: errorDetails },
          { status: 400 }
        )
      }
      throw error
    }
    
    const { items, paymentMethod, discount } = validated
    const customerId = body.customerId || null
    const notes = body.notes || null

    // Calculate totals
    let subtotal = 0
    const orderItems: any[] = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          productVariants: true
        }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        )
      }

      // Determine the price: use variant price if variantId is provided, otherwise use base price
      let itemUnitPrice = product.price
      let selectedVariantId = null

      if (item.variantId) {
        const variant = product.productVariants?.find(v => v.id === item.variantId)
        if (variant) {
          itemUnitPrice = variant.price
          selectedVariantId = variant.id
        } else {
          // Variant not found, return error
          return NextResponse.json(
            { error: `Variant ${item.variantId} not found for product ${item.productId}` },
            { status: 404 }
          )
        }
      }

      const itemPrice = itemUnitPrice * item.quantity
      subtotal += itemPrice

      orderItems.push({
        productId: item.productId,
        variantId: selectedVariantId,
        quantity: item.quantity,
        price: itemUnitPrice,
        notes: item.notes || null
      })
    }

    // Get tenant settings for tax rate (default to 0% if not set)
    const tenantSettings = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    })
    const taxPercentage = (tenantSettings?.settings as any)?.tax?.defaultTaxPercent || 0
    const taxRate = taxPercentage / 100
    
    const discountAmount = discount || 0
    const tax = (subtotal - discountAmount) * taxRate
    const total = subtotal - discountAmount + tax

    // Generate unique order number
    const orderNumber = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create order and RESERVE inventory (don't permanently deduct yet)
    const order = await prisma.$transaction(async (tx) => {
      // Create order with 'pending' status (not immediately 'completed')
      const created = await tx.order.create({
        data: {
          tenantId: tenantId,
          employeeId: employeeId,
          customerId: customerId || null,
          orderNumber,
          orderType: 'pos',
          status: 'pending',  // Changed: Start as pending, only complete when confirmed
          total,
          tax,
          discount: discountAmount,
          paymentMethod: paymentMethod || 'cash',
          notes: notes || null,
          orderItems: {
            create: orderItems
          }
        },
        include: {
          orderItems: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      })

      // RESERVE inventory for each order item (temporary hold, not permanent deduction)
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { 
            productIngredients: true,
            productVariants: {
              where: { id: item.variantId ?? undefined },
              include: { variantIngredients: true }
            }
          }
        })

        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }

        // Determine which ingredients to use: variant-specific or product-level
        let ingredientsToReserve: Array<{ ingredientId: number; quantity: number }> = []

        if (item.variantId && product.productVariants.length > 0) {
          // Use variant-specific ingredients
          const variant = product.productVariants[0]
          if (variant.variantIngredients.length > 0) {
            ingredientsToReserve = variant.variantIngredients.map(vi => ({
              ingredientId: vi.ingredientId,
              quantity: vi.quantity
            }))
          } else {
            // Variant has no specific ingredients, fall back to product ingredients
            ingredientsToReserve = product.productIngredients.map(pi => ({
              ingredientId: pi.ingredientId,
              quantity: pi.quantity
            }))
          }
        } else {
          // Use product-level ingredients
          ingredientsToReserve = product.productIngredients.map(pi => ({
            ingredientId: pi.ingredientId,
            quantity: pi.quantity
          }))
        }

        // Reserve each ingredient
        for (const ing of ingredientsToReserve) {
          const reserveQty = ing.quantity * item.quantity

          const ingredient = await tx.ingredient.findUnique({ where: { id: ing.ingredientId } })
          if (!ingredient) {
            throw new Error(`Ingredient ${ing.ingredientId} not found for product ${product.id}`)
          }

          // Check: available stock = currentStock - reservedStock
          const availableStock = ingredient.currentStock - ingredient.reservedStock
          if (availableStock < reserveQty) {
            throw new Error(`Insufficient stock for ${ingredient.name}. Required: ${reserveQty}, Available: ${availableStock}`)
          }

          // Reserve the stock (increment reservedStock, don't touch currentStock)
          await tx.ingredient.update({
            where: { id: ing.ingredientId },
            data: { reservedStock: { increment: reserveQty } }
          })

          // Log the reservation (type: 'reserved')
          await tx.inventoryTransaction.create({
            data: {
              tenantId: tenantId,
              ingredientId: ing.ingredientId,
              type: 'reserved',
              quantity: reserveQty,
              reason: `POS Order ${orderNumber} - RESERVED`,
              performedBy: employeeId
            }
          })
        }
      }

      // Update POS session stats
      await tx.pOSSession.updateMany({
        where: {
          employeeId: employeeId,
          isActive: true
        },
        data: {
          totalSales: { increment: total },
          totalOrders: { increment: 1 }
        }
      })

      return created
    })

    // Log the POS order creation
    await logActivity({
      tenantId: tenantId,
      action: 'ORDER_CREATED',
      details: {
        orderId: order.id,
        orderNumber,
        itemCount: items.length,
        subtotal,
        discount,
        total,
        paymentMethod,
        employeeId: employeeId,
        customerId,
        orderType: 'POS'
      }
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Error creating POS order:', error)
    // Propagate validation errors as 400 so clients can show friendly messages
    const msg = (error instanceof Error) ? error.message : 'Failed to create order'
    const userStatus = msg && msg.toLowerCase().includes('insufficient') ? 400 : 500
    return NextResponse.json({ error: msg }, { status: userStatus })
  }
}

// GET /api/pos/orders - Get recent POS orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verify session and POS employee status
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionUser = session.user as { tenantId?: string; userType?: string }
    if (sessionUser.userType !== 'pos_employee') {
      return NextResponse.json({ error: 'Only POS employees can view orders' }, { status: 403 })
    }

    const tenantId = sessionUser.tenantId ? parseInt(sessionUser.tenantId) : null
    if (!tenantId) {
      return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const orders = await prisma.order.findMany({
      where: {
        tenantId: tenantId,
        orderType: 'pos'
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        employee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching POS orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
