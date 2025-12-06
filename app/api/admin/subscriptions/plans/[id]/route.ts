import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, price, billingCycle, features } = body

    // Check if plan exists
    const existingPlan = await prisma.plan.findUnique({
      where: { id: params.id },
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Update plan
    const updatedPlan = await prisma.plan.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(billingCycle && { billingCycle }),
        ...(features && { features }),
      },
    })

    return NextResponse.json({
      id: updatedPlan.id,
      name: updatedPlan.name,
      price: updatedPlan.price,
      billingCycle: updatedPlan.billingCycle,
      description: updatedPlan.description,
      features: updatedPlan.features,
      tenantCount: 0,
      isActive: updatedPlan.isActive,
    })
  } catch (error) {
    console.error('Error updating subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if plan exists
    const existingPlan = await prisma.plan.findUnique({
      where: { id: params.id },
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Check if any subscriptions use this plan
    const subscriptionsCount = await prisma.subscription.count({
      where: { planId: params.id },
    })

    if (subscriptionsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete plan with ${subscriptionsCount} active subscription(s)` },
        { status: 400 }
      )
    }

    // Delete plan
    await prisma.plan.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, deletedPlanId: params.id })
  } catch (error) {
    console.error('Error deleting subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription plan' },
      { status: 500 }
    )
  }
}
