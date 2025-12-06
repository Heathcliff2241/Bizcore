import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  sendPaymentRejectedEmail,
  sendAdminPaymentVerifiedEmail,
  sendAdminPaymentRejectedEmail,
  sendTenantPaymentApprovedEmail,
} from '@/lib/email/paymentEmails';

/**
 * GET /api/admin/payments
 * List pending payments for verification
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      console.warn('[GET /api/admin/payments] User is not admin');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[GET /api/admin/payments] Fetching all pending payments');

    // Get all payments (we'll filter by pending status in the code)
    const payments = await prisma.payment.findMany({
      include: {
        subscription: {
          select: {
            id: true,
            planId: true,
            pendingUpgradePlanId: true,
            status: true,
            tenant: {
              select: {
                id: true,
                name: true
              }
            }
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[GET /api/admin/payments] Found ${payments.length} total payments`);

    // Filter and map pending payments
    interface PaymentMetadata {
      gcashTransactionId?: string;
      submittedAt?: string;
      verificationStatus?: string;
    }
    const pendingPayments = payments
      .filter((p) => {
        const metadata = p.metadata as PaymentMetadata;
        const isPending = metadata?.verificationStatus === 'pending';
        if (!isPending) {
          console.log(`[GET /api/admin/payments] Payment ${p.id} not pending (status: ${metadata?.verificationStatus})`);
        }
        return isPending;
      })
      .map((p) => {
        const metadata = p.metadata as PaymentMetadata;
        const submittedAt = metadata?.submittedAt ? new Date(metadata.submittedAt) : new Date();
        
        // Map plan IDs to display names
        const planNames: Record<string, string> = {
          'trial': 'Trial',
          'basic': 'BizCore Starter',
          'premium': 'BizCore Premium',
          'enterprise': 'Enterprise'
        };
        
        // Use pending upgrade plan if it exists, otherwise use current plan
        const planIdToShow = p.subscription.pendingUpgradePlanId || p.subscription.planId;
        
        return {
          id: String(p.id),
          subscriptionId: String(p.subscriptionId),
          planName: planNames[planIdToShow] || planIdToShow,
          amount: p.amount,
          currency: p.currency,
          gcashTransactionId: metadata?.gcashTransactionId,
          submittedAt: metadata?.submittedAt,
          expiresAt: new Date(submittedAt.getTime() + 24 * 60 * 60 * 1000),
          status: p.status,
        };
      });

    console.log(`[GET /api/admin/payments] Returning ${pendingPayments.length} pending payments`);

    return NextResponse.json(pendingPayments);
  } catch (error) {
    console.error('[GET /api/admin/payments] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/payments
 * Admin verifies or rejects a payment
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, action, adminNotes } = body;

    if (!paymentId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId, action' },
        { status: 400 }
      );
    }

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "verify" or "reject"' },
        { status: 400 }
      );
    }

    // Convert paymentId to integer
    const paymentIdInt = parseInt(paymentId, 10);
    if (isNaN(paymentIdInt)) {
      return NextResponse.json(
        { error: 'Invalid paymentId. Must be a valid number' },
        { status: 400 }
      );
    }

    // Get payment with subscription details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentIdInt },
      include: {
        subscription: {
          select: { 
            id: true,
            tenantId: true, 
            status: true, 
            planId: true,
            pendingUpgradePlanId: true,
            tenant: {
              select: { id: true, name: true }
            }
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (!payment.subscription) {
      return NextResponse.json(
        { error: 'Payment has no associated subscription' },
        { status: 400 }
      );
    }

    // Update payment based on action
    if (action === 'verify') {
      interface PaymentMetadata {
        gcashTransactionId?: string;
        submittedAt?: string;
        verificationStatus?: string;
        verifiedAt?: string;
        adminNotes?: string | null;
      }
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentIdInt },
        data: {
          status: 'paid',
          metadata: {
            ...(payment.metadata as PaymentMetadata),
            verificationStatus: 'verified',
            verifiedAt: new Date().toISOString(),
            adminNotes: adminNotes || null,
          },
        },
      });

      // Update subscription: apply pending upgrade plan and mark as active
      // Get the new plan to determine billing cycle
      let billingCycle = 'monthly'; // default
      if (payment.subscription.pendingUpgradePlanId) {
        const newPlan = await prisma.plan.findUnique({
          where: { id: payment.subscription.pendingUpgradePlanId },
          select: { billingCycle: true },
        });
        if (newPlan?.billingCycle) {
          billingCycle = newPlan.billingCycle;
        }
      }

      const subscriptionUpdate: Record<string, unknown> = {
        status: 'active',
        pendingUpgradePlanId: null,
      };

      // If there's a pending upgrade plan, apply it and reset billing cycle
      if (payment.subscription.pendingUpgradePlanId) {
        subscriptionUpdate.planId = payment.subscription.pendingUpgradePlanId;
        subscriptionUpdate.planChangedAt = new Date();
        
        // Reset billing cycle to start fresh after upgrade
        const cycleStart = new Date();
        if (billingCycle === 'annual') {
          subscriptionUpdate.currentPeriodStart = cycleStart;
          subscriptionUpdate.currentPeriodEnd = new Date(cycleStart.getTime() + 365 * 24 * 60 * 60 * 1000);
          subscriptionUpdate.renewalDate = new Date(cycleStart.getTime() + 365 * 24 * 60 * 60 * 1000);
          subscriptionUpdate.nextPaymentDate = new Date(cycleStart.getTime() + 365 * 24 * 60 * 60 * 1000);
        } else {
          subscriptionUpdate.currentPeriodStart = cycleStart;
          subscriptionUpdate.currentPeriodEnd = new Date(cycleStart.getTime() + 30 * 24 * 60 * 60 * 1000);
          subscriptionUpdate.renewalDate = new Date(cycleStart.getTime() + 30 * 24 * 60 * 60 * 1000);
          subscriptionUpdate.nextPaymentDate = new Date(cycleStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
      } else {
        // No upgrade, just mark as active and set next payment date
        subscriptionUpdate.nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      const updatedSubscription = await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: subscriptionUpdate,
        include: { tenant: true },
      });

      // Send verification email to tenant and admin notification
      try {
        const subscriber = await prisma.user.findFirst({
          where: { tenantUsers: { some: { tenantId: updatedSubscription.tenantId } } },
          select: { email: true, firstName: true, lastName: true },
        });

        if (subscriber?.email) {
          const recipientName = `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim() || 'Customer';
          // Use the updated planId (which could be the pending upgrade plan)
          const planName = updatedSubscription.planId?.charAt(0).toUpperCase() + updatedSubscription.planId?.slice(1) || 'Premium';
          try {
            await sendTenantPaymentApprovedEmail(
              subscriber.email,
              recipientName,
              updatedSubscription.tenant.name,
              planName,
              payment.amount,
              payment.currency || 'PHP'
            );
          } catch (sendError) {
            console.error('[PUT /api/admin/payments] sendTenantPaymentApprovedEmail error:', sendError);
          }
        }

        // Send admin notification email
        const planName = updatedSubscription.planId?.charAt(0).toUpperCase() + updatedSubscription.planId?.slice(1) || 'Premium';
        try {
          await sendAdminPaymentVerifiedEmail(
            updatedSubscription.tenant.name,
            planName,
            payment.amount,
            payment.currency || 'PHP',
            adminNotes || 'Payment verified'
          );
        } catch (sendError) {
          console.error('[PUT /api/admin/payments] sendAdminPaymentVerifiedEmail error:', sendError);
        }
      } catch (emailError) {
        console.error('[PUT /api/admin/payments] Email processing error:', emailError);
        // Log but don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        message: `Payment verified and subscription activated`,
        payment: updatedPayment,
      });
    } else if (action === 'reject') {
      interface PaymentMetadata {
        gcashTransactionId?: string;
        submittedAt?: string;
        verificationStatus?: string;
        rejectedAt?: string;
        adminNotes?: string;
      }
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentIdInt },
        data: {
          status: 'unpaid', // Payment was rejected, so it remains unpaid
          failureReason: adminNotes || 'Payment rejected by admin',
          metadata: {
            ...(payment.metadata as PaymentMetadata),
            verificationStatus: 'rejected',
            rejectedAt: new Date().toISOString(),
            adminNotes: adminNotes || 'Payment rejected by admin',
          },
        },
      });

      // Get subscription for tenant info
      const subscription = await prisma.subscription.findUnique({
        where: { id: payment.subscriptionId },
        include: { tenant: true },
      });

      // Send rejection email to tenant and admin notification
      try {
        if (subscription) {
          const subscriber = await prisma.user.findFirst({
            where: { tenantUsers: { some: { tenantId: subscription.tenantId } } },
            select: { email: true, firstName: true, lastName: true },
          });

          if (subscriber?.email) {
            const recipientName = `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim() || 'Customer';
            const rejectionReason = adminNotes || 'Payment rejected by admin';
            try {
              await sendPaymentRejectedEmail(
                subscriber.email,
                recipientName,
                subscription.tenant.name,
                rejectionReason,
                payment.amount,
                payment.currency || 'PHP'
              );
            } catch (sendError) {
              console.error('[PUT /api/admin/payments] sendPaymentRejectedEmail error:', sendError);
            }
          }

          // Send admin notification email
          const planName = subscription.planId?.toUpperCase() || 'Premium';
          try {
            await sendAdminPaymentRejectedEmail(
              subscription.tenant.name,
              planName,
              payment.amount,
              payment.currency || 'PHP',
              adminNotes || 'Payment rejected by admin'
            );
          } catch (sendError) {
            console.error('[PUT /api/admin/payments] sendAdminPaymentRejectedEmail error:', sendError);
          }
        }
      } catch (emailError) {
        console.error('[PUT /api/admin/payments] Email processing error:', emailError);
        // Log but don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Payment rejected',
        payment: updatedPayment,
      });
    }
  } catch (error) {
    console.error('[PUT /api/admin/payments] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
