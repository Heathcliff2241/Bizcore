/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  sendTenantPaymentApprovedEmail,
  sendAdminPaymentVerifiedEmail,
  sendPaymentRejectedEmail,
  sendAdminPaymentRejectedEmail,
} from '@/lib/email/paymentEmails';

/**
 * GET /api/admin/upgrade-requests
 * List all pending upgrade requests for admin review
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'payment_submitted';

    const upgradeRequests = await prisma.planUpgradeRequest.findMany({
      where: {
        status: status === 'all' ? undefined : (status as any),
      },
      include: {
        tenant: true,
      },
      orderBy: { paymentSubmittedAt: 'desc' },
    });

    const formatted = upgradeRequests.map((req) => ({
      id: req.id,
      tenantId: req.tenantId,
      tenantName: req.tenant.name,
      currentPlan: req.currentPlan,
      newPlan: req.newPlan,
      amountDue: req.amountDue,
      status: req.status,
      requestedAt: req.requestedAt,
      paymentSubmittedAt: req.paymentSubmittedAt,
      approvedAt: req.approvedAt,
      appliedAt: req.appliedAt,
      expiresAt: req.expiresAt,
    }));

    return NextResponse.json({
      success: true,
      upgradeRequests: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('[GET /api/admin/upgrade-requests]', error);
    return NextResponse.json(
      { error: 'Failed to fetch upgrade requests' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/upgrade-requests/{id}/approve
 * Admin approves an upgrade request and applies the plan upgrade
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const upgradeRequestId = parseInt(id, 10);
    if (isNaN(upgradeRequestId)) {
      return NextResponse.json(
        { error: 'Invalid upgrade request ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, approvalNotes } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Fetch upgrade request
    const upgradeRequest = await prisma.planUpgradeRequest.findUnique({
      where: { id: upgradeRequestId },
      include: { tenant: true, subscription: true, payment: true },
    });

    if (!upgradeRequest) {
      return NextResponse.json(
        { error: 'Upgrade request not found' },
        { status: 404 }
      );
    }

    // Verify status is payment_submitted
    if (upgradeRequest.status !== 'payment_submitted') {
      return NextResponse.json(
        { error: `Can only process payment_submitted requests, current status: ${upgradeRequest.status}` },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      console.log('[PUT /api/admin/upgrade-requests/{id}/approve] APPROVING:', {
        upgradeRequestId,
        tenantId: upgradeRequest.tenantId,
        currentPlan: upgradeRequest.currentPlan,
        newPlan: upgradeRequest.newPlan,
      });

      // Mark payment as verified
      if (upgradeRequest.payment) {
        await prisma.payment.update({
          where: { id: upgradeRequest.payment.id },
          data: {
            status: 'paid',
            verifiedAt: new Date(),
            metadata: {
              ...(upgradeRequest.payment.metadata as any),
              verificationStatus: 'verified',
              verifiedAt: new Date().toISOString(),
              adminNotes: approvalNotes || null,
            },
          },
        });
      }

      // Resolve the plan record: first try to treat upgradeRequest.newPlan as id
      // and fall back to a name lookup if it does not resolve. This makes the
      // endpoint robust against requests created with plan names (legacy/test data).
      let planRecord = await prisma.plan.findUnique({
        where: { id: upgradeRequest.newPlan },
      });

      if (!planRecord) {
        planRecord = await prisma.plan.findFirst({
          where: { name: upgradeRequest.newPlan },
        });
        if (planRecord) {
          console.warn('[PUT /api/admin/upgrade-requests/{id}/approve] Resolved plan by name fallback', {
            requestedValue: upgradeRequest.newPlan,
            resolvedPlanId: planRecord.id,
          });
        }
      }

      // If planRecord still not found, log and return error; we cannot apply an invalid plan.
      if (!planRecord) {
        console.error('[PUT /api/admin/upgrade-requests/{id}/approve] Plan resolution failed for:', upgradeRequest.newPlan);
        return NextResponse.json({ error: 'Unknown plan requested' }, { status: 404 });
      }

      const newPlan = planRecord;
      const newPlanIdResolved = planRecord.id;
      let billingCycle = 'monthly';
      if (planRecord.billingCycle && planRecord.billingCycle !== 'trial') {
        billingCycle = planRecord.billingCycle;
      }

      // Apply plan upgrade to subscription
      const cycleStart = new Date();
      let cycleEnd;
      if (billingCycle === 'annual') {
        cycleEnd = new Date(cycleStart.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else {
        cycleEnd = new Date(cycleStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      const updatedSubscription = await prisma.subscription.update({
        where: { id: upgradeRequest.subscription.id },
        data: {
          planId: newPlanIdResolved,
          billingCycle: billingCycle as any,
          currentPeriodStart: cycleStart,
          currentPeriodEnd: cycleEnd,
          renewalDate: cycleEnd,
          nextPaymentDate: cycleEnd,
          status: 'active',
          planChangedAt: new Date(),
          pendingUpgradePlanId: null, // Clear old field
          upgradePendingAt: null,
        },
      });

      console.log('[PUT /api/admin/upgrade-requests/{id}/approve] ✅ Subscription updated:', {
        subscriptionId: updatedSubscription.id,
        newPlanId: updatedSubscription.planId,
        billingCycle: updatedSubscription.billingCycle,
      });

      // Update upgrade request
      const approvedRequest = await prisma.planUpgradeRequest.update({
        where: { id: upgradeRequestId },
        data: {
          status: 'applied',
          approvedAt: new Date(),
          appliedAt: new Date(),
          approvedBy: parseInt(session.user.id || '0', 10),
          approvalNotes: approvalNotes || null,
        },
        include: { subscription: true },
      });

      // Also update tenant.subscriptionPlan to reflect the applied plan
      try {
        const tenantPlanVal = newPlanIdResolved === 'trial' ? 'free' : (['free', 'basic', 'premium', 'enterprise'].includes(newPlanIdResolved) ? newPlanIdResolved : 'free');
        await prisma.tenant.update({ where: { id: upgradeRequest.tenantId }, data: { subscriptionPlan: tenantPlanVal as any } });
      } catch (tenantErr) {
        console.error('[PUT /api/admin/upgrade-requests/{id}/approve] Failed to update Tenant.subscriptionPlan:', tenantErr);
      }

      // Send confirmation emails
      try {
        const tenantOwner = await prisma.user.findFirst({
          where: { ownedTenants: { some: { id: upgradeRequest.tenantId } } },
          select: { email: true, firstName: true, lastName: true },
        });

        if (tenantOwner?.email && newPlan?.name) {
          const recipientName = `${tenantOwner.firstName || ''} ${tenantOwner.lastName || ''}`.trim() || 'Customer';
          await sendTenantPaymentApprovedEmail(
            tenantOwner.email,
            recipientName,
            upgradeRequest.tenant.name,
            newPlan.name,
            upgradeRequest.amountDue / 100,
            'PHP'
          );
        }

        // Admin notification
        const planName = newPlan?.name || upgradeRequest.newPlan.toUpperCase();
        await sendAdminPaymentVerifiedEmail(
          upgradeRequest.tenant.name,
          planName,
          upgradeRequest.amountDue / 100,
          'PHP',
          approvalNotes || 'Plan upgrade approved and applied'
        );
      } catch (emailError) {
        console.error('[PUT /api/admin/upgrade-requests/{id}/approve] Email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        upgradeRequest: approvedRequest,
        subscription: updatedSubscription,
        message: 'Plan upgrade approved and applied successfully',
      });
    } else if (action === 'reject') {
      console.log('[PUT /api/admin/upgrade-requests/{id}/reject] REJECTING:', {
        upgradeRequestId,
      });

      // Mark payment as failed
      if (upgradeRequest.payment) {
        await prisma.payment.update({
          where: { id: upgradeRequest.payment.id },
          data: {
            status: 'unpaid',
            failureReason: approvalNotes || 'Payment rejected by admin',
            metadata: {
              ...(upgradeRequest.payment.metadata as any),
              verificationStatus: 'rejected',
              rejectedAt: new Date().toISOString(),
              adminNotes: approvalNotes || 'Payment rejected by admin',
            },
          },
        });
      }

      // Update upgrade request
      const rejectedRequest = await prisma.planUpgradeRequest.update({
        where: { id: upgradeRequestId },
        data: {
          status: 'cancelled',
          approvedAt: new Date(),
          approvedBy: parseInt(session.user.id || '0', 10),
          approvalNotes: approvalNotes || null,
          paymentId: null, // Disassociate payment
        },
        include: { tenant: true },
      });

      // Send rejection emails
      try {
        const tenantOwner = await prisma.user.findFirst({
          where: { ownedTenants: { some: { id: upgradeRequest.tenantId } } },
          select: { email: true, firstName: true, lastName: true },
        });

        if (tenantOwner?.email) {
          const recipientName = `${tenantOwner.firstName || ''} ${tenantOwner.lastName || ''}`.trim() || 'Customer';
          await sendPaymentRejectedEmail(
            tenantOwner.email,
            recipientName,
            upgradeRequest.tenant.name,
            approvalNotes || 'Payment rejected by admin',
            upgradeRequest.amountDue / 100,
            'PHP'
          );
        }

        // Admin notification
        await sendAdminPaymentRejectedEmail(
          upgradeRequest.tenant.name,
          upgradeRequest.newPlan.toUpperCase(),
          upgradeRequest.amountDue / 100,
          'PHP',
          approvalNotes || 'Payment rejected by admin'
        );
      } catch (emailError) {
        console.error('[PUT /api/admin/upgrade-requests/{id}/reject] Email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        upgradeRequest: rejectedRequest,
        message: 'Plan upgrade rejected',
      });
    }
  } catch (error) {
    console.error('[PUT /api/admin/upgrade-requests/{id}]', error);
    return NextResponse.json(
      { error: 'Failed to process upgrade request' },
      { status: 500 }
    );
  }
}
