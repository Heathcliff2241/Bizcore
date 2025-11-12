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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId(session.user.id);
  if (!tenantId) {
    return NextResponse.json({ message: 'User is not associated with a tenant' }, { status: 403 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer || customer.tenantId !== tenantId) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          notes: customer.notes,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          orders: customer.orders.map(order => ({
            id: order.id,
            totalAmount: order.total,
            createdAt: order.createdAt,
            status: order.status
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}
