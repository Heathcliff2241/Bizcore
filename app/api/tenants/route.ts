import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's ID from the session
    const userId = parseInt(session.user.id, 10)

    // Check if user owns any tenants
    const ownedTenant = await prisma.tenant.findFirst({
      where: {
        ownerId: userId,
        isActive: true
      }
    })

    if (ownedTenant) {
      return NextResponse.json({
        tenant: ownedTenant,
        source: 'owner'
      })
    }

    // Check if user is part of any tenants as a team member
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId: userId
      },
      include: {
        tenant: true
      }
    })

    if (tenantUser?.tenant?.isActive) {
      return NextResponse.json({
        tenant: tenantUser.tenant,
        source: 'member'
      })
    }

    return NextResponse.json(
      { error: 'No active tenant found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
