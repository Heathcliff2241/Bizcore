import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Prisma } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'

type RouteParamsResult = { id: string; revisionId: string } | Promise<{ id: string; revisionId: string }>

interface RouteContext {
  params: RouteParamsResult
}

async function resolveParams(params: RouteParamsResult) {
  if (typeof (params as Promise<{ id: string; revisionId: string }>).then === 'function') {
    return params as Promise<{ id: string; revisionId: string }>
  }
  return params as { id: string; revisionId: string }
}

export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id, revisionId } = await resolveParams(context.params)
    const pageId = Number.parseInt(id, 10)
    const revisionRecordId = Number.parseInt(revisionId, 10)

    if (Number.isNaN(pageId) || Number.isNaN(revisionRecordId)) {
      return NextResponse.json({ message: 'Invalid identifiers' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await resolveTenant(session)
    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
    }

    const page = await prisma.pageDesign.findFirst({
      where: { id: pageId, tenantId: tenant.id }
    })

    if (!page) {
      return NextResponse.json({ message: 'Page not found' }, { status: 404 })
    }

    const revision = await prisma.pageDesignRevision.findFirst({
      where: { id: revisionRecordId, pageDesignId: pageId }
    })

    if (!revision) {
      return NextResponse.json({ message: 'Revision not found' }, { status: 404 })
    }

    const latestRevision = await prisma.pageDesignRevision.findFirst({
      where: { pageDesignId: pageId },
      orderBy: { revisionNumber: 'desc' }
    })
    const nextRevisionNumber = (latestRevision?.revisionNumber ?? 0) + 1

    await prisma.pageDesignRevision.create({
      data: {
        pageDesignId: pageId,
        content: page.content as Prisma.InputJsonValue,
        revisionNumber: nextRevisionNumber,
        changeDescription: `Restored from revision #${revision.revisionNumber}`,
        createdBy: Number(session.user.id)
      }
    })

    const restoredPage = await prisma.pageDesign.update({
      where: { id: pageId },
      data: {
        content: revision.content as Prisma.InputJsonValue,
        isDraft: true,
        isPublished: false,
        publishedAt: null,
        updatedAt: new Date()
      },
      include: {
        seoSettings: true
      }
    })

    return NextResponse.json({
      success: true,
      data: restoredPage,
      message: 'Revision restored successfully'
    })
  } catch (error) {
    console.error('Failed to restore revision:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to restore revision' },
      { status: 500 }
    )
  }
}