import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'
import { isRateLimited, recordFailedAttempt } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const rateLimitKey = `forgot_${email}`
    if (isRateLimited(rateLimitKey, 10, 900000)) {
      recordFailedAttempt(rateLimitKey)
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    })
    if (!user) {
      // Don't give away whether the user exists - return 200 OK
      return NextResponse.json({ success: true })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires }
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset?token=${token}`

    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      text: `Click the link to reset your password: ${resetUrl}`,
      html: `<p>Click the link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
