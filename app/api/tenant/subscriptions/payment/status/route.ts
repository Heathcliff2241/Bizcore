import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/tenant/subscriptions/payment/status
 * Check the status of a pending GCash payment
 * Polls to see if payment has been verified by admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('paymentId');
    const subscriptionId = searchParams.get('subscriptionId');

    if (!paymentId || !subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required parameters: paymentId and subscriptionId' },
        { status: 400 }
      );
    }

    // Verify subscription belongs to tenant
    const subscription = await prisma.subscription.findUnique({
      where: { id: parseInt(subscriptionId, 10) },
      select: { tenantId: true },
    });

    if (!subscription || subscription.tenantId !== parseInt(session.user.tenantId, 10)) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Get payment record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payment = (await prisma.payment.findUnique({
      where: { id: parseInt(paymentId, 10) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any;

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if payment has expired using metadata
    const now = new Date();
    const expiresAtTime = payment.metadata?.expiresAt ? new Date(payment.metadata.expiresAt as string) : null;
    const isExpired = expiresAtTime && expiresAtTime < now;

    // Update associated invoice status if payment status has changed
    if (isExpired || payment.status === 'rejected' || payment.status === 'failed') {
      await prisma.invoice.updateMany({
        where: { paymentId: payment.id },
        data: { 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: (isExpired ? 'cancelled' : 'failed') as any
        }
      });
    } else if (payment.status === 'paid') {
      await prisma.invoice.updateMany({
        where: { paymentId: payment.id },
        data: { 
          status: 'paid',
          paidAt: new Date()
        }
      });
    }

    return NextResponse.json({
      id: payment.id,
      status: isExpired ? 'expired' : payment.status,
      amount: payment.amount,
      isVerified: payment.status === 'paid',
      isExpired,
    });
  } catch (error) {
    console.error('[GET /api/tenant/subscriptions/payment/status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
