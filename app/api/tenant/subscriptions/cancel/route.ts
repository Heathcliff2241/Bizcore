import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateCancellationRefund } from '@/lib/proration';
import { sendAdminSubscriptionCancelledEmail } from '@/lib/email/paymentEmails';
import { sendTenantCancellationConfirmationEmail } from '@/lib/email/tenantEmails';
import { logActivity } from '@/lib/activityLogger';
import { createSubscriptionCancelledNotification } from '@/lib/notifications';

/**
 * POST /api/tenant/subscriptions/cancel
 * Cancel subscription with immediate refund calculation
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

    const { cancelImmediately = true } = await request.json();

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

    // Calculate refund
    const planPrices: Record<string, number> = {
      trial: 0,
      basic: 1999,
      premium: 19999,
      enterprise: 0
    };

    const currentPrice = planPrices[subscription.planId] || 0;
    const refund = calculateCancellationRefund(
      currentPrice,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd
    );

    // Create refund invoice if applicable
    let refundInvoice = null;
    if (refund.refundAmount > 0) {
      refundInvoice = await prisma.invoice.create({
        data: {
          subscriptionId: subscription.id,
          invoiceNumber: `REF-${Date.now()}`,
          status: 'refunded',
          subtotal: -refund.refundAmount,
          tax: 0,
          discount: 0,
          total: -refund.refundAmount,
          issuedAt: new Date(),
          dueDate: new Date(),
          lineItems: [
            {
              description: `Cancellation refund - ${subscription.planId} plan`,
              quantity: 1,
              unitPrice: -refund.refundAmount,
              total: -refund.refundAmount
            }
          ]
        }
      });
    }

    // Update subscription status
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        currentPeriodEnd: cancelImmediately ? new Date() : subscription.currentPeriodEnd,
        renewalDate: new Date(), // Set to past to prevent renewal
        autoRenew: false
      }
    });

    // Get plan and tenant info for notifications
    const plan = await prisma.plan.findUnique({
      where: { id: subscription.planId },
      select: { name: true },
    });
    const planName = plan?.name || subscription.planId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: subscription.tenantId },
      select: { name: true },
    });
    const tenantName = tenant?.name || 'Unknown Tenant';

    // Create admin notification
    try {
      const notification = await prisma.adminNotification.create({
        data: {
          type: 'subscription_cancelled',
          tenantId: subscription.tenantId,
          title: 'Subscription Cancelled',
          message: `${tenantName} cancelled their ${planName} subscription${refund.refundAmount > 0 ? ` (Refund: ₱${(refund.refundAmount / 100).toFixed(2)})` : ''}`,
          actionUrl: '/admin/subscriptions',
          isRead: false,
        },
      });
      console.log('[POST /api/tenant/subscriptions/cancel] Admin notification created:', notification.id);
    } catch (notificationError) {
      // Log notification error but don't fail the cancellation
      console.error('[POST /api/tenant/subscriptions/cancel] Admin notification error:', notificationError);
    }

    // Create tenant notification (broadcast to all users in tenant)
    try {
      await createSubscriptionCancelledNotification(
        subscription.tenantId,
        planName,
        refund.refundAmount,
        `dashboard/${session.user.subdomain}`
      );
      console.log('[POST /api/tenant/subscriptions/cancel] Tenant notification created');
    } catch (tenantNotificationError) {
      // Log notification error but don't fail the cancellation
      console.error('[POST /api/tenant/subscriptions/cancel] Tenant notification error:', tenantNotificationError);
    }

    // Log the cancellation activity
    try {
      await logActivity({
        userId: parseInt(session.user.id, 10),
        tenantId: subscription.tenantId,
        action: 'SUBSCRIPTION_CANCELLED',
        details: {
          subscriptionId: subscription.id,
          planId: subscription.planId,
          refundAmount: refund.refundAmount,
          cancelImmediately,
          refundInvoiceId: refundInvoice?.id
        }
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('[POST /api/tenant/subscriptions/cancel] Logging error:', logError);
    }

    // Send admin notification email
    try {
      await sendAdminSubscriptionCancelledEmail(
        tenantName,
        planName,
        refund.refundAmount,
        'PHP' // Assuming PHP currency
      );
    } catch (emailError) {
      console.error('[Cancel Subscription] Failed to send admin notification email:', emailError);
      // Don't fail the cancellation if email fails
    }

    // Send tenant confirmation email
    try {
      // Get tenant user email
      const tenantUser = await prisma.user.findFirst({
        where: { tenantUsers: { some: { tenantId: subscription.tenantId } } },
        select: { email: true, firstName: true, lastName: true },
      });

      if (tenantUser?.email) {
        const recipientName = `${tenantUser.firstName || ''} ${tenantUser.lastName || ''}`.trim() || 'Customer';
        const accessEndDate = cancelImmediately ? new Date() : subscription.currentPeriodEnd;
        const gracePeriodEnd = new Date(accessEndDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days grace period

        await sendTenantCancellationConfirmationEmail(
          tenantUser.email,
          recipientName,
          planName,
          refund.refundAmount,
          'PHP',
          accessEndDate,
          gracePeriodEnd
        );
      }
    } catch (emailError) {
      console.error('[Cancel Subscription] Failed to send tenant confirmation email:', emailError);
      // Don't fail the cancellation if email fails
    }

    return NextResponse.json(
      {
        success: true,
        subscription: updatedSubscription,
        refund,
        refundInvoice,
        message: 'Subscription cancelled successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
