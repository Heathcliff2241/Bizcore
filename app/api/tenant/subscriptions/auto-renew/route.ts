import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/tenant/subscriptions/auto-renew
 * Toggle auto-renewal status for the current subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized: No tenant context' },
        { status: 401 }
      );
    }

    const { subscriptionId, autoRenew } = await request.json();

    if (subscriptionId === undefined || autoRenew === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, autoRenew' },
        { status: 400 }
      );
    }

    // Verify subscription belongs to the current tenant
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription || subscription.tenantId !== parseInt(session.user.tenantId, 10)) {
      return NextResponse.json(
        { error: 'Subscription not found or access denied' },
        { status: 404 }
      );
    }

    // Update auto-renew status
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { autoRenew: autoRenew }
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        autoRenew: updatedSubscription.autoRenew,
        planId: updatedSubscription.planId,
        currentPeriodStart: updatedSubscription.currentPeriodStart,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd,
        renewalDate: updatedSubscription.renewalDate,
        message: autoRenew ? 'Auto-renewal enabled' : 'Auto-renewal disabled'
      }
    });
  } catch (error) {
    console.error('Auto-renew error:', error);
    return NextResponse.json(
      { error: 'Failed to update auto-renewal status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tenant/subscriptions/auto-renew
 * Get current auto-renewal status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized: No tenant context' },
        { status: 401 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: parseInt(session.user.tenantId, 10) }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      autoRenew: subscription.autoRenew,
      subscriptionId: subscription.id
    });
  } catch (error) {
    console.error('Get auto-renew status error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve auto-renewal status' },
      { status: 500 }
    );
  }
}
