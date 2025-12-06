import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveTenant } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get('subdomain');

  const tenant = await resolveTenant(session, subdomain);

  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
  }

  try {
    const total_customers = await prisma.customer.count({ where: { tenantId: tenant.id } });
    const active_customers = total_customers;

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const new_this_month = await prisma.customer.count({
      where: { tenantId: tenant.id, createdAt: { gte: firstDayOfMonth } }
    });

    return NextResponse.json({ success: true, data: { total_customers, active_customers, new_this_month } });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return NextResponse.json({ error: 'Failed to fetch customer stats' }, { status: 500 });
  }
}
