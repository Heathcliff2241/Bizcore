import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, startOfMonth } from 'date-fns';

async function getTenantId(userId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    include: { tenantUsers: true },
  });
  return user?.tenantUsers[0]?.tenantId ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId(session.user.id);
  if (!tenantId) {
    return NextResponse.json({ message: 'User is not associated with a tenant' }, { status: 403 });
  }

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    const todayOrders = await prisma.order.count({
      where: {
        tenantId,
        createdAt: { gte: todayStart },
      },
    });

    const todayRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: {
        tenantId,
        createdAt: { gte: todayStart },
      },
    });

    const pendingOrders = await prisma.order.count({
      where: {
        tenantId,
        status: 'pending',
      },
    });

    const monthRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: {
        tenantId,
        createdAt: { gte: monthStart },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        today_orders: todayOrders,
        today_revenue: todayRevenue._sum.total || 0,
        pending_orders: pendingOrders,
        month_revenue: monthRevenue._sum.total || 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch stats' }, { status: 500 });
  }
}
