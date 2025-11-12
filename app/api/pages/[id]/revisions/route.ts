import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/pages/[id]/revisions - Get page revisions
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const revisions = await prisma.pageDesignRevision.findMany({
      where: { pageDesignId: parseInt(params.id) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: revisions
    })
  } catch (error) {
    console.error('Error fetching revisions:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch revisions' },
      { status: 500 }
    )
  }
}
