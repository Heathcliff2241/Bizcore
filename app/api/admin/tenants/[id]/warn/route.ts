import { prisma } from '@/lib/prisma'
import { logTenantActivity } from '@/lib/activityLogger'
import { sendTenantWarningEmail } from '@/lib/email/tenantEmails'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    const tenantId = parseInt(id)

    if (isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { reason, message } = body

    if (!reason || !message) {
      return NextResponse.json(
        { error: 'Reason and message are required' },
        { status: 400 }
      )
    }

    // Get tenant with owner email
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        owner: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    if (!tenant.owner?.email) {
      return NextResponse.json(
        { error: 'Tenant owner email not found' },
        { status: 400 }
      )
    }

    // Send warning email
    await sendTenantWarningEmail(
      tenant.owner.email,
      tenant.name,
      reason,
      message
    )

    // Log the activity
    await logTenantActivity(
      tenantId,
      'TENANT_WARNING_SENT',
      undefined,
      {
        tenantName: tenant.name,
        reason,
        sentTo: tenant.owner.email,
        sentAt: new Date().toISOString()
      }
    )

    return NextResponse.json({
      success: true,
      message: `Warning email sent to ${tenant.owner.email}`
    })
  } catch (error) {
    console.error('Error sending tenant warning:', error)
    return NextResponse.json(
      { error: 'Failed to send warning email' },
      { status: 500 }
    )
  }
}
