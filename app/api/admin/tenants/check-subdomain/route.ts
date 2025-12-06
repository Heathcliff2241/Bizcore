import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      )
    }

    // Check if subdomain already exists
    const existing = await prisma.tenant.findUnique({
      where: { subdomain }
    })

    return NextResponse.json({
      available: !existing
    })
  } catch (error) {
    console.error('Error checking subdomain:', error)
    return NextResponse.json(
      { error: 'Failed to check subdomain' },
      { status: 500 }
    )
  }
}
