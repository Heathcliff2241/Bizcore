import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// API keys store (same as in parent route - in production use database)
// eslint-disable-next-line prefer-const
let apiKeys: Array<{ id: string; key: string; name: string; createdAt: string }> = []

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keyId = params.id

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
    }

    // Find and remove the key
    const index = apiKeys.findIndex((k) => k.id === keyId)

    if (index === -1) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    apiKeys.splice(index, 1)

    return NextResponse.json({ success: true, deletedKeyId: keyId })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}
