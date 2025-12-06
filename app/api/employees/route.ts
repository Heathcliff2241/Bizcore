import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logTenantActivity } from '@/lib/activityLogger'
import bcrypt from 'bcryptjs'

// GET /api/employees - List all employees for tenant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ownerId = Number(session.user.id)
    if (!Number.isFinite(ownerId)) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')?.toLowerCase()

    // Get tenant for this user
    let tenant = null

    if (subdomain) {
      tenant = await prisma.tenant.findUnique({
        where: { subdomain }
      })

      if (!tenant || tenant.ownerId !== ownerId) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }
    } else {
      tenant = await prisma.tenant.findFirst({
        where: { ownerId }
      })
    }

    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
    }

    const employees = await prisma.employee.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ employees })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ownerId = Number(session.user.id)
    if (!Number.isFinite(ownerId)) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')?.toLowerCase()

    // Get tenant for this user
    let tenant = null

    if (subdomain) {
      tenant = await prisma.tenant.findUnique({
        where: { subdomain }
      })

      if (!tenant || tenant.ownerId !== ownerId) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }
    } else {
      tenant = await prisma.tenant.findFirst({
        where: { ownerId }
      })
    }

    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
    }

    const body = await request.json()
    const { firstName, lastName, email, password, pin, role } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if employee with this email already exists for this tenant
    const existing = await prisma.employee.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: email.toLowerCase()
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Employee with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Hash PIN if provided
    let hashedPin = null
    if (pin) {
      hashedPin = await bcrypt.hash(pin, 10)
    }

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        tenantId: tenant.id,
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        pin: hashedPin,
        role: role || 'cashier',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    // Log employee creation
    await logTenantActivity(
      tenant.id,
      'EMPLOYEE_CREATED',
      ownerId,
      {
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        role: employee.role,
      }
    )

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
