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
    const total_customers = await prisma.customer.count({ where: { tenantId } });
    const active_customers = total_customers;

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const new_this_month = await prisma.customer.count({
      where: { tenantId, createdAt: { gte: firstDayOfMonth } }
    });

    return NextResponse.json({ success: true, data: { total_customers, active_customers, new_this_month } });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return NextResponse.json({ error: 'Failed to fetch customer stats' }, { status: 500 });
  }
}
