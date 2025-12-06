import { NextRequest, NextResponse } from 'next/server'
import { getServerSideTimeRemaining } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const rateLimitKey = `auth_${email}`
  const timeRemaining = getServerSideTimeRemaining(rateLimitKey)

  return NextResponse.json({ timeRemaining })
}