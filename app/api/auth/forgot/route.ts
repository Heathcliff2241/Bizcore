import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOtpEmail } from '@/lib/email'
import { generateOtp, maskEmail, isValidEmail, storeOTP } from '@/lib/otp'
import { rateLimits } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
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
          error: 'Too many password reset requests',
          message: 'Please try again later',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      )
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      }
    })

    if (!user) {
      // Don't give away whether the user exists - return 200 OK
      return NextResponse.json({
        success: true,
        message: `If an account exists for ${maskEmail(normalizedEmail)}, you will receive an OTP`,
        maskedEmail: maskEmail(normalizedEmail),
        expiresIn: 900
      })
    }

    // Generate OTP
    const otp = generateOtp(6)

    // Store OTP in database with 'tenant' type (password reset uses same OTP system as sign-in)
    await storeOTP(normalizedEmail, otp, 'tenant')

    // Send OTP email with 'reset' purpose for password reset messaging
    try {
      await sendOtpEmail(normalizedEmail, otp, 15, 'reset')
    } catch (emailError) {
      console.error('Failed to send reset OTP email:', emailError)
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
        expiresIn: 900 // 15 minutes in seconds
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
