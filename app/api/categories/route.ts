import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)

  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  }

  try {
    const categories = await prisma.category.findMany({
      where: { tenantId: tenant.id },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ success: true, data: { categories } })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)

  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { name, description, image, isActive, sortOrder } = body

    if (!name) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name,
        description,
        image,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0
      }
    })

    return NextResponse.json({ success: true, data: { category } })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ success: false, message: 'Failed to create category' }, { status: 500 })
  }
}
