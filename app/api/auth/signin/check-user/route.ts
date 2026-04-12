/**
 * POST /api/auth/signin/check-user
 * Endpoint to check if a user exists (non-sensitive check for UX)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidEmail } from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, userType = 'employee' } = body

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!['employee', 'admin'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          exists: false,
          message: 'Invalid email format'
        },
        { status: 200 }
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
    }

    if (!user) {
      return NextResponse.json(
        {
          exists: false,
          message: `No ${userType} account found for this email`,
          userType
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        exists: true,
        email: normalizedEmail,
        userType: userType === 'employee' && user.role === 'admin' ? 'admin' : userType,
        firstName: user.firstName,
        lastName: user.lastName
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Check user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const maxDuration = 60
