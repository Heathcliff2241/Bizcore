import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

/**
 * GET /api/customer/[id]
 * Fetch customer details by ID
 * Requires valid JWT token in Authorization header
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization token' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    // Verify token
    let decoded: Record<string, unknown>
    try {
      decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>
    } catch (err) {
      console.error('[CUSTOMER_GET] Token verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Ensure token belongs to the customer being requested
    if (String(decoded.customerId) !== customerId) {
      return NextResponse.json(
        { error: 'Unauthorized: Token does not match customer ID' },
        { status: 403 }
      )
    }

    // Fetch customer from database
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId, 10) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        tenantId: true
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('[CUSTOMER_GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
