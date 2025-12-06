import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      console.warn('[GET /api/admin/subscriptions/plans] No session or user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      console.warn(`[GET /api/admin/subscriptions/plans] User role is not admin: ${session.user.role}`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch plans from database
    const plans = await prisma.plan.findMany({
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json({
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
        description: plan.description,
        features: plan.features,
        tenantCount: 0,
        isActive: plan.isActive,
      })),
    })
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, price, billingCycle, features } = body

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      )
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        price: price || 0,
        billingCycle: billingCycle || 'monthly',
        features: features || [],
        isActive: true,
        displayOrder: await getMaxDisplayOrder() + 1,
      },
    })

    return NextResponse.json(
      {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
        description: plan.description,
        features: plan.features,
        tenantCount: 0,
        isActive: plan.isActive,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    )
  }
}

async function getMaxDisplayOrder() {
  const maxPlan = await prisma.plan.findFirst({
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  })
  return maxPlan?.displayOrder || 0
}
