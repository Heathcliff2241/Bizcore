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
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id, 10), tenantId },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    
    const formattedOrder = {
        ...order,
        order_number: order.orderNumber,
        customer_name: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest',
        customer_email: order.customer?.email,
        customer_phone: order.customer?.phone,
        created_at: order.createdAt,
        total_amount: order.total,
        subtotal_amount: order.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        tax_amount: order.tax,
        delivery_fee: 0, // Assuming no delivery fee for now
        order_status: order.status,
        OrderItems: order.orderItems.map(item => ({
            id: item.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity,
        }))
    };

    return NextResponse.json({ success: true, data: { order: formattedOrder } });
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch order details' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  
    const tenantId = await getTenantId(session.user.id);
    if (!tenantId) {
      return NextResponse.json({ message: 'User is not associated with a tenant' }, { status: 403 });
    }

    const { order_status } = await request.json();

    try {
        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id, 10), tenantId },
            data: { status: order_status },
            include: {
                customer: true,
                orderItems: {
                  include: {
                    product: true,
                  },
                },
              },
        });

        const formattedOrder = {
            ...updatedOrder,
            order_number: updatedOrder.orderNumber,
            customer_name: updatedOrder.customer ? `${updatedOrder.customer.firstName} ${updatedOrder.customer.lastName}` : 'Guest',
            customer_email: updatedOrder.customer?.email,
            customer_phone: updatedOrder.customer?.phone,
            created_at: updatedOrder.createdAt,
            total_amount: updatedOrder.total,
            subtotal_amount: updatedOrder.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            tax_amount: updatedOrder.tax,
            delivery_fee: 0, // Assuming no delivery fee for now
            order_status: updatedOrder.status,
            OrderItems: updatedOrder.orderItems.map(item => ({
                id: item.id,
                product_name: item.product.name,
                quantity: item.quantity,
                unit_price: item.price,
                subtotal: item.price * item.quantity,
            }))
        };

        return NextResponse.json({ success: true, data: { order: formattedOrder } });

    } catch (error) {
        console.error('Failed to update order status:', error);
        return NextResponse.json({ success: false, message: 'Failed to update order status' }, { status: 500 });
    }
}
