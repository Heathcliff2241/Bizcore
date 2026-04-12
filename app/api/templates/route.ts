import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/templates - Get published admin templates (tenant-accessible)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[TEMPLATES GET] User:', session.user.id, 'Role:', session.user.role)

    // Fetch published admin templates (tenantId = null, isPublished = true)
    const templates = await prisma.page.findMany({
      where: {
        tenantId: null,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log('[TEMPLATES GET] Found', templates.length, 'published templates')

    const formattedTemplates = templates.map((t) => ({
      id: t.id.toString(),
      name: t.title,
      description: t.slug,
      content: t.content,
      isActive: t.isPublished,
      createdBy: `${t.user.firstName} ${t.user.lastName}`,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: formattedTemplates,
      total: formattedTemplates.length,
    })
  } catch (error) {
    console.error('[TEMPLATES GET] Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
