import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateProration } from '@/lib/proration';

/**
 * POST /api/tenant/subscriptions/upgrade
 * Upgrade subscription to a higher-tier plan with proration
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

    const { newPlanId, paymentMethodId } = await request.json();

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

    // Validate new plan exists and is higher tier
    const planTiers = { trial: 0, basic: 1, premium: 2, enterprise: 3 };
    const currentTier = planTiers[subscription.planId as keyof typeof planTiers] || 0;
    const newTier = planTiers[newPlanId as keyof typeof planTiers] || 0;

    if (newTier <= currentTier) {
      return NextResponse.json(
        { error: 'Can only upgrade to higher-tier plans. Use downgrade for lower tiers.' },
        { status: 400 }
      );
    }

    // Get pricing for proration
    const planPrices: Record<string, number> = {
      trial: 0,
      basic: 1999,
      premium: 19999,
      enterprise: 0 // Custom pricing
    };

    const currentPrice = planPrices[subscription.planId] || 0;
    const newPrice = planPrices[newPlanId] || 0;

    // Calculate proration
    const proration = calculateProration(
      currentPrice,
      newPrice,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd
    );

    // If amount is due, validate payment method provided
    if (proration.amountDue > 0 && !paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method required for upgrade charge', proration },
        { status: 400 }
      );
    }

    // Create invoice for proration if amount due
    let invoice = null;
    if (proration.amountDue > 0) {
      invoice = await prisma.invoice.create({
        data: {
          subscriptionId: subscription.id,
          invoiceNumber: `INV-${Date.now()}`,
          status: 'issued',
          subtotal: proration.amountDue,
          tax: 0,
          discount: 0,
          total: proration.amountDue,
          issuedAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          lineItems: [
            {
              description: `Upgrade from ${subscription.planId} to ${newPlanId} (${proration.currentCycleDays} days)`,
              quantity: 1,
              unitPrice: proration.amountDue,
              total: proration.amountDue
            }
          ]
        }
      });
    }

    // If payment is needed, mark plan as pending upgrade instead of applying immediately
    if (proration.amountDue > 0) {
      // Set pending upgrade plan - will be applied after payment is verified
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          pendingUpgradePlanId: newPlanId,
          upgradePendingAt: new Date(),
        }
      });

      return NextResponse.json(
        {
          success: true,
          subscription: updatedSubscription,
          proration,
          invoice,
          message: `Upgrade pending payment verification. Plan will be activated after GCash payment is verified.`
        },
        { status: 200 }
      );
    } else {
      // No payment needed - apply plan immediately
      // Get new plan to determine billing cycle
      let billingCycle = 'monthly'; // default
      const newPlanRecord = await prisma.plan.findUnique({
        where: { id: newPlanId },
        select: { billingCycle: true },
      });
      if (newPlanRecord?.billingCycle) {
        billingCycle = newPlanRecord.billingCycle;
      }

      const cycleStart = new Date();
      let cycleEnd;
      if (billingCycle === 'annual') {
        cycleEnd = new Date(cycleStart.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else {
        cycleEnd = new Date(cycleStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: newPlanId,
          currentPeriodStart: cycleStart,
          currentPeriodEnd: cycleEnd,
          renewalDate: cycleEnd,
          nextPaymentDate: cycleEnd,
          status: 'active'
        }
      });

      return NextResponse.json(
        {
          success: true,
          subscription: updatedSubscription,
          proration,
          invoice,
          message: `Successfully upgraded to ${newPlanId} plan`
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
