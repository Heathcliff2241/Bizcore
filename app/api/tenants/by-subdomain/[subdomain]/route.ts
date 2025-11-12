import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    subdomain: string
  }
}

// GET /api/tenants/by-subdomain/[subdomain] - Get tenant by subdomain
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        subscriptionPlan: true,
        isActive: true
      }
    })

    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}
