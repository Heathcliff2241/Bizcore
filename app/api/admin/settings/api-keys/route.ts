import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'

// Store API keys in memory for demo (in production use database)
interface ApiKey {
  id: string
  key: string
  name: string
  createdAt: string
}

// eslint-disable-next-line prefer-const
let apiKeys: ApiKey[] = []

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Don't return full keys, just metadata
    const keys = apiKeys.map(({ id, name, createdAt, key }) => ({
      id,
      name,
      key: `${key.substring(0, 10)}...${key.substring(key.length - 10)}`,
      createdAt,
    }))

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate API key
    const key = `sk_${crypto.randomBytes(32).toString('hex')}`
    const id = crypto.randomUUID()

    apiKeys.push({
      id,
      key,
      name,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ id, key, name })
  } catch (error) {
    console.error('Error generating API key:', error)
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    )
  }
}
