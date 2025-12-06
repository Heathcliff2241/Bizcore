import { prisma } from '@/lib/prisma'
import { logTenantActivity } from '@/lib/activityLogger'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const plan = searchParams.get('plan')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (plan) where.subscriptionPlan = plan
    if (status) where.isActive = status === 'active'
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch tenants with related data
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          _count: {
            select: {
              tenantUsers: true,
              employees: true,
              products: true,
              orders: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tenant.count({ where })
    ])

    // Calculate revenue per tenant
    const tenantsWithRevenue = await Promise.all(
      tenants.map(async (tenant) => {
        const orders = await prisma.order.findMany({
          where: { tenantId: tenant.id },
          select: { total: true }
        })
        const revenue = orders.reduce((sum, order) => sum + order.total, 0)

        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          domain: tenant.domain,
          plan: tenant.subscriptionPlan,
          isActive: tenant.isActive,
          owner: tenant.owner,
          users: tenant._count.tenantUsers,
          employees: tenant._count.employees,
          products: tenant._count.products,
          orders: tenant._count.orders,
          revenue: Math.round(revenue * 100) / 100,
          subscriptionExpires: tenant.subscriptionExpires,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt
        }
      })
    )

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: tenantsWithRevenue,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, subdomain, ownerId, plan = 'free', primaryColor, secondaryColor } = body

    // Validate inputs
    if (!name || !subdomain || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if subdomain already exists
    const existing = await prisma.tenant.findUnique({
      where: { subdomain }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Subdomain already exists' },
        { status: 409 }
      )
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        subdomain,
        ownerId,
        subscriptionPlan: plan,
        primaryColor: primaryColor || '#10b981',
        secondaryColor: secondaryColor || '#059669',
        isActive: true
      },
      include: {
        owner: true
      }
    })

    // Log the activity
    await logTenantActivity(
      tenant.id,
      'TENANT_CREATED',
      ownerId,
      {
        tenantName: name,
        subdomain,
        plan,
        ownerEmail: tenant.owner?.email
      }
    )

    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}
