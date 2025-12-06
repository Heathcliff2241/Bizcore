import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ subdomain: string }>
}

// GET /api/tenants/by-subdomain/[subdomain] - Get tenant by subdomain
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { subdomain } = await params
    
    console.log(`[API] Fetching tenant by subdomain: ${subdomain}`)
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('[API] No session found')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        subscriptionPlan: true,
        isActive: true
      }
    })

    if (!tenant) {
      console.log(`[API] Tenant not found for subdomain: ${subdomain}`)
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
    }

    console.log('[API] Returning tenant data:', { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain })
    const responseData = {
      id: Number(tenant.id),
      name: tenant.name,
      subdomain: tenant.subdomain,
      subscriptionPlan: tenant.subscriptionPlan,
      isActive: tenant.isActive
    }
    console.log('[API] Response data being sent:', responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}
