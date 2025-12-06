import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { customerAuthOptions } from '@/lib/customerAuth'
import { prisma } from '@/lib/prisma'

// GET - fetch current customer's orders
export async function GET(request: NextRequest) {
  try {
    // Allow both customer and admin sessions to fetch orders for the currently authenticated user
    let session = await getServerSession(customerAuthOptions)
    if (!session?.user?.email) {
      // Fallback to admin auth if a customer session isn't present
      session = await getServerSession(authOptions)
    }
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If this is a customer session, ensure we only return their own orders
    let customer
    if (session.user.role === 'customer') {
      customer = await prisma.customer.findUnique({ where: { id: parseInt(session.user.id) } })
    } else {
      // Admin session - allow specifying customerId via query param
      const { searchParams } = new URL(request.url)
      const customerIdParam = searchParams.get('customerId') || undefined
      if (customerIdParam) {
        customer = await prisma.customer.findUnique({ where: { id: parseInt(customerIdParam) } })
      } else {
        return NextResponse.json({ error: 'Customer ID is required for admin requests' }, { status: 400 })
      }
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: { product: true }
        }
      }
    })

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        items: order.orderItems
      }))
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
