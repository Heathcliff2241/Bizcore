/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';
import { sendPaymentConfirmationEmail, sendAdminPaymentSubmittedEmail } from '@/lib/email/paymentEmails';
import { createReactivationPaymentSubmittedNotification } from '@/lib/notifications';

/**
 * POST /api/tenant/subscriptions/reactivation/payment/submit
 * Customer submits GCash payment for subscription reactivation
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
    let payment: any = null;

    // Validate inputs
    if (!subscriptionId || !amount || !gcashTransactionId) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, amount, gcashTransactionId' },
        { status: 400 }
      );
    }

    // Verify subscription belongs to tenant and is cancelled
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        tenantId: true,
        status: true,
        planId: true,
        tenant: { select: { name: true } }
      },
    });

    if (!subscription || subscription.tenantId !== parseInt(session.user.tenantId, 10)) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Subscription is not cancelled. Cannot reactivate.' },
        { status: 400 }
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

    // Create Payment record with unpaid status
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
          planName: planName || null, // Store the plan name being reactivated to
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

    if (!existingInvoice) {
      await prisma.invoice.create({
        data: {
          subscriptionId,
          paymentId: payment.id,
          invoiceNumber: `INV-${Date.now()}`,
          subtotal: amount,
          tax: 0,
          discount: 0,
          total: amount,
          status: 'issued',
          dueDate: expiresAt,
          lineItems: [{
            description: `Reactivation payment for ${planName || 'Plan'}`,
            quantity: 1,
            unitPrice: amount,
            total: amount,
          }],
        },
      });
    } else {
      await prisma.invoice.update({
        where: { id: existingInvoice.id },
        data: { 
          paymentId: payment.id, 
          status: 'issued',
          subtotal: amount,
          total: amount,
          lineItems: [{
            description: `Reactivation payment for ${planName || 'Plan'}`,
            quantity: 1,
            unitPrice: amount,
            total: amount,
          }],
        },
      });
    }

    // Log activity
    await logActivity({
      userId: parseInt(session.user.id, 10),
      tenantId: parseInt(session.user.tenantId, 10),
      action: 'REACTIVATION_PAYMENT_SUBMITTED',
      details: {
        subscriptionId: subscriptionId,
        paymentId: payment.id,
        amount,
      }
    });

    // Send confirmation emails
    try {
      await sendPaymentConfirmationEmail(
        subscription.tenant.name,
        planName,
        amount / 100, // Convert from centavos back to PHP
        'PHP',
        'reactivation'
      );

      await sendAdminPaymentSubmittedEmail(
        subscription.tenant.name,
        planName,
        amount / 100, // Convert from centavos back to PHP
        'PHP',
        'reactivation'
      );
    } catch (emailError) {
      console.error('[Reactivation Payment] Failed to send emails:', emailError);
      // Don't fail the payment if emails fail
    }

    // Create admin notification about pending reactivation payment
    try {
      await prisma.adminNotification.create({
        data: {
          type: 'pending_payment',
          title: 'Reactivation Payment Pending Verification',
          message: `Payment of ₱${(amount / 100).toFixed(2)} submitted for subscription reactivation (Reference: ${gcashTransactionId})`,
          actionUrl: '/admin/subscriptions',
          isRead: false,
        },
      });
    } catch (notificationError) {
      console.error('[Reactivation Payment] Failed to create admin notification:', notificationError);
      // Don't fail the payment if notification creation fails
    }

    // Create tenant notification about payment submission
    try {
      await createReactivationPaymentSubmittedNotification(
        subscription.tenantId,
        planName || 'Plan',
        amount,
        gcashTransactionId,
        expiresAt,
        `dashboard/${session.user.subdomain}`
      );
    } catch (tenantNotificationError) {
      console.error('[Reactivation Payment] Failed to create tenant notification:', tenantNotificationError);
      // Don't fail the payment if notification creation fails
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      expiresAt: expiresAt.toISOString(),
      message: 'Reactivation payment submitted successfully'
    });

  } catch (error) {
    console.error('[POST /api/tenant/subscriptions/reactivation/payment/submit] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}