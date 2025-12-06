import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PLAN_PRICING = {
  free: 0,
  trial: 0,
  basic: 1999,
  premium: 19999,
  enterprise: 0, // Custom
}

const PLAN_BILLING_CYCLE = {
  free: 'trial' as const,
  trial: 'trial' as const,
  basic: 'monthly' as const,
  premium: 'annual' as const,
  enterprise: 'monthly' as const,
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      console.warn('[GET /api/admin/subscriptions] No session or user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      console.warn(`[GET /api/admin/subscriptions] User role is not admin: ${session.user.role}`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all subscriptions with tenant data
    const subscriptions = await prisma.subscription.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
            owner: {
              select: {
                lastLogin: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    // Map to subscription format
    const formattedSubscriptions = subscriptions.map((subscription) => {
      const plan = subscription.planId || 'trial'
      const price = PLAN_PRICING[plan as keyof typeof PLAN_PRICING] || 0
      const billingCycle = PLAN_BILLING_CYCLE[plan as keyof typeof PLAN_BILLING_CYCLE] || 'monthly'
      
      // Determine status
      let status: 'active' | 'trial' | 'cancelled' | 'expired' = subscription.status as 'active' | 'trial' | 'cancelled' | 'expired'
      if (!subscription.tenant.isActive) {
        status = 'cancelled'
      } else if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date()) {
        status = 'expired'
      }

      // Calculate days remaining
      let daysRemaining = undefined
      if (subscription.currentPeriodEnd) {
        daysRemaining = Math.max(0, Math.floor((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      }

      return {
        id: subscription.id.toString(),
        tenantId: subscription.tenant.id.toString(),
        tenantName: subscription.tenant.name,
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        price,
        billingCycle,
        status,
        startDate: subscription.currentPeriodStart,
        renewalDate: subscription.renewalDate || subscription.currentPeriodEnd,
        createdAt: subscription.createdAt,
        lastLogin: subscription.tenant.owner?.lastLogin,
        daysRemaining,
      }
    })

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      total: formattedSubscriptions.length,
      active: formattedSubscriptions.filter((s) => s.status === 'active').length,
      trial: formattedSubscriptions.filter((s) => s.status === 'trial').length,
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}
