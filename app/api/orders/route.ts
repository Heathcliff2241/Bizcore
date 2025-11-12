import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const orders = await prisma.order.findMany({
      where: { tenantId },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      order_number: order.orderNumber,
      customer_name: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest',
      customer_email: order.customer?.email,
      created_at: order.createdAt,
      total_amount: order.total,
      order_status: order.status,
    }));

    return NextResponse.json({ success: true, data: { orders: formattedOrders } });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 });
  }
}
