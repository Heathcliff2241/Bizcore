import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - fetch current customer's orders
export async function GET(request: NextRequest) {
  try {
    // Allow both customer and admin sessions to fetch orders for the currently authenticated user
    const session = await getServerSession(authOptions)
    console.log('[CUSTOMERS/ORDERS GET] Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      email: session?.user?.email,
      role: session?.user?.role,
      id: session?.user?.id,
      tenantId: (session?.user as any)?.tenantId
    })

    if (!session?.user?.email) {
      console.log('[CUSTOMERS/ORDERS GET] No session or email found - returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If this is a customer session, ensure we only return their own orders
    let customer
    const customerId = parseInt(session.user.id)
    console.log('[CUSTOMERS/ORDERS GET] Role:', session.user.role, 'Customer ID to lookup:', customerId)

    if (session.user.role === 'customer') {
      console.log('[CUSTOMERS/ORDERS GET] Looking up customer with ID:', customerId)
      customer = await prisma.customer.findUnique({ where: { id: customerId } })
      console.log('[CUSTOMERS/ORDERS GET] Customer lookup result:', !!customer, customer?.id)
    } else {
      // Admin session - allow specifying customerId via query param
      const { searchParams } = new URL(request.url)
      const customerIdParam = searchParams.get('customerId') || undefined
      if (customerIdParam) {
        console.log('[CUSTOMERS/ORDERS GET] Admin session - looking up customer:', customerIdParam)
        customer = await prisma.customer.findUnique({ where: { id: parseInt(customerIdParam) } })
      } else {
        console.log('[CUSTOMERS/ORDERS GET] Admin session but no customerId provided')
        return NextResponse.json({ error: 'Customer ID is required for admin requests' }, { status: 400 })
      }
    }

    if (!customer) {
      console.log('[CUSTOMERS/ORDERS GET] Customer not found - returning 404')
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    console.log('[CUSTOMERS/ORDERS GET] Fetching orders for customer:', customer.id)
    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: { product: true }
        }
      }
    })

    console.log('[CUSTOMERS/ORDERS GET] Found', orders.length, 'orders')
    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentProof: (order as any).paymentProof || null,
        createdAt: order.createdAt,
        items: order.orderItems
      }))
    })
  } catch (error) {
    console.error('[CUSTOMERS/ORDERS GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
