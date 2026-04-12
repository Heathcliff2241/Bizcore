import { NextResponse, NextRequest } from 'next/server'
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

// GET - fetch customer's addresses
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let customer
    if (session.user.id) {
      customer = await prisma.customer.findUnique({
        where: { id: parseInt(session.user.id) }
      })
    } else {
      customer = await prisma.customer.findFirst({
        where: { email: session.user.email }
      })
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const addresses = (customer.address as Address[] | null) || []
    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

// POST - create new address
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let customer
    if (session.user.id) {
      customer = await prisma.customer.findUnique({
        where: { id: parseInt(session.user.id) }
      })
    } else {
      customer = await prisma.customer.findFirst({
        where: { email: session.user.email }
      })
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const body = await req.json()
    const { line1, line2, city, state, postalCode, country } = body

    if (!line1 || !city || !state || !postalCode || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const addresses = (customer.address as Address[] | null) || []
    const newAddress: Address = {
      id: Date.now().toString(),
      line1,
      line2: line2 || undefined,
      city,
      state,
      postalCode,
      country
    }

    const updatedAddresses = [...addresses, newAddress]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.customer.update({
      where: { id: customer.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { address: updatedAddresses as any }
    })

    return NextResponse.json({ address: newAddress }, { status: 201 })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 })
  }
}
