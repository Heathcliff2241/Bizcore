/**
 * POST /api/auth/signin/verify-otp
 * Endpoint to verify OTP for sign-in and generate session
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyStoredOTP } from '@/lib/otp'
import { logActivity } from '@/lib/activityLogger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, otp, userType = 'employee' } = body

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
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

    // Verify OTP - all sign-in OTPs are stored as 'tenant' type
    const isValid = await verifyStoredOTP(normalizedEmail, otp, 'tenant')
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      )
    }

    // Find user - support admin, tenant owners, and employees
    const user = await prisma.user.findFirst({
      where: userType === 'admin' 
        ? {
            email: {
              equals: normalizedEmail,
              mode: 'insensitive'
            },
            role: 'admin'
          }
        : userType === 'employee'
          ? {
              email: {
                equals: normalizedEmail,
                mode: 'insensitive'
              }
            }
          : {
              email: {
                equals: normalizedEmail,
                mode: 'insensitive'
              }
            },
      include: {
        ownedTenants: {
          where: { isActive: true },
          select: {
            id: true,
            subdomain: true,
            isActive: true
          }
        },
        tenantUsers: {
          where: { tenant: { isActive: true } },
          include: {
            tenant: {
              select: {
                id: true,
                subdomain: true,
                isActive: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Determine user's tenant
    let tenantId = null
    let tenantSubdomain = null

    if (user.ownedTenants?.length > 0 && user.ownedTenants[0]?.isActive) {
      tenantId = user.ownedTenants[0].id
      tenantSubdomain = user.ownedTenants[0].subdomain
    } else if (user.tenantUsers.length > 0) {
      const activeMembership = user.tenantUsers[0]
      if (activeMembership.tenant.isActive) {
        tenantId = activeMembership.tenant.id
        tenantSubdomain = activeMembership.tenant.subdomain
      }
    }

    // Log successful OTP verification
    try {
      await logActivity({
        userId: user.id,
        tenantId: tenantId || undefined,
        action: 'USER_SIGNIN_OTP',
        details: {
          email: normalizedEmail,
          userType,
          role: user.role,
          method: 'OTP'
        }
      })
    } catch (logError) {
      console.error('Failed to log activity:', logError)
      // Don't fail the request if logging fails
    }

    // Return user data for session
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          tenantId: tenantId?.toString(),
          subdomain: tenantSubdomain,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.role === 'admin'
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ OTP verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const maxDuration = 60
