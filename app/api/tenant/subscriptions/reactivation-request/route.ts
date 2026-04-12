/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';
import { sendReactivationInitiatedEmail, sendPaymentConfirmationEmail, sendAdminPaymentSubmittedEmail } from '@/lib/email/paymentEmails';
import { createReactivationRequestNotification } from '@/lib/notifications';

/**
 * POST /api/tenant/subscriptions/reactivation-request
 * Customer initiates a subscription reactivation request
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

    const body = await request.json();
    const {
      planId,
      gcashTransactionId,
      gcashProof,
      paymentMethodDetails,
    } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Missing required field: planId' },
        { status: 400 }
      );
    }

    // If payment details are provided, validate them
    if (gcashTransactionId || gcashProof) {
      if (!gcashTransactionId) {
        return NextResponse.json(
          { error: 'GCash transaction ID is required when submitting payment proof' },
          { status: 400 }
        );
      }
    }

    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: parseInt(session.user.tenantId, 10) },
      include: { tenant: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Check if subscription is cancelled
    if (subscription.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Subscription is not cancelled. Cannot reactivate.' },
        { status: 400 }
      );
    }

    // Check if there's already a reactivation request
    const existingReactivation = await prisma.planUpgradeRequest.findFirst({
      where: {
        tenantId: parseInt(session.user.tenantId, 10),
      },
    });

    if (existingReactivation && existingReactivation.status === 'pending') {
      return NextResponse.json(
        { error: 'A reactivation request is already pending for this tenant' },
        { status: 409 }
      );
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: { price: true, name: true, billingCycle: true },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // For reactivation, calculate full price (no proration since subscription is cancelled)
    const reactivationAmount = plan.price || 0;

    console.log('[POST /api/tenant/subscriptions/reactivation-request]', {
      tenantId: session.user.tenantId,
      planId,
      reactivationAmount,
    });

    // Create or update reactivation request (using PlanUpgradeRequest table with metadata)
    const reactivationRequest = await prisma.planUpgradeRequest.upsert({
      where: {
        tenantId: parseInt(session.user.tenantId, 10),
      },
      update: {
        currentPlan: subscription.planId,
        newPlan: planId,
        status: 'pending',
        amountDue: reactivationAmount,
        prorationDetails: {
          type: 'reactivation',
          fullAmount: reactivationAmount,
          explanation: 'Full price for subscription reactivation'
        },
        requestedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      create: {
        tenantId: parseInt(session.user.tenantId, 10),
        currentPlan: subscription.planId,
        newPlan: planId,
        status: 'pending',
        amountDue: reactivationAmount,
        prorationDetails: {
          type: 'reactivation',
          fullAmount: reactivationAmount,
          explanation: 'Full price for subscription reactivation'
        },
        requestedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // If payment details are provided, create the Payment record immediately
    let payment: any = null;
    if (gcashTransactionId) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day expiry
      payment = await (prisma.payment.create as any)({
        data: {
          subscriptionId: subscription.id,
          status: 'unpaid', // Will be marked 'paid' once admin verifies
          amount: reactivationAmount,
          currency: 'PHP',
          paymentMethod: 'gcash',
          expiresAt,
          metadata: {
            gcashTransactionId,
            gcashProof: gcashProof || null,
            submittedAt: new Date().toISOString(),
            verificationStatus: 'pending',
            adminNotes: null,
            paymentMethodDetails: paymentMethodDetails || null,
            planName: plan.name,
            planId: planId,
          },
        },
      });

      // Update the reactivation request with the payment ID
      await prisma.planUpgradeRequest.update({
        where: { id: reactivationRequest.id },
        data: { paymentId: payment.id },
      });

      console.log('[POST /api/tenant/subscriptions/reactivation-request] Payment created:', payment.id);
    }

    // Send email notification
    try {
      if (payment) {
        // Payment submitted - send payment confirmation email
        const user = await prisma.user.findUnique({
          where: { id: parseInt(session.user.id, 10) },
          select: { email: true, firstName: true, lastName: true },
        });

        if (user) {
          await sendPaymentConfirmationEmail(
            subscription.tenant.name,
            plan.name,
            reactivationAmount,
            'PHP',
            'reactivation'
          );
        }

        // Send admin notification about pending payment
        await prisma.adminNotification.create({
          data: {
            type: 'pending_payment',
            tenantId: parseInt(session.user.tenantId, 10),
            title: 'New Payment Pending Verification',
            message: `Payment of ₱${(reactivationAmount / 100).toFixed(2)} submitted for subscription reactivation (Reference: ${gcashTransactionId})`,
            actionUrl: '/admin/subscriptions',
            isRead: false,
          },
        });

        // Send admin email about payment submission
        await sendAdminPaymentSubmittedEmail(
          subscription.tenant.name,
          plan.name,
          reactivationAmount,
          'PHP',
          gcashTransactionId
        );
      } else {
        // No payment submitted - send reactivation initiated email
        await sendReactivationInitiatedEmail(
          subscription.tenant.name,
          plan.name,
          reactivationAmount
        );
      }
    } catch (emailError) {
      console.error('[Reactivation Request] Failed to send email:', emailError);
      // Don't fail the request if email fails
    }

    // Create admin notification
    try {
      if (!payment) {
        // Only create reactivation requested notification if no payment was submitted
        await prisma.adminNotification.create({
          data: {
            type: 'reactivation_requested',
            tenantId: parseInt(session.user.tenantId, 10),
            title: 'Subscription Reactivation Requested',
            message: `${subscription.tenant.name} requested reactivation of their ${plan.name} subscription (Amount due: ₱${(reactivationAmount / 100).toFixed(2)})`,
            actionUrl: '/admin/subscriptions',
            isRead: false,
          },
        });
      }
    } catch (notificationError) {
      console.error('[Reactivation Request] Failed to create admin notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    // Create tenant notification (broadcast to all users in tenant)
    try {
      if (payment) {
        // Payment submitted - create payment submitted notification
        await prisma.notification.create({
          data: {
            userId: parseInt(session.user.id, 10),
            tenantId: parseInt(session.user.tenantId, 10),
            type: 'payment_submitted',
            title: 'Payment Submitted for Reactivation',
            message: `Your payment of ₱${(reactivationAmount / 100).toFixed(2)} for ${plan.name} subscription reactivation has been submitted. We'll notify you once it's verified.`,
            actionUrl: `dashboard/${session.user.subdomain}`,
            isRead: false,
            priority: 'normal',
            metadata: {
              amount: reactivationAmount,
              planName: plan.name,
              gcashTransactionId,
            },
          },
        });
      } else {
        // No payment submitted - create reactivation request notification
        await createReactivationRequestNotification(
          parseInt(session.user.tenantId, 10),
          plan.name,
          reactivationAmount,
          `dashboard/${session.user.subdomain}`
        );
      }
    } catch (tenantNotificationError) {
      console.error('[Reactivation Request] Failed to create tenant notification:', tenantNotificationError);
      // Don't fail the request if notification creation fails
    }

    // Log activity
    try {
      await logActivity({
        userId: parseInt(session.user.id, 10),
        tenantId: parseInt(session.user.tenantId, 10),
        action: payment ? 'REACTIVATION_PAYMENT_SUBMITTED' : 'REACTIVATION_REQUEST_CREATED',
        details: {
          reactivationRequestId: reactivationRequest.id,
          planId,
          amount: reactivationAmount,
          planName: plan.name,
          ...(payment && { paymentId: payment.id, gcashTransactionId }),
        }
      });
    } catch (logError) {
      console.error('[Reactivation Request] Failed to log activity:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      reactivationRequest,
      payment: payment ? { id: payment.id } : null,
      message: payment 
        ? 'Reactivation request and payment submitted successfully' 
        : 'Reactivation request created successfully'
    });

  } catch (error) {
    console.error('[POST /api/tenant/subscriptions/reactivation-request] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}