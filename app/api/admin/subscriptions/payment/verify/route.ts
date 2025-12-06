import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendTenantPaymentApprovedEmail, sendAdminPaymentVerifiedEmail, sendPaymentRejectedEmail } from '@/lib/email/paymentEmails';

/**
 * POST /api/admin/subscriptions/payment/verify
 * Admin verifies a GCash payment and activates subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, approved, rejectionReason } = body;

    if (!paymentId || approved === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId, approved' },
        { status: 400 }
      );
    }

    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId, 10) },
      include: { subscription: { include: { tenant: true, plan: true } } },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (approved) {
      // Mark payment as paid and verified
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedPayment = await (prisma.payment.update as any)({
        where: { id: parseInt(paymentId, 10) },
        data: {
          status: 'paid',
          metadata: {
            ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
            verificationStatus: 'verified',
            verifiedAt: new Date().toISOString(),
          },
        },
      });

      // Prepare subscription update data
      const subscriptionUpdateData: Record<string, unknown> = {
        status: 'active',
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };

      // If there's a pending upgrade plan, apply it
      if (payment.subscription.pendingUpgradePlanId) {
        subscriptionUpdateData.planId = payment.subscription.pendingUpgradePlanId;
        subscriptionUpdateData.pendingUpgradePlanId = null;
        subscriptionUpdateData.upgradePendingAt = null;

        // Recalculate billing cycle dates for the new plan
        const cycleStart = new Date();
        // Default to monthly, but ideally fetch from plan
        const cycleEnd = new Date(cycleStart.getTime() + 30 * 24 * 60 * 60 * 1000);

        subscriptionUpdateData.currentPeriodStart = cycleStart;
        subscriptionUpdateData.currentPeriodEnd = cycleEnd;
        subscriptionUpdateData.renewalDate = cycleEnd;
      }

      // Update subscription to active
      const updatedSubscription = await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: subscriptionUpdateData,
      });

      // Send verification emails to tenant and admin
      try {
        const subscriber = await prisma.user.findFirst({
          where: { tenantUsers: { some: { tenantId: payment.subscription.tenantId } } },
          select: { email: true, firstName: true, lastName: true },
        });

        if (subscriber) {
          const recipientName = `${subscriber.firstName} ${subscriber.lastName}`.trim() || 'Customer';
          // Get plan name from the relation or from pending plan
          let planName = payment.subscription.plan?.name || 'Premium';

          // If upgrading to a different plan, try to fetch that plan
          if (payment.subscription.pendingUpgradePlanId) {
            const upgradePlan = await prisma.plan.findUnique({
              where: { id: payment.subscription.pendingUpgradePlanId },
              select: { name: true },
            });
            if (upgradePlan) {
              planName = upgradePlan.name;
            }
          }

          // Send email to tenant
          await sendTenantPaymentApprovedEmail(
            subscriber.email || '',
            recipientName,
            payment.subscription.tenant.name,
            planName,
            payment.amount,
            payment.currency || 'PHP'
          );
        }

        // Send admin notification
        const planName = payment.subscription.plan?.name || 'Premium';
        await sendAdminPaymentVerifiedEmail(
          payment.subscription.tenant.name,
          planName,
          payment.amount,
          payment.currency || 'PHP'
        );
      } catch (emailError) {
        console.error('[POST /api/admin/subscriptions/payment/verify] Email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified and subscription activated',
        payment: updatedPayment,
        subscription: updatedSubscription,
      });
    } else {
      // Reject payment
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedPayment = await (prisma.payment.update as any)({
        where: { id: parseInt(paymentId, 10) },
        data: {
          status: 'failed',
          failureReason: rejectionReason,
          metadata: {
            ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
            verificationStatus: 'rejected',
            rejectionReason,
            rejectedAt: new Date().toISOString(),
          },
        },
      });

      // Send rejection email
      try {
        const subscriber = await prisma.user.findFirst({
          where: { tenantUsers: { some: { tenantId: payment.subscription.tenantId } } },
          select: { email: true, firstName: true, lastName: true },
        });

        if (subscriber) {
          const recipientName = `${subscriber.firstName} ${subscriber.lastName}`.trim() || 'Customer';
          await sendPaymentRejectedEmail(
            subscriber.email || '',
            recipientName,
            payment.subscription.tenant.name,
            rejectionReason,
            payment.amount,
            payment.currency || 'PHP'
          );
        }
      } catch (emailError) {
        console.error('[POST /api/admin/subscriptions/payment/verify] Email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment rejected',
        payment: updatedPayment,
      });
    }
  } catch (error) {
    console.error('[POST /api/admin/subscriptions/payment/verify] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
