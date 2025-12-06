import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/tenant/subscriptions/cycle-debug
 * Debug endpoint to see actual billing cycle dates (temp for debugging)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: parseInt(session.user.tenantId, 10) },
      select: {
        id: true,
        planId: true,
        billingCycle: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Calculate actual cycle info
    const now = new Date();
    const totalCycleDays = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime()) /
      (1000 * 60 * 60 * 24)
    );
    const daysUsed = Math.ceil(
      (now.getTime() - subscription.currentPeriodStart.getTime()) /
      (1000 * 60 * 60 * 24)
    );
    const remainingDays = Math.max(0, totalCycleDays - daysUsed);

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        billingCycle: subscription.billingCycle,
        status: subscription.status,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
      cycleInfo: {
        periodStart: subscription.currentPeriodStart.toISOString(),
        periodEnd: subscription.currentPeriodEnd.toISOString(),
        totalCycleDays,
        daysUsed,
        remainingDays,
        now: now.toISOString(),
      },
      validation: {
        isMonthlyLike: totalCycleDays >= 28 && totalCycleDays <= 32,
        isAnnualLike: totalCycleDays >= 360 && totalCycleDays <= 370,
        isUnexpected: totalCycleDays < 28 || (totalCycleDays > 32 && totalCycleDays < 360) || totalCycleDays > 370,
      },
      warningMessage: totalCycleDays > 90 && totalCycleDays < 360 ?
        `⚠️ Billing cycle is ${totalCycleDays} days (unusual for monthly). This may cause proration issues.` :
        null
    });
  } catch (error) {
    console.error('Error fetching cycle debug info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    );
  }
}
