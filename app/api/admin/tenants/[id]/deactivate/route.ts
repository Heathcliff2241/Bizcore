import { prisma } from '@/lib/prisma'
import { logTenantActivity } from '@/lib/activityLogger'
import { sendTenantDeactivationEmail } from '@/lib/email/tenantEmails'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

/**
 * POST /api/admin/tenants/[id]/deactivate
 * Deactivates a tenant (soft delete) - preserves all data
 */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const tenantId = parseInt(id)

    if (isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      )
    }

    // Get tenant with owner email before deactivating
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

    if (!tenant.isActive) {
      return NextResponse.json(
        { error: 'Tenant is already deactivated' },
        { status: 400 }
      )
    }

    // Soft delete - deactivate the tenant but preserve all data
    const deactivated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false }
    })

    // Send deactivation email to tenant owner
    if (tenant.owner?.email) {
      try {
        await sendTenantDeactivationEmail(
          tenant.owner.email,
          tenant.owner.email.split('@')[0],
          deactivated.name
        )
      } catch (emailError) {
        console.error('Failed to send deactivation email:', emailError)
        // Don't fail the deactivation if email fails
      }
    }

    // Log the activity
    await logTenantActivity(
      tenantId,
      'TENANT_DEACTIVATED',
      undefined,
      {
        tenantName: deactivated.name,
        deactivatedAt: new Date().toISOString(),
        emailSent: !!tenant.owner?.email
      }
    )

    return NextResponse.json({
      success: true,
      message: `Tenant "${tenant.name}" has been deactivated. Data is preserved.`,
      deactivatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deactivating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate tenant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
