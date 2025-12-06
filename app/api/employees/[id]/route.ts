import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logTenantActivity } from '@/lib/activityLogger'
import bcrypt from 'bcryptjs'

// GET /api/employees/[id] - Get single employee
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
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

    const employee = await prisma.employee.findFirst({
      where: {
        id: Number(id),
        tenantId: tenant.id
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ employee })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

// PUT /api/employees/[id] - Update employee
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
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
    const { firstName, lastName, email, password, pin, role, isActive } = body

    // Check if employee exists and belongs to this tenant
    const existing = await prisma.employee.findFirst({
      where: {
        id: Number(id),
        tenantId: tenant.id
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    if (typeof firstName === 'string' && firstName.trim().length > 0) {
      updateData.firstName = firstName.trim()
    }

    if (typeof lastName === 'string' && lastName.trim().length > 0) {
      updateData.lastName = lastName.trim()
    }

    if (typeof email === 'string' && email.trim().length > 0) {
      updateData.email = email.toLowerCase().trim()
    }

    if (typeof role === 'string' && role.trim().length > 0) {
      updateData.role = role.trim()
    }

    if (typeof isActive === 'boolean') updateData.isActive = isActive
    
    if (typeof password === 'string' && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 10)
    }
    
    if (typeof pin === 'string' && pin.length > 0) {
      updateData.pin = await bcrypt.hash(pin, 10)
    }

    const employee = await prisma.employee.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    })

    // Log employee update
    const changes = Object.keys(updateData)
    await logTenantActivity(
      tenant.id,
      'EMPLOYEE_UPDATED',
      ownerId,
      {
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        changedFields: changes,
        newRole: role,
        newStatus: isActive !== undefined ? (isActive ? 'active' : 'inactive') : undefined,
      }
    )

    return NextResponse.json({ employee })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

// DELETE /api/employees/[id] - Delete employee
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
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

    // Check if employee exists and belongs to this tenant
    const existing = await prisma.employee.findFirst({
      where: {
        id: Number(id),
        tenantId: tenant.id
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    await prisma.employee.delete({
      where: { id: Number(id) }
    })

    // Log employee deletion
    await logTenantActivity(
      tenant.id,
      'EMPLOYEE_DELETED',
      ownerId,
      {
        employeeId: existing.id,
        employeeName: `${existing.firstName} ${existing.lastName}`,
        email: existing.email,
        role: existing.role,
      }
    )

    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}
