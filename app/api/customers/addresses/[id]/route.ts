import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Address {
  id: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface Params {
  id: string
}

// PATCH - update address
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const customer = await prisma.customer.findFirst({
      where: { email: session.user.email }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const addresses = (customer.address as Address[] | null) || []
    const addressIndex = addresses.findIndex(addr => addr.id === id)

    if (addressIndex === -1) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    addresses[addressIndex] = { ...addresses[addressIndex], ...body }

    await prisma.customer.update({
      where: { id: customer.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { address: addresses as any }
    })

    return NextResponse.json({ address: addresses[addressIndex] })
  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
  }
}

// DELETE - delete address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const customer = await prisma.customer.findFirst({
      where: { email: session.user.email }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const addresses = (customer.address as Address[] | null) || []
    const addressIndex = addresses.findIndex(addr => addr.id === id)

    if (addressIndex === -1) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    addresses.splice(addressIndex, 1)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.customer.update({
      where: { id: customer.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { address: addresses as any }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}
