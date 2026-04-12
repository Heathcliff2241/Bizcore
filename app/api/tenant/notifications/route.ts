import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/tenant/notifications
 * Fetch paginated notifications for the current tenant user
 * Query params: status=unread&limit=20&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all'; // 'unread', 'read', 'archived', 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const tenantId = parseInt(session.user.tenantId, 10);

    // Build where clause
    const where: Record<string, unknown> = {
      tenantId,
      // userId: null means broadcast to all, OR userId matches current user
      OR: [
        { userId: null },
        { userId: parseInt(session.user.id, 10) }
      ]
    };

    if (status !== 'all') {
      where.status = status;
    }

    // Fetch notifications and total count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [notifications, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.notification as any).findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.notification as any).count({ where }),
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[GET /api/tenant/notifications] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tenant/notifications
 * Mark notifications as read or archive them
 * Body: { notificationIds: string[], action: 'read' | 'archive' }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, action = 'read' } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid notification IDs' },
        { status: 400 }
      );
    }

    const tenantId = parseInt(session.user.tenantId, 10);
    const numIds = notificationIds.map((id: string) => parseInt(id, 10));

    // Verify all notifications belong to this tenant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifications = await (prisma.notification as any).findMany({
      where: {
        id: { in: numIds },
        tenantId,
      },
    });

    if (notifications.length !== numIds.length) {
      return NextResponse.json(
        { error: 'One or more notifications not found' },
        { status: 404 }
      );
    }

    // Update notifications based on action
    let updateData: Record<string, unknown> = {};
    if (action === 'read') {
      updateData = { status: 'read', readAt: new Date() };
    } else if (action === 'archive') {
      updateData = { status: 'archived', archivedAt: new Date() };
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.notification as any).updateMany({
      where: { id: { in: numIds } },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updated: updated.count,
    });
  } catch (error) {
    console.error('[PATCH /api/tenant/notifications] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tenant/notifications/:id
 * Delete/dismiss a specific notification
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const pathParts = request.nextUrl.pathname.split('/');
    const notificationId = parseInt(pathParts[pathParts.length - 1], 10);

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    const tenantId = parseInt(session.user.tenantId, 10);

    // Verify notification belongs to this tenant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notification = await (prisma.notification as any).findFirst({
      where: {
        id: notificationId,
        tenantId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Delete the notification
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.notification as any).delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/tenant/notifications] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
