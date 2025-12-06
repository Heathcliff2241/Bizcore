import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveTenant } from '@/lib/tenant';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    if (!customer || customer.tenantId !== tenant.id) {
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
          totalOrders: customer.orders.length,
          totalSpent: customer.orders.reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0),
          lastOrderDate: customer.orders[0]?.createdAt,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { firstName, lastName, phone } = body

    // Verify user owns this customer record
    const customer = await prisma.customer.findFirst({
      where: { id: parseInt(id), email: session.user.email }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const updated = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        firstName: firstName || customer.firstName,
        lastName: lastName || customer.lastName,
        phone: phone !== undefined ? phone : customer.phone
      }
    })

    return NextResponse.json({ success: true, customer: updated })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}
