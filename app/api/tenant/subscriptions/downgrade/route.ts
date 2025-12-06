import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateProration } from '@/lib/proration';

/**
 * POST /api/tenant/subscriptions/downgrade
 * Downgrade subscription to a lower-tier plan with proration/credit
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

    const { newPlanId, effectiveDate } = await request.json();

    if (!newPlanId) {
      return NextResponse.json(
        { error: 'Missing required field: newPlanId' },
        { status: 400 }
      );
    }

    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: parseInt(session.user.tenantId, 10) }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Validate new plan exists and is lower tier
    const planTiers = { trial: 0, basic: 1, premium: 2, enterprise: 3 };
    const currentTier = planTiers[subscription.planId as keyof typeof planTiers] || 0;
    const newTier = planTiers[newPlanId as keyof typeof planTiers] || 0;

    if (newTier >= currentTier) {
      return NextResponse.json(
        { error: 'Can only downgrade to lower-tier plans. Use upgrade for higher tiers.' },
        { status: 400 }
      );
    }

    // Get pricing for proration
    const planPrices: Record<string, number> = {
      trial: 0,
      basic: 1999,
      premium: 19999,
      enterprise: 0
    };

    const currentPrice = planPrices[subscription.planId] || 0;
    const newPrice = planPrices[newPlanId] || 0;

    // Calculate proration (credit available for downgrade)
    const proration = calculateProration(
      currentPrice,
      newPrice,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd
    );

    // Create credit invoice (negative amount) if credit available
    let invoice = null;
    if (proration.creditApplied > 0) {
      invoice = await prisma.invoice.create({
        data: {
          subscriptionId: subscription.id,
          invoiceNumber: `CRD-${Date.now()}`,
          status: 'issued',
          subtotal: -proration.creditApplied,
          tax: 0,
          discount: 0,
          total: -proration.creditApplied,
          issuedAt: new Date(),
          dueDate: new Date(),
          lineItems: [
            {
              description: `Downgrade from ${subscription.planId} to ${newPlanId} (${proration.currentCycleDays} days)`,
              quantity: 1,
              unitPrice: -proration.creditApplied,
              total: -proration.creditApplied
            }
          ]
        }
      });
    }

    // Set effective date for downgrade (end of current period by default)
    const downgradeEffectiveDate = effectiveDate
      ? new Date(effectiveDate)
      : subscription.currentPeriodEnd;

    // Mark subscription as pending downgrade if effective date is in future
    const isImmediateDowngrade = downgradeEffectiveDate.getTime() <= Date.now();

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        // Only update if immediate, otherwise set pending flag
        ...(isImmediateDowngrade && { planId: newPlanId }),
        // Store pending downgrade info if scheduled for future
        ...(!isImmediateDowngrade && {
          pendingUpgradePlanId: newPlanId // Reusing field to store pending downgrade
        }),
        status: 'active'
      }
    });

    return NextResponse.json(
      {
        success: true,
        subscription: updatedSubscription,
        proration,
        invoice,
        effectiveDate: downgradeEffectiveDate,
        isImmediate: isImmediateDowngrade,
        message: `Downgrade scheduled${isImmediateDowngrade ? ' immediately' : ` for ${downgradeEffectiveDate.toLocaleDateString()}`}`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Downgrade subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to downgrade subscription' },
      { status: 500 }
    );
  }
}
