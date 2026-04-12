/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateProration } from '@/lib/proration';
import { sendUpgradeInitiatedEmail } from '@/lib/email/paymentEmails';

/**
 * POST /api/tenant/subscriptions/upgrade-request
 * Customer initiates a plan upgrade request
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

    const { newPlanId } = await request.json();

    if (!newPlanId) {
      return NextResponse.json(
        { error: 'Missing required field: newPlanId' },
        { status: 400 }
      );
    }

    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: parseInt(session.user.tenantId, 10) },
      include: { tenant: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Check if there's already an active upgrade request
    const existingUpgrade = await prisma.planUpgradeRequest.findUnique({
      where: { tenantId: parseInt(session.user.tenantId, 10) },
    });

    if (existingUpgrade && !['cancelled', 'applied', 'expired'].includes(existingUpgrade.status)) {
      return NextResponse.json(
        { error: 'An upgrade request is already in progress', existingUpgrade },
        { status: 409 }
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
    const currentPlan = await prisma.plan.findUnique({
      where: { id: subscription.planId },
      select: { price: true, name: true },
    });

    const newPlan = await prisma.plan.findUnique({
      where: { id: newPlanId },
      select: { price: true, name: true, billingCycle: true },
    });

    if (!newPlan) {
      return NextResponse.json(
        { error: 'New plan not found' },
        { status: 404 }
      );
    }

    const currentPrice = currentPlan?.price || 0;
    const newPrice = newPlan.price || 0;

    console.log('[POST /api/tenant/subscriptions/upgrade-request]', {
      tenantId: session.user.tenantId,
      currentPlan: subscription.planId,
      newPlan: newPlanId,
      currentPrice,
      newPrice,
    });

    // Calculate proration
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
        description: `You'll be charged ₱${(amountDue / 100).toFixed(2)} for your new ${newPlanId} plan`,
      };

      console.log('[POST /api/tenant/subscriptions/upgrade-request] TRIAL UPGRADE - FULL PRICE');
    } else {
      // Regular plan upgrade: use proration
      proration = calculateProration(
        currentPrice,
        newPrice,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd
      );
      amountDue = proration.amountDue;

      console.log('[POST /api/tenant/subscriptions/upgrade-request] REGULAR UPGRADE - PRORATED');
    }

    // Create PlanUpgradeRequest
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day expiry

    const upgradeRequest = await prisma.planUpgradeRequest.create({
      data: {
        tenantId: parseInt(session.user.tenantId, 10),
        currentPlan: subscription.planId,
        newPlan: newPlanId,
        amountDue,
        prorationDetails: proration as any,
        status: 'pending',
        expiresAt,
      },
      include: {
        tenant: true,
      },
    });

    console.log('[POST /api/tenant/subscriptions/upgrade-request] ✅ Upgrade request created:', {
      upgradeRequestId: upgradeRequest.id,
      status: upgradeRequest.status,
      amountDue,
    });

    // Send email to tenant with upgrade details and payment instructions
    try {
      const tenant = subscription.tenant;
      const tenantOwner = await prisma.user.findFirst({
        where: { ownedTenants: { some: { id: parseInt(session.user.tenantId, 10) } } },
        select: { email: true, firstName: true, lastName: true },
      });

      if (tenantOwner?.email && newPlan.name) {
        await sendUpgradeInitiatedEmail(
          tenantOwner.email,
          `${tenantOwner.firstName || ''} ${tenantOwner.lastName || ''}`.trim() || 'Customer',
          tenant.name,
          subscription.planId,
          newPlan.name,
          amountDue / 100,
          'PHP'
        );
      }
    } catch (emailError) {
      console.error('[POST /api/tenant/subscriptions/upgrade-request] Email error:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      upgradeRequest,
      amountDue,
      proration,
      newPlanName: newPlan.name,
      message: 'Upgrade request created. Please submit payment proof to proceed.',
    });
  } catch (error) {
    console.error('[POST /api/tenant/subscriptions/upgrade-request]', error);
    return NextResponse.json(
      { error: 'Failed to create upgrade request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tenant/subscriptions/upgrade-request
 * Get current upgrade request for tenant
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

    const upgradeRequest = await prisma.planUpgradeRequest.findUnique({
      where: { tenantId: parseInt(session.user.tenantId, 10) },
      include: { payment: true },
    });

    if (!upgradeRequest) {
      return NextResponse.json({
        success: true,
        upgradeRequest: null,
        message: 'No active upgrade request',
      });
    }

    return NextResponse.json({
      success: true,
      upgradeRequest,
    });
  } catch (error) {
    console.error('[GET /api/tenant/subscriptions/upgrade-request]', error);
    return NextResponse.json(
      { error: 'Failed to fetch upgrade request' },
      { status: 500 }
    );
  }
}
