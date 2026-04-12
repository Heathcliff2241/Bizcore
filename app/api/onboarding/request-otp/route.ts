/**
 * POST /api/onboarding/request-otp
 * Endpoint to request an OTP for email verification during onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOtpEmail } from '@/lib/email'
import { generateOtp, calculateOtpExpiry, maskEmail, isValidEmail, sanitizeBusinessName } from '@/lib/otp'
import { rateLimits } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()
    const { email, businessName } = body

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required and must be a string' },
        { status: 400 }
      )
    }

    if (!businessName || typeof businessName !== 'string') {
      return NextResponse.json(
        { error: 'Business name is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const sanitizedBusinessName = sanitizeBusinessName(businessName)

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

    // Check if email already has an active registration
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser?.emailVerified) {
      return NextResponse.json(
        {
          error: 'Email already registered',
          message: 'This email is already registered. Please sign in instead.'
        },
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = generateOtp(6)
    const otpExpiry = calculateOtpExpiry(10) // 10 minutes

    // If user exists but not verified, update OTP
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          emailVerificationOtp: otp,
          emailVerificationOtpExpires: otpExpiry,
          emailVerificationAttempts: 0 // Reset attempts
        } as any // eslint-disable-line @typescript-eslint/no-explicit-any
      })
    } else {
      // Create new user with OTP
      await prisma.user.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          email: normalizedEmail,
          firstName: sanitizedBusinessName.split(' ')[0] || 'User',
          lastName: sanitizedBusinessName.split(' ').slice(1).join(' ') || 'Account',
          password: '', // Will be set after OTP verification
          role: 'tenant_owner',
          emailVerified: false,
          emailVerificationOtp: otp,
          emailVerificationOtpExpires: otpExpiry,
          emailVerificationAttempts: 0
        } as any // eslint-disable-line @typescript-eslint/no-explicit-any
      })
    }

    // Send OTP email with 'verify' purpose for email verification during onboarding
    try {
      await sendOtpEmail(normalizedEmail, otp, 30, 'verify')
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      // Don't fail the request if email fails, but log it
      // In production, you might want to use a queue system for emails
    }

    // Return success response with masked email
    return NextResponse.json(
      {
        success: true,
        message: `OTP sent to ${maskEmail(normalizedEmail)}`,
        email: normalizedEmail, // Return full email for frontend to use
        maskedEmail: maskEmail(normalizedEmail),
        expiresIn: 600, // 10 minutes in seconds
        businessName: sanitizedBusinessName
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ OTP request error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process OTP request' },
      { status: 500 }
    )
  }
}

// Configure timeout for serverless
export const maxDuration = 60 // 60 seconds
