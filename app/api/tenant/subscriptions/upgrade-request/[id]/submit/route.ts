/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  sendPaymentConfirmationEmail,
  sendAdminPaymentSubmittedEmail,
} from '@/lib/email/paymentEmails';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * POST /api/tenant/subscriptions/upgrade-request/{id}/submit
 * Submit payment proof for upgrade request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
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

    // Parse FormData instead of JSON
    const formData = await request.formData();
    const gcashTransactionId = formData.get('gcashTransactionId') as string;
    const paymentProofFile = formData.get('paymentProof') as File;

    // Validate inputs
    if (!gcashTransactionId || !paymentProofFile) {
      return NextResponse.json(
        { error: 'Missing required fields: gcashTransactionId, paymentProof' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!paymentProofFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Payment proof must be an image file' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (paymentProofFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Payment proof file size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Fetch upgrade request
    const upgradeRequest = await prisma.planUpgradeRequest.findUnique({
      where: { id: upgradeRequestId },
      include: { tenant: true, subscription: true },
    });

    if (!upgradeRequest) {
      return NextResponse.json(
        { error: 'Upgrade request not found' },
        { status: 404 }
      );
    }

    // Verify it belongs to the tenant
    if (upgradeRequest.tenantId !== parseInt(session.user.tenantId, 10)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Verify request is still pending
    if (upgradeRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot submit payment for ${upgradeRequest.status} request` },
        { status: 400 }
      );
    }

    // Verify not expired
    if (new Date() > upgradeRequest.expiresAt) {
      // Mark as expired
      await prisma.planUpgradeRequest.update({
        where: { id: upgradeRequestId },
        data: { status: 'expired' },
      });

      return NextResponse.json(
        { error: 'Upgrade request has expired' },
        { status: 410 }
      );
    }

    console.log('[POST /api/tenant/subscriptions/upgrade-request/{id}/submit]', {
      upgradeRequestId,
      tenantId: upgradeRequest.tenantId,
      gcashTransactionId,
      amountDue: upgradeRequest.amountDue,
      fileSize: paymentProofFile.size,
      fileType: paymentProofFile.type,
    });

    // Save payment proof file
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'payment-proofs');
    await mkdir(uploadDir, { recursive: true });

    const fileExtension = paymentProofFile.name.split('.').pop() || 'jpg';
    const fileName = `payment-proof-${upgradeRequestId}-${Date.now()}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    const bytes = await paymentProofFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const paymentProofUrl = `/uploads/payment-proofs/${fileName}`;

    // Create Payment record
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day payment expiry
    const payment = await prisma.payment.create({
      data: {
        subscriptionId: upgradeRequest.subscription.id,
        status: 'unpaid', // Will be marked 'paid' once admin verifies
        amount: upgradeRequest.amountDue,
        currency: 'PHP',
        paymentMethod: 'gcash',
        expiresAt,
        metadata: {
          gcashTransactionId,
          paymentProofUrl,
          submittedAt: new Date().toISOString(),
          verificationStatus: 'pending',
          upgradeRequestId: upgradeRequestId,
          fromPlan: upgradeRequest.currentPlan,
          toPlan: upgradeRequest.newPlan,
        },
      },
    });

    // Update upgrade request
    const updatedUpgradeRequest = await prisma.planUpgradeRequest.update({
      where: { id: upgradeRequestId },
      data: {
        paymentId: payment.id,
        status: 'payment_submitted',
        paymentSubmittedAt: new Date(),
      },
      include: { tenant: true },
    });

    console.log('[POST /api/tenant/subscriptions/upgrade-request/{id}/submit] ✅ Payment submitted:', {
      paymentId: payment.id,
      upgradeStatus: updatedUpgradeRequest.status,
    });

    // Send confirmation emails
    try {
      const tenantOwner = await prisma.user.findFirst({
        where: { ownedTenants: { some: { id: upgradeRequest.tenantId } } },
        select: { email: true, firstName: true, lastName: true },
      });

      if (tenantOwner?.email) {
        await sendPaymentConfirmationEmail(
          upgradeRequest.tenant.name,
          upgradeRequest.newPlan,
          upgradeRequest.amountDue,
          'PHP',
          'upgrade'
        );
      }

      await sendAdminPaymentSubmittedEmail(
        upgradeRequest.tenant.name,
        upgradeRequest.newPlan,
        upgradeRequest.amountDue,
        'PHP',
        'upgrade'
      );
    } catch (emailError) {
      console.error('[POST /api/tenant/subscriptions/upgrade-request/{id}/submit] Email error:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      upgradeRequest: updatedUpgradeRequest,
      payment,
      message: 'Payment proof submitted successfully. Awaiting admin verification.',
    });
  } catch (error) {
    console.error('[POST /api/tenant/subscriptions/upgrade-request/{id}/submit]', error);
    return NextResponse.json(
      { error: 'Failed to submit payment' },
      { status: 500 }
    );
  }
}