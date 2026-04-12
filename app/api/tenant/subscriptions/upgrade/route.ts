/* eslint-disable @typescript-eslint/no-explicit-any */
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
    // CRITICAL: Fetch prices from Plan table, don't use hardcoded values
    const currentPlan = await prisma.plan.findUnique({
      where: { id: subscription.planId },
      select: { price: true },
    });

    const newPlan = await prisma.plan.findUnique({
      where: { id: newPlanId },
      select: { price: true },
    });

    const currentPrice = currentPlan?.price || 0;
    const newPrice = newPlan?.price || 0;

    console.log('[POST /api/tenant/subscriptions/upgrade] PLAN PRICES FROM DATABASE:', {
      currentPlanId: subscription.planId,
      currentPlanName: currentPlan ? 'Found' : 'NOT FOUND',
      currentPrice,
      newPlanId,
      newPlanName: newPlan ? 'Found' : 'NOT FOUND',
      newPrice,
    });

    // For trial plan upgrades, don't prorate - charge full plan price
    // Trial users should pay the full monthly/yearly price, not a prorated amount
    let proration;
    let amountDue;
    
    if (subscription.planId === 'trial' && newPrice > 0) {
      // Trial upgrade: charge full plan price
      amountDue = newPrice;
      proration = {
        currentCycleDays: 30,
        totalCycleDays: 30,
        dailyRate: newPrice / 30,
        remainingBalance: amountDue,
        newPlanDailyRate: newPrice / 30,
        creditApplied: 0,
        amountDue: amountDue,
        description: `You'll be charged ₱${amountDue.toFixed(2)} for your new ${newPlanId} plan`
      };
      
      console.log('[POST /api/tenant/subscriptions/upgrade] TRIAL UPGRADE - FULL PRICE (not prorated):', {
        currentPrice,
        newPrice,
        amountDue: amountDue,
      });
    } else {
      // Regular plan upgrade: use proration
      proration = calculateProration(
        currentPrice,
        newPrice,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd
      );
      amountDue = proration.amountDue;

      console.log('[POST /api/tenant/subscriptions/upgrade] REGULAR UPGRADE - PRORATED:', {
        currentPrice,
        newPrice,
        amountDue: proration.amountDue,
        currentCycleDays: proration.currentCycleDays,
        totalCycleDays: proration.totalCycleDays,
      });
    }

    // If amount is due, validate payment method provided
    if (amountDue > 0 && !paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method required for upgrade charge', proration },
        { status: 400 }
      );
    }

    // Create invoice for proration if amount due
    let invoice = null;
    if (amountDue > 0) {
      invoice = await prisma.invoice.create({
        data: {
          subscriptionId: subscription.id,
          invoiceNumber: `INV-${Date.now()}`,
          status: 'issued',
          subtotal: amountDue,
          tax: 0,
          discount: 0,
          total: amountDue,
          issuedAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          lineItems: [
            {
              description: `Upgrade from ${subscription.planId} to ${newPlanId} (${proration.currentCycleDays} days)`,
              quantity: 1,
              unitPrice: amountDue,
              total: amountDue
            }
          ]
        }
      });
    }

    // If payment is needed, mark plan as pending upgrade instead of applying immediately
    if (amountDue > 0) {
      // Set pending upgrade plan - will be applied after payment is verified
      console.log('[POST /api/tenant/subscriptions/upgrade] SETTING PENDING UPGRADE:', {
        subscriptionId: subscription.id,
        newPlanId,
        amountDue: proration.amountDue,
      });
      
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          pendingUpgradePlanId: newPlanId,
          upgradePendingAt: new Date(),
        }
      });

      console.log('[POST /api/tenant/subscriptions/upgrade] AFTER SETTING PENDING:', {
        subscriptionId: updatedSubscription.id,
        pendingUpgradePlanId: updatedSubscription.pendingUpgradePlanId,
        upgradePendingAt: updatedSubscription.upgradePendingAt,
      });

      console.log('[POST /api/tenant/subscriptions/upgrade] ✅ Upgrade marked as PENDING - will require payment:', {
        subscriptionId: subscription.id,
        currentPlan: subscription.planId,
        pendingPlan: newPlanId,
        amountDue: proration.amountDue,
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
      // IMPORTANT: Only use 'monthly' or 'annual' for billing cycle, never 'trial'
      let billingCycle = 'monthly'; // default
      const newPlanRecord = await prisma.plan.findUnique({
        where: { id: newPlanId },
        select: { billingCycle: true },
      });
      // Only use the plan's billingCycle if it's valid (not 'trial' for paid plans)
      if (newPlanRecord?.billingCycle && newPlanRecord.billingCycle !== 'trial') {
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
          pendingUpgradePlanId: null, // Clear any pending upgrade
          billingCycle: billingCycle as any,
          currentPeriodStart: cycleStart,
          currentPeriodEnd: cycleEnd,
          renewalDate: cycleEnd,
          nextPaymentDate: cycleEnd,
          status: 'active'
        }
      });

      console.log('[POST /api/tenant/subscriptions/upgrade] ✅ Upgrade applied immediately (no payment needed):', {
        subscriptionId: subscription.id,
        planId: newPlanId,
        billingCycle,
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
