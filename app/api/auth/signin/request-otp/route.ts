/**
 * POST /api/auth/signin/request-otp
 * Endpoint to request OTP for sign-in
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
    const { email, password, userType = 'employee' } = body

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!['employee', 'tenant', 'admin'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
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

    let user = null

    // If userType is 'employee' (default), try to detect if this is actually an admin account
    if (userType === 'employee') {
      // First check if it's an admin
      const adminUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive'
          },
          role: 'admin'
        }
      })

      if (adminUser) {
        user = adminUser
      } else {
        // Not admin, check if it's a regular employee
        user = await prisma.user.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: 'insensitive'
            },
            role: {
              in: ['user', 'tenant_owner']
            }
          }
        })
      }

      if (!user) {
        // Don't reveal if user doesn't exist (security)
        return NextResponse.json(
          {
            success: true,
            message: `If an account exists for ${maskEmail(normalizedEmail)}, you will receive an OTP`,
            maskedEmail: maskEmail(normalizedEmail),
            expiresIn: 600,
            userType: 'employee'
          },
          { status: 200 }
        )
      }
    } else if (userType === 'admin') {
      // Check if user is admin
      user = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive'
          },
          role: 'admin'
        }
      })

      if (!user) {
        // Don't reveal if user doesn't exist (security)
        return NextResponse.json(
          {
            success: true,
            message: `If an admin account exists for ${maskEmail(normalizedEmail)}, you will receive an OTP`,
            maskedEmail: maskEmail(normalizedEmail),
            expiresIn: 600,
            userType: 'admin'
          },
          { status: 200 }
        )
      }
    } else if (userType === 'tenant') {
      // For tenant sign-in, user must exist and own/be member of a tenant
      user = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive'
          }
        },
        include: {
          ownedTenants: {
            where: { isActive: true },
            select: { id: true }
          },
          tenantUsers: {
            where: { tenant: { isActive: true } },
            select: { tenantId: true }
          }
        }
      })

      if (!user || (user.ownedTenants.length === 0 && user.tenantUsers.length === 0)) {
        return NextResponse.json(
          {
            success: true,
            message: `If an account exists for ${maskEmail(normalizedEmail)}, you will receive an OTP`,
            maskedEmail: maskEmail(normalizedEmail),
            expiresIn: 600,
            userType: 'tenant'
          },
          { status: 200 }
        )
      }
    }

    // Validate password if provided
    if (password && user) {
      if (!user.password) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
    }

    // Generate OTP
    const otp = generateOtp(6)

    // Store OTP in database (use 'tenant' type for all users, includes employees/admins)
    await storeOTP(normalizedEmail, otp, 'tenant')

    // Send OTP email with 'signin' purpose
    try {
      await sendOtpEmail(normalizedEmail, otp, 10, 'signin')
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
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
        expiresIn: 600, // 10 minutes in seconds
        userType
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ OTP sign-in request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const maxDuration = 60
