import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  console.log('[Template Save] Session:', session?.user)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - must be admin' }, { status: 403 })
  }

  try {
    const { name, description, content } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    const userId = parseInt(session.user.id, 10)
    console.log('[Template Save] Parsed userId:', userId, 'from', session.user.id)
    
    if (isNaN(userId)) {
      console.error('[Template Save] Invalid user ID:', session.user.id)
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Save template to Page table with tenantId = null (admin)
    const newPage = await prisma.page.create({
      data: {
        tenantId: null,
        userId,
        title: name.trim(),
        slug: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: content || JSON.stringify({ sections: [], colors: {}, fonts: {} }),
        isPublished: true,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    })

    const template = {
      id: newPage.id.toString(),
      name: newPage.title,
      description: description?.trim() || '',
      content: newPage.content,
      isActive: newPage.isPublished,
      createdBy: `${newPage.user.firstName} ${newPage.user.lastName}`,
      createdAt: newPage.createdAt.toISOString(),
      updatedAt: newPage.updatedAt.toISOString(),
    }

    console.log('[Template Save] Successfully saved template:', newPage.id)

    return NextResponse.json(
      {
        message: 'Template saved successfully',
        template,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Template Save] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
