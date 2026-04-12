import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';
import { sendPaymentConfirmationEmail, sendAdminPaymentSubmittedEmail } from '@/lib/email/paymentEmails';

/**
 * POST /api/tenant/subscriptions/payment/submit
 * Customer submits GCash payment for subscription upgrade
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      subscriptionId,
      amount,
      gcashTransactionId,
      gcashProof,
      paymentMethodDetails,
      planName,
    } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tenant: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payment: any = null;

    // Validate inputs
    if (!subscriptionId || !amount || !gcashTransactionId) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, amount, gcashTransactionId' },
        { status: 400 }
      );
    }

    // Verify subscription belongs to tenant
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { tenantId: true, status: true, pendingUpgradePlanId: true },
    });

    if (!subscription || subscription.tenantId !== parseInt(session.user.tenantId, 10)) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Look up plan ID by name for better metadata
    let planId = null;
    if (planName) {
      const plan = await prisma.plan.findUnique({
        where: { name: planName },
        select: { id: true },
      });
      planId = plan?.id || null;
    }

    // Create Payment record with pending status
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day expiry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payment = await (prisma.payment.create as any)({
      data: {
        subscriptionId,
        status: 'unpaid', // Will be marked 'paid' once admin verifies
        amount,
        currency: 'PHP', // Default to Philippine Peso for GCash
        paymentMethod: 'gcash',
        expiresAt,
        metadata: {
          gcashTransactionId,
          gcashProof: gcashProof || null,
          submittedAt: new Date().toISOString(),
          verificationStatus: 'pending', // pending, verified, expired, rejected
          adminNotes: null,
          paymentMethodDetails: paymentMethodDetails || null,
          planName: planName || null, // Store the plan name being upgraded to
          planId: planId, // Store the plan ID for more reliable lookups
        },
      },
    });

    // Create Invoice for this payment if not already created
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        subscriptionId,
        paymentId: null,
      },
    });

    if (existingInvoice) {
      await prisma.invoice.update({
        where: { id: existingInvoice.id },
        data: { paymentId: payment.id },
      });
    } else {
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Get the plan name - prefer from payment metadata, fallback to pending upgrade
      let planDescription = 'Subscription Upgrade';
      let resolvedPlanName: string | null = planName || null; // From request body
      
      if (!resolvedPlanName && subscription.pendingUpgradePlanId) {
        const upgradePlan = await prisma.plan.findUnique({
          where: { id: subscription.pendingUpgradePlanId },
          select: { name: true },
        });
        if (upgradePlan) {
          resolvedPlanName = upgradePlan.name;
        }
      }
      
      if (resolvedPlanName) {
        planDescription = `${resolvedPlanName} Plan Upgrade`;
      }
      
      // Convert amount from cents to pesos for storage (divide by 100)
      const amountInPesos = amount / 100; // Convert cents to pesos
      
      await prisma.invoice.create({
        data: {
          subscriptionId,
          paymentId: payment.id,
          invoiceNumber,
          status: 'issued',
          subtotal: amountInPesos,
          tax: 0,
          discount: 0,
          total: amountInPesos,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour payment window
          lineItems: [
            {
              description: planDescription,
              quantity: 1,
              unitPrice: amountInPesos,
              total: amountInPesos,
            },
          ],
        },
      });
    }

    // Send payment confirmation email and admin notification
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id, 10) },
        select: { email: true, firstName: true, lastName: true },
      });

      tenant = await prisma.tenant.findUnique({
        where: { id: parseInt(session.user.tenantId, 10) },
        select: { name: true },
      });

      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: { planId: true, pendingUpgradePlanId: true },
      });

      if (user && tenant) {
        await sendPaymentConfirmationEmail(
          tenant.name,
          planName || 'Plan Upgrade',
          amount,
          'PHP',
          'upgrade'
        );
      }

      // Send admin notification email
      if (subscription) {
        if (tenant) {
          await sendAdminPaymentSubmittedEmail(
            tenant.name,
            planName || 'Plan Upgrade',
            amount,
            'PHP',
            gcashTransactionId
          );
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the payment submission
      console.error('[POST /api/tenant/subscriptions/payment/submit] Email error:', emailError);
    }

    // Create admin notification about pending payment
    try {
      const notification = await prisma.adminNotification.create({
        data: {
          type: 'pending_payment',
          tenantId: parseInt(session.user.tenantId, 10),
          title: 'New Payment Pending Verification',
          message: `Payment of ₱${(amount).toFixed(2)} submitted for subscription upgrade (Reference: ${gcashTransactionId})`,
          actionUrl: '/admin/subscriptions',
          isRead: false,
        },
      });
      console.log('[POST /api/tenant/subscriptions/payment/submit] Notification created:', notification.id);
    } catch (notificationError) {
      // Log notification error but don't fail the payment submission
      console.error('[POST /api/tenant/subscriptions/payment/submit] Notification error:', notificationError);
    }

    // Log the payment submission
    try {
      await logActivity({
        userId: parseInt(session.user.id, 10),
        tenantId: parseInt(session.user.tenantId, 10),
        action: 'PAYMENT_RECEIVED',
        details: {
          paymentId: payment.id,
          subscriptionId,
          amount,
          gcashTransactionId,
          status: 'pending'
        }
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('[POST /api/tenant/subscriptions/payment/submit] Logging error:', logError);
    }

    return NextResponse.json(
      {
        success: true,
        paymentId: payment.id,
        message: 'Payment submitted. Please wait for admin verification.',
        expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/tenant/subscriptions/payment/submit] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
