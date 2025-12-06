import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activityLogger'
import jwt from 'jsonwebtoken'
import { createPOSOrderSchema } from '@/lib/validation'
import { z } from 'zod'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as {
      employeeId: number
      tenantId: number
      role: string
    }
  } catch {
    return null
  }
}

// POST /api/pos/orders - Create a new POS order
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        where: { id: item.productId }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        )
      }

      const itemPrice = product.price * item.quantity
      subtotal += itemPrice

      orderItems.push({
        productId: item.productId,
        // variantId: item.variantId || null,
        quantity: item.quantity,
        price: product.price,
        notes: item.notes || null
      })
    }

    // Get tenant settings for tax rate (default to 1% if not set)
    const tenantSettings = await prisma.tenant.findUnique({
      where: { id: decoded.tenantId },
      select: { settings: true }
    })
    const taxRate = (tenantSettings?.settings as any)?.tax?.defaultTaxPercent || 0.01
    
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
          tenantId: decoded.tenantId,
          employeeId: decoded.employeeId,
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
          include: { productIngredients: true }
        })

        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }

        if (product.productIngredients) {
          for (const pi of product.productIngredients) {
            const reserveQty = pi.quantity * item.quantity

            const ingredient = await tx.ingredient.findUnique({ where: { id: pi.ingredientId } })
            if (!ingredient) {
              throw new Error(`Ingredient ${pi.ingredientId} not found for product ${product.id}`)
            }

            // Check: available stock = currentStock - reservedStock
            const availableStock = ingredient.currentStock - ingredient.reservedStock
            if (availableStock < reserveQty) {
              throw new Error(`Insufficient stock for ${ingredient.name}. Required: ${reserveQty}, Available: ${availableStock}`)
            }

            // Reserve the stock (increment reservedStock, don't touch currentStock)
            await tx.ingredient.update({
              where: { id: pi.ingredientId },
              data: { reservedStock: { increment: reserveQty } }
            })

            // Log the reservation (type: 'reserved')
            await tx.inventoryTransaction.create({
              data: {
                tenantId: decoded.tenantId,
                ingredientId: pi.ingredientId,
                type: 'reserved',
                quantity: reserveQty,
                reason: `POS Order ${orderNumber} - RESERVED`,
                performedBy: decoded.employeeId
              }
            })
          }
        }
      }

      // Update POS session stats
      await tx.pOSSession.updateMany({
        where: {
          employeeId: decoded.employeeId,
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
      tenantId: decoded.tenantId,
      action: 'ORDER_CREATED',
      details: {
        orderId: order.id,
        orderNumber,
        itemCount: items.length,
        subtotal,
        discount,
        total,
        paymentMethod,
        employeeId: decoded.employeeId,
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
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const orders = await prisma.order.findMany({
      where: {
        tenantId: decoded.tenantId,
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
