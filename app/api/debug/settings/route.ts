import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)
  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  }

  try {
    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id }
    })

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenantData?.id,
        name: tenantData?.name,
        subdomain: tenantData?.subdomain,
        settings: tenantData?.settings,
        rawSettingsType: typeof tenantData?.settings,
        rawSettingsJson: JSON.stringify(tenantData?.settings, null, 2)
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 })
  }
}
