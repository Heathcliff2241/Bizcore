/* eslint-disable @typescript-eslint/no-explicit-any */
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

    // Get pending upgrade/reactivation requests that don't have payments yet
    const pendingRequests = await prisma.planUpgradeRequest.findMany({
      where: {
        status: 'pending',
        paymentId: null, // Only requests without submitted payments
      },
      select: {
        id: true,
        tenantId: true,
        currentPlan: true,
        newPlan: true,
        amountDue: true,
        prorationDetails: true,
        requestedAt: true,
        expiresAt: true,
        tenant: {
          select: {
            id: true,
            name: true
          }
        },
        subscription: {
          select: {
            id: true,
            planId: true,
            status: true
          }
        }
      },
      orderBy: { requestedAt: 'desc' },
    });

    console.log(`[GET /api/admin/payments] Found ${payments.length} total payments`);
    console.log(`[GET /api/admin/payments] Found ${pendingRequests.length} pending requests`);

    // Filter and map pending payments
    interface PaymentMetadata {
      gcashTransactionId?: string;
      submittedAt?: string;
      verificationStatus?: string;
      planName?: string;
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
        
        // Use planName from metadata if available, otherwise map from plan IDs
        let planName = metadata?.planName;
        if (!planName) {
          const planNames: Record<string, string> = {
            'trial': 'Free Trial',
            'basic': 'Standard Monthly',
            'premium': 'Standard Yearly',
            'enterprise': 'Enterprise'
          };
          const planIdToShow = p.subscription.pendingUpgradePlanId || p.subscription.planId;
          planName = planNames[planIdToShow] || planIdToShow;
        }
        
        return {
          id: String(p.id),
          subscriptionId: String(p.subscriptionId),
          planName,
          amount: p.amount,
          currency: p.currency,
          gcashTransactionId: metadata?.gcashTransactionId,
          submittedAt: metadata?.submittedAt,
          expiresAt: new Date(submittedAt.getTime() + 24 * 60 * 60 * 1000),
          status: p.status,
          type: 'payment' as const,
        };
      });

    // Map pending upgrade/reactivation requests
    const pendingRequestItems = pendingRequests.map((request) => {
      // Determine if this is reactivation or upgrade based on proration details
      const isReactivation = (request.prorationDetails as any)?.type === 'reactivation';
      
      // Get plan name
      const planNames: Record<string, string> = {
        'trial': 'Free Trial',
        'basic': 'Standard Monthly',
        'premium': 'Standard Yearly',
        'enterprise': 'Enterprise'
      };
      const planName = planNames[request.newPlan] || request.newPlan;
      
      return {
        id: `request-${request.id}`,
        subscriptionId: String(request.subscription.id),
        planName: isReactivation ? `${planName} (Reactivation)` : `${planName} (Upgrade)`,
        amount: request.amountDue,
        currency: 'PHP',
        gcashTransactionId: null,
        submittedAt: request.requestedAt.toISOString(),
        expiresAt: request.expiresAt.toISOString(),
        status: 'pending_request',
        type: 'request' as const,
        requestType: isReactivation ? 'reactivation' : 'upgrade',
        requestId: request.id,
      };
    });

    // Combine and sort by submittedAt/requestedAt
    const allPendingItems = [...pendingPayments, ...pendingRequestItems]
      .sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      });

    console.log(`[GET /api/admin/payments] Returning ${allPendingItems.length} pending items (${pendingPayments.length} payments, ${pendingRequestItems.length} requests)`);

    return NextResponse.json(allPendingItems);
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
            billingCycle: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
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

    console.log('[PUT /api/admin/payments] DIAGNOSTIC - Payment found:', {
      paymentId: payment.id,
      paymentStatus: payment.status,
      subscriptionId: payment.subscriptionId,
      currentPlanId: payment.subscription.planId,
      pendingUpgradePlanId: payment.subscription.pendingUpgradePlanId,
      subscriptionStatus: payment.subscription.status,
      tenantName: payment.subscription.tenant.name,
    });
    
    // CRITICAL DIAGNOSTIC: Check if pendingUpgradePlanId is null
    if (!payment.subscription.pendingUpgradePlanId) {
      console.warn('[PUT /api/admin/payments] ⚠️ WARNING: pendingUpgradePlanId is NULL or empty!', {
        subscriptionId: payment.subscriptionId,
        tenantName: payment.subscription.tenant.name,
        currentPlanId: payment.subscription.planId,
        paymentId: paymentIdInt,
        paymentMetadata: payment.metadata,
      });
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
      // CRITICAL: Check if there's actually a pending upgrade
      if (!payment.subscription.pendingUpgradePlanId) {
        console.warn('[PUT /api/admin/payments] WARNING: Payment approved but NO pending upgrade plan found!', {
          paymentId: paymentIdInt,
          subscriptionId: payment.subscriptionId,
          currentPlanId: payment.subscription.planId,
          pendingUpgradePlanId: payment.subscription.pendingUpgradePlanId,
        });
      }

      // Get the new plan to determine billing cycle
      // IMPORTANT: Never set billingCycle to 'trial' during payment approval
      // Trial is only for onboarding. Paid plans should be 'monthly' or 'annual'
      let billingCycle = 'monthly'; // default

      // CRITICAL: Determine intended upgrade plan ID. Prefer upgradeRequestId from payment metadata
      // (used by the new flow), otherwise fall back to pendingUpgradePlanId (legacy flow).
      const paymentMetadataAny: any = payment.metadata || {};
      let upgradingPlanId: string | null = null;
      let resolvedUpgradeRequestId: number | null = null;

      if (paymentMetadataAny.upgradeRequestId) {
        resolvedUpgradeRequestId = parseInt(String(paymentMetadataAny.upgradeRequestId), 10);
        if (!isNaN(resolvedUpgradeRequestId)) {
          // Fetch the upgrade request and resolve its newPlan field
          const request = await prisma.planUpgradeRequest.findUnique({
            where: { id: resolvedUpgradeRequestId },
          });
          if (request) {
            upgradingPlanId = request.newPlan;
          } else {
            console.warn('[PUT /api/admin/payments] upgradeRequestId in metadata not found:', paymentMetadataAny.upgradeRequestId);
          }
        }
      }

      // Legacy fallback to subscription.pendingUpgradePlanId
      if (!upgradingPlanId) {
        upgradingPlanId = payment.subscription.pendingUpgradePlanId || null;
      }

      // Final fallback: look up plan by name from payment metadata
      if (!upgradingPlanId && paymentMetadataAny.planName) {
        console.log('[PUT /api/admin/payments] FALLBACK: Looking up plan by name:', paymentMetadataAny.planName);
        const planByName = await prisma.plan.findUnique({
          where: { name: paymentMetadataAny.planName },
          select: { id: true, billingCycle: true },
        });
        if (planByName) {
          upgradingPlanId = planByName.id;
          // Update billing cycle from the found plan
          if (planByName.billingCycle && planByName.billingCycle !== 'trial') {
            billingCycle = planByName.billingCycle as 'monthly' | 'annual' | 'lifetime';
          }
          console.log('[PUT /api/admin/payments] FOUND plan by name:', upgradingPlanId, 'billingCycle:', billingCycle);
        } else {
          console.warn('[PUT /api/admin/payments] Plan not found by name:', paymentMetadataAny.planName);
        }
      }

      // Ultimate fallback: use planId directly from metadata
      if (!upgradingPlanId && paymentMetadataAny.planId) {
        console.log('[PUT /api/admin/payments] ULTIMATE FALLBACK: Using planId from metadata:', paymentMetadataAny.planId);
        upgradingPlanId = paymentMetadataAny.planId;
        // Get billing cycle for this plan
        const planData = await prisma.plan.findUnique({
          where: { id: paymentMetadataAny.planId },
          select: { billingCycle: true },
        });
        if (planData?.billingCycle && planData.billingCycle !== 'trial') {
          billingCycle = planData.billingCycle as 'monthly' | 'annual' | 'lifetime';
        }
      }

      // If upgradingPlanId was found via pendingUpgradePlanId, get its billing cycle
      if (upgradingPlanId && !paymentMetadataAny.planName) {
        const upgradePlan = await prisma.plan.findUnique({
          where: { id: upgradingPlanId },
          select: { billingCycle: true },
        });
        if (upgradePlan?.billingCycle && upgradePlan.billingCycle !== 'trial') {
          billingCycle = upgradePlan.billingCycle as 'monthly' | 'annual' | 'lifetime';
        }
      }
      
      const subscriptionUpdate: Record<string, unknown> = {
        status: 'active',
        pendingUpgradePlanId: null,
      };

      // If there's a pending upgrade plan, apply it and reset billing cycle
      if (upgradingPlanId) {
        subscriptionUpdate.planId = upgradingPlanId;
        subscriptionUpdate.planChangedAt = new Date();
        
        // Update billing cycle to match the new plan (CRITICAL: must not be 'trial')
        subscriptionUpdate.billingCycle = billingCycle as any; // billingCycle was fetched above
        
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

        console.log('[PUT /api/admin/payments] UPGRADE - Intending to set planId to:', upgradingPlanId, ', upgradeRequestId:', resolvedUpgradeRequestId);
      } else {
        // No upgrade, just mark as active and set next payment date
        subscriptionUpdate.nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        console.log('[PUT /api/admin/payments] NO UPGRADE - planId remains:', payment.subscription.planId);
      }

      console.log('[PUT /api/admin/payments] Subscription update object:', {
        planId: subscriptionUpdate.planId,
        billingCycle: subscriptionUpdate.billingCycle,
        status: subscriptionUpdate.status,
        pendingUpgradePlanId: subscriptionUpdate.pendingUpgradePlanId,
        currentPeriodEnd: subscriptionUpdate.currentPeriodEnd,
      });

      const updatedSubscription = await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: subscriptionUpdate,
        include: { tenant: true },
      });

      // VERIFY the update worked - CRITICAL CHECK
      console.log('[PUT /api/admin/payments] AFTER UPDATE - subscription:', {
        id: updatedSubscription.id,
        planId: updatedSubscription.planId,
        status: updatedSubscription.status,
        pendingUpgradePlanId: updatedSubscription.pendingUpgradePlanId,
      });

      // CRITICAL ASSERTION: If we were upgrading, planId MUST have changed
      if (upgradingPlanId && updatedSubscription.planId !== upgradingPlanId) {
        console.error('[PUT /api/admin/payments] ❌ CRITICAL ERROR: planId was NOT updated!', {
          expected: upgradingPlanId,
          actual: updatedSubscription.planId,
          subscriptionId: payment.subscriptionId,
          updateData: subscriptionUpdate,
        });
        // This is a critical bug - log it but continue to send email with correct plan
      } else if (upgradingPlanId) {
        console.log('[PUT /api/admin/payments] ✅ SUCCESS: planId correctly updated to:', upgradingPlanId);
      }

      console.log('[PUT /api/admin/payments] Updated subscription:', {
        id: updatedSubscription.id,
        planId: updatedSubscription.planId,
        billingCycle: updatedSubscription.billingCycle,
        status: updatedSubscription.status,
        pendingUpgradePlanId: updatedSubscription.pendingUpgradePlanId,
      });

      // If we applied an upgrade and we have a resolved upgrade request, mark it as applied
      if (resolvedUpgradeRequestId) {
        try {
          await prisma.planUpgradeRequest.update({
            where: { id: resolvedUpgradeRequestId },
            data: {
              status: 'applied',
              approvedAt: new Date(),
              appliedAt: new Date(),
              approvedBy: parseInt(session.user.id || '0', 10),
            },
          });
        } catch (e) {
          console.error('[PUT /api/admin/payments] Failed to update planUpgradeRequest status:', e);
        }
      }

      // Sync Tenant.subscriptionPlan based on planId applied
      try {
        if (updatedSubscription.planId && updatedSubscription.tenant) {
          // Map plan ids to tenant subscription plan enum
          const mapPlanToTenantPlan = (planId: string) => {
            if (planId === 'trial') return 'free';
            if (['free', 'basic', 'premium', 'enterprise'].includes(planId)) return planId as any;
            // fallback
            return 'free' as any;
          };

          const tenantPlanVal = mapPlanToTenantPlan(updatedSubscription.planId);
          await prisma.tenant.update({ where: { id: updatedSubscription.tenant.id }, data: { subscriptionPlan: tenantPlanVal } });
          console.log('[PUT /api/admin/payments] Tenant.subscriptionPlan synced to:', tenantPlanVal, 'for tenantId', updatedSubscription.tenant.id);
        }
      } catch (e) {
        console.error('[PUT /api/admin/payments] Failed to sync tenant.subscriptionPlan:', e);
      }

      // Send verification email to tenant and admin notification
      try {
        const subscriber = await prisma.user.findFirst({
          where: { tenantUsers: { some: { tenantId: updatedSubscription.tenantId } } },
          select: { email: true, firstName: true, lastName: true },
        });

        if (subscriber?.email) {
          const recipientName = `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim() || 'Customer';
          
          // CRITICAL: Determine which plan to show in the email
          // Priority: 1) Updated subscription planId, 2) Fallback to upgradingPlanId (what we intended to upgrade to)
          let planIdToFetch = updatedSubscription.planId;
          let planSource = 'updated subscription';
          
          if (!planIdToFetch && upgradingPlanId) {
            planIdToFetch = upgradingPlanId;
            planSource = 'FALLBACK to upgradingPlanId';
            console.warn('[PUT /api/admin/payments] ⚠️ Using FALLBACK planId:', upgradingPlanId);
          }
          
          let planNameToSend = 'Premium'; // fallback
          
          console.log('[PUT /api/admin/payments] TENANT EMAIL - Using planId:', planIdToFetch, 'from', planSource);
          
          // Fetch the plan name
          const planData = await prisma.plan.findUnique({
            where: { id: planIdToFetch },
            select: { name: true },
          });
          planNameToSend = planData?.name || planNameToSend;
          
          console.log('[PUT /api/admin/payments] TENANT EMAIL - Plan name:', planNameToSend);
          
          try {
            await sendTenantPaymentApprovedEmail(
              subscriber.email,
              recipientName,
              updatedSubscription.tenant.name,
              planNameToSend,
              payment.amount,
              payment.currency || 'PHP'
            );
          } catch (sendError) {
            console.error('[PUT /api/admin/payments] sendTenantPaymentApprovedEmail error:', sendError);
          }
        }

        // Send admin notification email - use the same plan name
        let planNameToSend = 'Premium'; // fallback
        let planIdToFetch = updatedSubscription.planId;
        
        if (!planIdToFetch && upgradingPlanId) {
          planIdToFetch = upgradingPlanId;
          console.warn('[PUT /api/admin/payments] ADMIN EMAIL: Using FALLBACK planId:', upgradingPlanId);
        }
        
        const planData = await prisma.plan.findUnique({
          where: { id: planIdToFetch },
          select: { name: true },
        });
        planNameToSend = planData?.name || planNameToSend;
        
        console.log('[PUT /api/admin/payments] ADMIN EMAIL - Using planId:', planIdToFetch, 'Plan name:', planNameToSend);
        
        try {
          await sendAdminPaymentVerifiedEmail(
            updatedSubscription.tenant.name,
            planNameToSend,
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
