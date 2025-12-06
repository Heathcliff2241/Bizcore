import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

// POST /api/pos/auth/login - Employee login for POS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subdomain, email, password, pin } = body

    // Validate required fields
    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 })
    }

    if (!email || (!password && !pin)) {
      return NextResponse.json(
        { error: 'Email and password/PIN are required' },
        { status: 400 }
      )
    }

    // Find tenant by subdomain
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: subdomain.toLowerCase() }
    })

    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ error: 'Store not found or inactive' }, { status: 404 })
    }

    // Find employee
    const employee = await prisma.employee.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: email.toLowerCase()
        }
      }
    })

    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password or PIN
    let isValid = false
    
    if (pin && employee.pin) {
      isValid = await bcrypt.compare(pin, employee.pin)
    } else if (password) {
      isValid = await bcrypt.compare(password, employee.password)
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Update last login
    await prisma.employee.update({
      where: { id: employee.id },
      data: { lastLogin: new Date() }
    })

    // Generate JWT token
    const token = jwt.sign(
      {
        employeeId: employee.id,
        tenantId: tenant.id,
        role: employee.role,
        email: employee.email
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    )

    // Extract tax settings from tenant
    const tax = tenant.settings && typeof tenant.settings === 'object' && 'tax' in tenant.settings
      ? (tenant.settings as Record<string, unknown>).tax
      : { defaultTaxPercent: 0 }

    return NextResponse.json({
      success: true,
      token,
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain
      },
      settings: {
        tax
      }
    })
  } catch (error) {
    console.error('POS login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
