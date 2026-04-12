import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Customer, Order as OrderModel, OrderItem as OrderItemModel, Product } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'
import { logTenantActivity } from '@/lib/activityLogger'

type LoadedOrder = OrderModel & {
  customer: Customer | null
  orderItems: Array<OrderItemModel & { product: Product }>
  employee: { firstName: string; lastName: string; id: number; email: string; role: string } | null
  paymentProof?: string | null
}

function formatOrder(order: LoadedOrder & Record<string, unknown> | null) {
  if (!order) {
    return null
  }

  const subtotal = order.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return {
    id: order.id,
    order_number: order.orderNumber,
    customer_name: order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
      : 'Guest',
    customer_email: order.customer?.email ?? null,
    customer_phone: order.customer?.phone ?? null,
    delivery_address: (order as Record<string, unknown>).deliveryAddress || null,
    delivery_city: null,
    delivery_state: null,
    delivery_postal_code: null,
    created_at: order.createdAt,
    total_amount: order.total,
    subtotal_amount: subtotal,
    tax_amount: order.tax,
    delivery_fee: 0,
    order_status: order.status,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    amount_paid: order.amountPaid,
    paymentProof: (order as any).paymentProof || null,
    order_type: order.orderType,
    employee_name: order.employee
      ? `${order.employee.firstName} ${order.employee.lastName}`.trim()
      : null,
    employee_email: order.employee?.email || null,
    employee_role: order.employee?.role || null,
    OrderItems: order.orderItems.map((item) => ({
      id: item.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity
    }))
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
    const order = (await prisma.order.findFirst({
      where: { id: Number(id), tenantId: tenant.id },
      include: {
        customer: true,
        employee: true,
        orderItems: {
          include: { product: true }
        }
      }
    })) as (LoadedOrder & Record<string, unknown>) | null

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    const formattedOrder = formatOrder(order)
    
    // Debug logging
    console.log('GET /api/orders/[id] - Order details:', {
      id: order.id,
      orderNumber: order.orderNumber,
      paymentProofExists: !!order.paymentProof,
      paymentProofLength: (order.paymentProof as string)?.length || 0,
      paymentProofPreview: (order.paymentProof as string)?.substring(0, 50) + '...'
    })

    return NextResponse.json({ success: true, data: { order: formattedOrder } })
  } catch (error) {
    console.error('Failed to fetch order details:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch order details' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const { order_status, payment_status, amount_paid } = await request.json() as unknown as {
    order_status?: string
    payment_status?: string
    amount_paid?: number
  }

  try {
    const updateData: Record<string, unknown> = {}
    
    // Fetch current order first
    const currentOrder = await prisma.order.findFirst({
      where: { id: Number(id), tenantId: tenant.id },
      include: {
        orderItems: {
          include: { product: true }
        }
      }
    })

    if (!currentOrder) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    console.log(`[API] Updating order ${currentOrder.orderNumber} from ${currentOrder.status} to ${order_status || 'no change'}`)
    console.log(`[API] Order has ${currentOrder.orderItems?.length ?? 0} items`)

    // Handle payment status
    if (payment_status) {
      updateData.paymentStatus = payment_status
      
      // Auto-set amountPaid when status is 'paid'
      if (payment_status === 'paid' && amount_paid === undefined) {
        updateData.amountPaid = currentOrder.total
      }
      
      // Reset amountPaid to 0 when refunded
      if (payment_status === 'refunded') {
        updateData.amountPaid = 0
      }
    }

    // Handle explicit amount_paid
    if (amount_paid !== undefined) {
      updateData.amountPaid = amount_paid
    }

    // Handle order status transitions with inventory management
    if (order_status) {
      updateData.status = order_status
      
      const deductibleStatuses = ['ready', 'completed', 'out_for_delivery', 'delivered']
      const currentStatus = currentOrder.status
      const isTransitioningToDeductible = deductibleStatuses.includes(order_status) && !deductibleStatuses.includes(currentStatus)
      const isCancelling = order_status === 'cancelled' && !deductibleStatuses.includes(currentStatus)
      const isReorderingAfterDeduction = currentStatus === 'cancelled' && !deductibleStatuses.includes(order_status)

      if (isTransitioningToDeductible) {
        // ORDER COMPLETING: Convert reserved stock to permanent deduction
        console.log(`[Order ${currentOrder.orderNumber}] Completing: Converting reserved stock to permanent deduction`)
        
        try {
          await prisma.$transaction(async (tx) => {
            for (const orderItem of currentOrder.orderItems) {
              console.log(`[Inventory] Processing item: ${orderItem.productId}`)
              const product = await tx.product.findUnique({ 
                where: { id: orderItem.productId }, 
                include: { productIngredients: true } 
              })
              
              if (!product) {
                console.warn(`[Inventory] Product ${orderItem.productId} not found - skipping inventory deduction`)
                continue
              }

              if (product.productIngredients && product.productIngredients.length > 0) {
                for (const pi of product.productIngredients) {
                  const deductQty = pi.quantity * orderItem.quantity
                  const ingredient = await tx.ingredient.findUnique({ 
                    where: { id: pi.ingredientId } 
                  })
                  
                  if (!ingredient) {
                    console.warn(`[Inventory] Ingredient ${pi.ingredientId} not found - skipping`)
                    continue
                  }

                  // Check if there's reserved stock to deduct
                  if (ingredient.reservedStock < deductQty) {
                    console.warn(`[Inventory Warning] Not enough reserved stock for ingredient ${ingredient.name}. Reserved: ${ingredient.reservedStock}, Required: ${deductQty}. Deducting available amount.`)
                  }

                  // Deduct up to available reserved stock
                  const deductAmount = Math.min(ingredient.reservedStock, deductQty)
                  if (deductAmount === 0) {
                    console.log(`[Inventory] No stock to deduct for ${ingredient.name}`)
                    continue
                  }

                  // Move from reserved to permanent deduction:
                  // 1. Decrement from reservedStock (clamp to 0)
                  // 2. Decrement from currentStock (clamp to 0)
                  const newReservedStock = Math.max(0, ingredient.reservedStock - deductAmount)
                  const newCurrentStock = Math.max(0, (ingredient.currentStock ?? 0) - deductAmount)
                  await tx.ingredient.update({
                    where: { id: pi.ingredientId },
                    data: {
                      reservedStock: newReservedStock,
                      currentStock: newCurrentStock
                    }
                  })

                  // Log the permanent deduction
                  await tx.inventoryTransaction.create({
                    data: {
                      tenantId: tenant.id,
                      ingredientId: pi.ingredientId,
                      type: 'out',
                      quantity: deductAmount,
                      reason: `Order ${currentOrder.orderNumber} - COMPLETED`,
                      cost: Number(ingredient.costPerUnit ?? 0) * deductAmount
                    }
                  })
                }
              }
            }
          })
        } catch (inventoryError) {
          console.error(`[Inventory Error] Failed to process inventory for order ${currentOrder.orderNumber}:`, inventoryError)
          throw inventoryError
        }
      } else if (isCancelling) {
        // ORDER CANCELLING: Release reserved stock back to available
        console.log(`[Order ${currentOrder.orderNumber}] Cancelling: Releasing reserved stock`)
        
        try {
          await prisma.$transaction(async (tx) => {
            for (const orderItem of currentOrder.orderItems) {
              const product = await tx.product.findUnique({
                where: { id: orderItem.productId },
                include: { productIngredients: true }
              })
              
              if (!product) {
                console.warn(`[Inventory] Product ${orderItem.productId} not found - skipping release`)
                continue
              }

              if (product.productIngredients && product.productIngredients.length > 0) {
                for (const pi of product.productIngredients) {
                  const releaseQty = pi.quantity * orderItem.quantity
                  const ingredient = await tx.ingredient.findUnique({
                    where: { id: pi.ingredientId }
                  })
                  
                  if (!ingredient) {
                    console.warn(`[Inventory] Ingredient ${pi.ingredientId} not found - skipping release`)
                    continue
                  }

                  // Release reserved stock (just decrement reservedStock, currentStock unchanged)
                  // Ensure reservedStock doesn't go negative
                  const newReservedStock = Math.max(0, ingredient.reservedStock - releaseQty)
                  await tx.ingredient.update({
                    where: { id: pi.ingredientId },
                    data: {
                      reservedStock: newReservedStock
                    }
                  })

                  // Log the release
                  await tx.inventoryTransaction.create({
                    data: {
                      tenantId: tenant.id,
                      ingredientId: pi.ingredientId,
                      type: 'reserved_released',
                      quantity: releaseQty,
                      reason: `Order ${currentOrder.orderNumber} - CANCELLED`
                    }
                  })
                }
              }
            }
          })
        } catch (inventoryError) {
          console.error(`[Inventory Error] Failed to release inventory for order ${currentOrder.orderNumber}:`, inventoryError)
          throw inventoryError
        }
      }
    }

    const updatedOrder = (await prisma.order.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        customer: true,
        orderItems: {
          include: { product: true }
        }
      }
    })) as LoadedOrder & Record<string, unknown>

    // Log the activity
    await logTenantActivity(
      tenant.id,
      'ORDER_UPDATED',
      undefined,
      {
        orderId: Number(id),
        orderNumber: currentOrder.orderNumber,
        changes: Object.keys(updateData),
        newStatus: updateData.status,
        newPaymentStatus: updateData.paymentStatus,
        amountPaid: updateData.amountPaid
      }
    )

    const formattedOrder = formatOrder(updatedOrder)

    return NextResponse.json({ success: true, data: { order: formattedOrder } })
  } catch (error) {
    console.error('Failed to update order:', error)
    const msg = (error instanceof Error) ? error.message : 'Failed to update order'
    const userStatus = msg && msg.toLowerCase().includes('insufficient') ? 400 : 500
    return NextResponse.json({ success: false, message: msg }, { status: userStatus })
  }
}
