/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/tenant/subscriptions/upgrade-request/{id}
 * Cancel an upgrade request
 */
export async function PUT(
  _request: NextRequest,
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

    // Fetch upgrade request
    const upgradeRequest = await prisma.planUpgradeRequest.findUnique({
      where: { id: upgradeRequestId },
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

    // Can only cancel pending or payment_submitted requests
    if (!['pending', 'payment_submitted'].includes(upgradeRequest.status)) {
      return NextResponse.json(
        { error: `Cannot cancel ${upgradeRequest.status} request` },
        { status: 400 }
      );
    }

    const cancelled = await prisma.planUpgradeRequest.update({
      where: { id: upgradeRequestId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        paymentId: null, // Disassociate payment
      },
    });

    console.log('[PUT /api/tenant/subscriptions/upgrade-request/{id}] ✅ Upgrade request cancelled');

    return NextResponse.json({
      success: true,
      upgradeRequest: cancelled,
      message: 'Upgrade request cancelled',
    });
  } catch (error) {
    console.error('[PUT /api/tenant/subscriptions/upgrade-request/{id}]', error);
    return NextResponse.json(
      { error: 'Failed to cancel upgrade request' },
      { status: 500 }
    );
  }
}
