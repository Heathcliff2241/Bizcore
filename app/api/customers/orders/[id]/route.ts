import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - fetch a specific order for the current customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve params (handle both Promise and direct object)
    const resolvedParams = typeof (params as PromiseLike<{ id: string }>).then === 'function'
      ? await (params as PromiseLike<{ id: string }>)
      : (params as { id: string })

    const orderId = parseInt(resolvedParams.id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    // Get the customer - use findFirst since email alone is not unique (tenantId + email is)
    const customer = await prisma.customer.findFirst({
      where: { email: session.user.email }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Fetch the order and ensure it belongs to the customer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { product: true }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify the order belongs to this customer
    if (order.customerId !== customer.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        tax: order.tax,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentProof: (order as Record<string, unknown>).paymentProof || null,
        createdAt: order.createdAt,
        orderItems: order.orderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: item.product ? {
            id: item.product.id,
            name: item.product.name,
            image: item.product.image
          } : null
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - cancel an order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve params
    const resolvedParams = typeof (params as PromiseLike<{ id: string }>).then === 'function'
      ? await (params as PromiseLike<{ id: string }>)
      : (params as { id: string })

    const orderId = parseInt(resolvedParams.id)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    // Get the customer
    const customer = await prisma.customer.findFirst({
      where: { email: session.user.email }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify ownership
    if (order.customerId !== customer.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'preparing']
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot cancel order with status '${order.status}'. Orders can only be cancelled if they are pending, confirmed, or being prepared.` },
        { status: 400 }
      )
    }

    // Cancel the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled'
      }
    })

    return NextResponse.json({
      message: 'Order cancelled successfully',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt
      }
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }
}
