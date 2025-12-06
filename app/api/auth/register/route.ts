import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isRateLimited, recordFailedAttempt, clearFailedAttempts } from '@/lib/rateLimit'
import { logActivity, getClientIp, getUserAgent, normalizeUserRole } from '@/lib/activityLogger'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, businessName } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Prevent abuse - rate limit registration attempts
    if (isRateLimited(`register_${email}`, 5, 900000)) {
      recordFailedAttempt(`register_${email}`)
      return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 })
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 } // Use 409 for conflict
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Split name into first and last
    const [firstName, ...lastNameParts] = name.split(' ')
    const lastName = lastNameParts.join(' ') || ''

    // Create user only (tenant will be created during onboarding)
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'tenant_owner', // Assign tenant owner role
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    });

    clearFailedAttempts(`register_${email}`)
    
    // Log tenant owner signup (normalize role from tenant_owner to tenant)
    await logActivity({
      userId: user.id,
      action: 'TENANT_SIGNUP',
      details: {
        email: user.email,
        name: user.firstName + ' ' + user.lastName,
        role: normalizeUserRole('tenant_owner'),
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    })
    
    return NextResponse.json(
      {
        message: 'User created successfully. Please complete onboarding.',
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}