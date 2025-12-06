import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as {
      employeeId: number
      tenantId: number
      role: string
    }
  } catch {
    return null
  }
}

// POST /api/pos/sessions - Start a new POS session
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { openingCash } = body

    // Check if there's an active session for this employee
    const activeSession = await prisma.pOSSession.findFirst({
      where: {
        employeeId: decoded.employeeId,
        isActive: true
      }
    })

    if (activeSession) {
      return NextResponse.json(
        { error: 'You already have an active session', session: activeSession },
        { status: 409 }
      )
    }

    // Create new session
    const session = await prisma.pOSSession.create({
      data: {
        employeeId: decoded.employeeId,
        tenantId: decoded.tenantId,
        openingCash: openingCash || 0,
        isActive: true
      }
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error starting POS session:', error)
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
  }
}

// GET /api/pos/sessions - Get active session for employee
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await prisma.pOSSession.findFirst({
      where: {
        employeeId: decoded.employeeId,
        isActive: true
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error fetching POS session:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}
