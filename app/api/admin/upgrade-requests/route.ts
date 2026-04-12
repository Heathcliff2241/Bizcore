/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/upgrade-requests
 * List all pending upgrade requests for admin review
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    const upgradeRequests = await prisma.planUpgradeRequest.findMany({
      where: {
        status: status === 'all' ? undefined : (status as any),
      },
      include: {
        tenant: true,
        payment: true,
      },
      orderBy: { requestedAt: 'desc' },
    });

    const formatted = upgradeRequests.map((req) => ({
      id: req.id,
      tenantId: req.tenantId,
      tenantName: req.tenant.name,
      currentPlan: req.currentPlan,
      newPlan: req.newPlan,
      amountDue: req.amountDue,
      status: req.status,
      requestedAt: req.requestedAt,
      paymentSubmittedAt: req.paymentSubmittedAt,
      approvedAt: req.approvedAt,
      appliedAt: req.appliedAt,
      cancelledAt: req.cancelledAt,
      expiresAt: req.expiresAt,
      gcashTransactionId: (req.payment?.metadata as any)?.gcashTransactionId,
      paymentProof: (req.payment?.metadata as any)?.paymentProofUrl,
      payment: req.payment
        ? {
            id: req.payment.id,
            status: req.payment.status,
            metadata: req.payment.metadata,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      upgradeRequests: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('[GET /api/admin/upgrade-requests]', error);
    return NextResponse.json(
      { error: 'Failed to fetch upgrade requests' },
      { status: 500 }
    );
  }
}
