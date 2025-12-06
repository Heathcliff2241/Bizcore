/**
 * POST /api/onboarding/verify-otp
 * Endpoint to verify OTP and create temporary verification token
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidOtpFormat, isOtpExpired, generateVerificationToken } from '@/lib/otp'
import { rateLimits } from '@/lib/rate-limit'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, otp } = body

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check rate limit: 5 OTP verification attempts per email per 15 minutes
    const rateLimitResult = rateLimits.otpVerify(normalizedEmail)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many verification attempts',
          message: `Please try again in ${rateLimitResult.retryAfter} seconds. Your account is temporarily locked for security.`,
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429, headers: { 'Retry-After': `${rateLimitResult.retryAfter}` } }
      )
    }

    // Validate OTP format
    if (!isValidOtpFormat(otp, 6)) {
      return NextResponse.json(
        { error: 'Invalid OTP format. OTP must be 6 digits.' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please request a new OTP.' },
        { status: 404 }
      )
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified. Please sign in.' },
        { status: 400 }
      )
    }

    // Check if OTP exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(user as any).emailVerificationOtp) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new OTP.' },
        { status: 400 }
      )
    }

    // Check if OTP is expired
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (isOtpExpired((user as any).emailVerificationOtpExpires)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationOtp: null,
          emailVerificationOtpExpires: null
        } as any // eslint-disable-line @typescript-eslint/no-explicit-any
      })

      return NextResponse.json(
        { error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      )
    }

    // Verify OTP matches
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((user as any).emailVerificationOtp !== otp) {
      // Increment failed attempts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newAttempts = ((user as any).emailVerificationAttempts || 0) + 1

      if (newAttempts >= 5) {
        // Lock account for 15 minutes
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lockUntil,
            emailVerificationAttempts: newAttempts
          } as any // eslint-disable-line @typescript-eslint/no-explicit-any
        })

        return NextResponse.json(
          {
            error: 'Too many incorrect OTP attempts. Account locked for 15 minutes.',
            attempts: newAttempts,
            maxAttempts: 5
          },
          { status: 400 }
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationAttempts: newAttempts } as any // eslint-disable-line @typescript-eslint/no-explicit-any
      })

      return NextResponse.json(
        {
          error: 'Invalid OTP. Please try again.',
          attempts: newAttempts,
          attemptsRemaining: 5 - newAttempts
        },
        { status: 400 }
      )
    }

    // OTP is valid! Generate verification token for one-time use
    const verificationToken = generateVerificationToken()

    // Store verification token (could also use JWT)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationAttempts: 0, // Reset attempts on success
        emailVerificationOtp: null, // Clear OTP
        emailVerificationOtpExpires: null
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    })

    // Create JWT token for session (alternative method)
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        verificationToken: verificationToken,
        type: 'onboarding'
      },
      process.env.NEXTAUTH_SECRET || 'your-secret-key',
      { expiresIn: '30m' }
    )

    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully',
        email: normalizedEmail,
        verificationToken: verificationToken,
        sessionToken: jwtToken, // Can use this for frontend session
        expiresIn: 1800, // 30 minutes in seconds
        userId: user.id
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ OTP verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}

// Configure timeout for serverless
export const maxDuration = 60 // 60 seconds
