import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { isRateLimited, recordFailedAttempt, clearFailedAttempts } from '@/lib/rateLimit'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

/**
 * POST /api/customer/auth/signup
 * Customer signup endpoint - creates customer and returns JWT token
 * Mirrors POS auth flow but without OTP verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subdomain, email, password, firstName, lastName, phone, address } = body

    // Validate required fields
    if (!subdomain || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Subdomain, email, password, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Rate limiting
    const rateLimitKey = `customer_signup_${email.toLowerCase()}`
    if (isRateLimited(rateLimitKey, 5, 900000)) { // 5 attempts per 15 minutes
      recordFailedAttempt(rateLimitKey)
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
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

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        tenantId: tenant.id
      }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: String(email).toLowerCase().trim(),
        phone: phone ? String(phone).trim() : null,
        password: hashedPassword,
        address: address || null,
        isActive: true
      }
    })

    // Clear rate limit on success
    try {
      clearFailedAttempts(rateLimitKey)
    } catch {}

    // Generate JWT token (12 hour expiry)
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
    }, { status: 201 })
  } catch (error) {
    console.error('[CUSTOMER AUTH] Signup error:', error)
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    )
  }
}
