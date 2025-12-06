/**
 * GET /api/admin/notifications
 * Fetch admin notifications with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const excludeDismissed = searchParams.get('excludeDismissed') === 'true'

    // Build where clause
    const where: Record<string, unknown> = {}
    if (unreadOnly) {
      where.isRead = false
      if (excludeDismissed) {
        where.isDismissed = false
      }
    } else if (excludeDismissed) {
      where.isDismissed = false
    }

    // Get total count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = await (prisma as any).adminNotification.count({ where })

    // Fetch notifications with pagination
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifications = await (prisma as any).adminNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            industry: true
          }
        }
      }
    })

    const hasMore = (page - 1) * limit + notifications.length < total

    return NextResponse.json(
      {
        success: true,
        notifications,
        pagination: {
          page,
          limit,
          total,
          hasMore
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Admin notifications fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/notifications
 * Mark notification(s) as read or dismiss them
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json() as { notificationIds?: string[]; markAllAsRead?: boolean; dismiss?: boolean }
    const { notificationIds, markAllAsRead, dismiss } = body

    let updatedCount = 0

    if (markAllAsRead) {
      // Mark all unread notifications as read
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (prisma as any).adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true }
      })
      updatedCount = result.count
    } else if (notificationIds && Array.isArray(notificationIds)) {
      if (dismiss) {
        // Dismiss specific notifications
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (prisma as any).adminNotification.updateMany({
          where: { id: { in: notificationIds } },
          data: { isDismissed: true }
        })
        updatedCount = result.count
      } else {
        // Mark specific notifications as read
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (prisma as any).adminNotification.updateMany({
          where: { id: { in: notificationIds } },
          data: { isRead: true }
        })
        updatedCount = result.count
      }
    } else {
      return NextResponse.json(
        { error: 'notificationIds array or markAllAsRead flag required' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: dismiss 
          ? `Dismissed ${updatedCount} notification(s)`
          : `Marked ${updatedCount} notification(s) as read`,
        updatedCount
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Admin notification update error:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
