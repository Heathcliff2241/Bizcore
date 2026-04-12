import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

/**
 * POST /api/customer/auth/login
 * Customer login endpoint - returns JWT token (no NextAuth session)
 * This avoids JWT_SESSION_ERROR issues by using standalone JWT
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subdomain, email, password } = body

    // Validate required fields
    if (!subdomain || !email || !password) {
      return NextResponse.json(
        { error: 'Subdomain, email, and password are required' },
        { status: 400 }
      )
    }

    // Find tenant by subdomain
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: subdomain.toLowerCase() }
    })

    if (!tenant || !tenant.isActive) {
      return NextResponse.json(
        { error: 'Store not found or inactive' },
        { status: 404 }
      )
    }

    // Find customer
    const customer = await prisma.customer.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        tenantId: tenant.id,
        isActive: true
      }
    })

    if (!customer || !customer.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, customer.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLogin: new Date() }
    })

    // Generate JWT token (12 hour expiry, like POS)
    const token = jwt.sign(
      {
        customerId: customer.id,
        tenantId: tenant.id,
        email: customer.email,
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    )

    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain
      }
    })
  } catch (error) {
    console.error('[CUSTOMER AUTH] Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
