import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/tenant/subscriptions/pause
 * Pause subscription for a specified duration (1-3 months)
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

    const { pauseMonths = 1 } = await request.json();

    if (![1, 2, 3].includes(pauseMonths)) {
      return NextResponse.json(
        { error: 'Pause duration must be 1, 2, or 3 months' },
        { status: 400 }
      );
    }

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

    if (subscription.status === 'paused') {
      return NextResponse.json(
        { error: 'Subscription is already paused' },
        { status: 400 }
      );
    }

    // Calculate pause end date
    const pauseStartDate = new Date();
    const pauseEndDate = new Date();
    pauseEndDate.setMonth(pauseEndDate.getMonth() + pauseMonths);

    // Update subscription status to paused
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'paused'
      }
    });

    return NextResponse.json(
      {
        success: true,
        subscription: updatedSubscription,
        pauseDetails: {
          startDate: pauseStartDate,
          endDate: pauseEndDate,
          durationMonths: pauseMonths,
          message: `Your subscription is paused until ${pauseEndDate.toLocaleDateString()}. All your data is safely preserved.`
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Pause subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to pause subscription' },
      { status: 500 }
    );
  }
}
