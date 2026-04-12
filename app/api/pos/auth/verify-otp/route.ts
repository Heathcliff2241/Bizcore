/**
 * POST /api/pos/auth/verify-otp
 * Endpoint to verify OTP for POS employee sign-in
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyStoredOTP } from '@/lib/otp'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subdomain, email, otp } = body

    // Validate input
    if (!subdomain || !email || !otp) {
      return NextResponse.json(
        { error: 'Subdomain, email, and OTP are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Verify OTP (use 'tenant' type for employee OTPs)
    const isValid = await verifyStoredOTP(normalizedEmail, otp, 'tenant')
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
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
          email: normalizedEmail
        }
      }
    })

    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Employee not found or inactive' }, { status: 404 })
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
    console.error('❌ POS OTP verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const maxDuration = 60
