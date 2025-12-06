import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateCancellationRefund } from '@/lib/proration';

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
