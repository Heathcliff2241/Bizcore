import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params
    const tenantId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    // Fetch activity logs for tenant
    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.activityLog.count({ where: { tenantId } })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: activities.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details,
        user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
        userEmail: log.user?.email,
        createdAt: log.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}
