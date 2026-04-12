/**
 * POST /api/pos/auth/request-otp
 * Endpoint to request OTP for POS employee sign-in
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOtpEmail } from '@/lib/email'
import { generateOtp, maskEmail, isValidEmail, storeOTP } from '@/lib/otp'
import { rateLimits } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subdomain, email, password, pin } = body

    // Validate input
    if (!subdomain || !email) {
      return NextResponse.json(
        { error: 'Subdomain and email are required' },
        { status: 400 }
      )
    }

    if (!password && !pin) {
      return NextResponse.json(
        { error: 'Password or PIN is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check rate limit: 3 OTP requests per email per hour
    const rateLimitResult = rateLimits.otpRequest(normalizedEmail)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many OTP requests',
          message: `Please try again in ${rateLimitResult.retryAfter} seconds`,
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429, headers: { 'Retry-After': `${rateLimitResult.retryAfter}` } }
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
      // Clear error message - employee not found on this specific store
      return NextResponse.json(
        { error: 'Employee not found on this store. Please verify your email and store.' },
        { status: 404 }
      )
    }

    // Verify password or PIN
    let isValid = false
    
    if (pin && employee.pin) {
      isValid = await bcrypt.compare(pin, employee.pin)
    } else if (password) {
      isValid = await bcrypt.compare(password, employee.password)
    }

    if (!isValid) {
      // Clear error message for invalid credentials
      return NextResponse.json(
        { error: 'Invalid password or PIN' },
        { status: 401 }
      )
    }

    // Generate OTP
    const otp = generateOtp(6)

    // Store OTP in database (use 'tenant' type for employee OTPs)
    await storeOTP(normalizedEmail, otp, 'tenant')

    // Send OTP email with 'pos' purpose for POS-specific messaging
    try {
      await sendOtpEmail(normalizedEmail, otp, 10, 'pos')
    } catch (emailError) {
      console.error('Failed to send POS OTP email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: `OTP sent to ${maskEmail(normalizedEmail)}`,
        maskedEmail: maskEmail(normalizedEmail),
        email: normalizedEmail,
        expiresIn: 600 // 10 minutes in seconds
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ POS OTP request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const maxDuration = 60
