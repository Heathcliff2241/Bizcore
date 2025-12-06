import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logUserActivity } from '@/lib/activityLogger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build filter conditions for system users
    const userWhere: Record<string, unknown> = {}
    const customerWhere: Record<string, unknown> = {}
    const employeeWhere: Record<string, unknown> = {}

    if (search) {
      userWhere.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
      customerWhere.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
      employeeWhere.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      userWhere.isActive = true
      customerWhere.isActive = true
      employeeWhere.isActive = true
    } else if (status === 'inactive') {
      userWhere.isActive = false
      customerWhere.isActive = false
      employeeWhere.isActive = false
    }

    // Fetch all user types (including tenants)
    const [systemUsers, customers, employees, tenants] = await Promise.all([
      !role || (role && role !== 'customer' && role !== 'employee' && role !== 'tenant') ? prisma.user.findMany({
        where: role ? { ...userWhere, role } : { ...userWhere, role: { not: 'tenant_owner' } }, // Exclude tenant_owner since they're in Tenant model
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }) : [],

      !role || role === 'customer' ? prisma.customer.findMany({
        where: customerWhere,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }) : [],

      !role || role === 'employee' ? prisma.employee.findMany({
        where: employeeWhere,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }) : [],

      !role || role === 'tenant' ? prisma.tenant.findMany({
        where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
        select: {
          id: true,
          name: true,
          subdomain: true,
          isActive: true,
          createdAt: true,
          owner: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }) : [],
    ])

    // Transform customers to match user format
    const transformedCustomers = customers.map((c) => ({
      id: `customer-${c.id}`,
      email: c.email || '',
      firstName: c.firstName,
      lastName: c.lastName,
      role: 'customer' as const,
      isActive: c.isActive,
      createdAt: c.createdAt,
      tenant: c.tenant,
    }))

    // Transform employees to match user format
    const transformedEmployees = employees.map((e) => ({
      id: `employee-${e.id}`,
      email: e.email,
      firstName: e.firstName,
      lastName: e.lastName,
      role: 'employee' as const,
      isActive: e.isActive,
      createdAt: e.createdAt,
      tenant: e.tenant,
    }))

    // Transform tenants to match user format
    const transformedTenants = tenants.map((t) => ({
      id: `tenant-${t.id}`,
      email: t.owner?.email || '',
      firstName: t.owner?.firstName || t.name,
      lastName: t.owner?.lastName || t.subdomain,
      role: 'tenant' as const,
      isActive: t.isActive,
      createdAt: t.createdAt,
      tenant: { id: t.id, name: t.name, subdomain: t.subdomain },
    }))

    // Combine and sort all users
    const allUsers = [...systemUsers, ...transformedCustomers, ...transformedEmployees, ...transformedTenants].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Get total count for pagination
    const [totalSystemUsers, totalCustomers, totalEmployees, totalTenants] = await Promise.all([
      !role || (role && role !== 'customer' && role !== 'employee' && role !== 'tenant') ? prisma.user.count({ where: role ? { ...userWhere, role } : { ...userWhere, role: { not: 'tenant_owner' } } }) : Promise.resolve(0),
      !role || role === 'customer' ? prisma.customer.count({ where: customerWhere }) : Promise.resolve(0),
      !role || role === 'employee' ? prisma.employee.count({ where: employeeWhere }) : Promise.resolve(0),
      !role || role === 'tenant' ? prisma.tenant.count({ where: search ? { name: { contains: search, mode: 'insensitive' } } : {} }) : Promise.resolve(0),
    ])

    const total = totalSystemUsers + totalCustomers + totalEmployees + totalTenants

    // Apply pagination to combined results
    const paginatedUsers = allUsers.slice(skip, skip + limit)

    return NextResponse.json({
      users: paginatedUsers,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const userId = url.pathname.split('/').pop()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const body = await request.json()
    const { firstName, lastName, role, isActive } = body

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    })

    // Log the activity
    await logUserActivity(
      Number(userId),
      'USER_UPDATED',
      undefined,
      {
        changes: [firstName && 'firstName', lastName && 'lastName', role && 'role', isActive !== undefined && 'isActive'].filter(Boolean),
        newRole: role,
        newStatus: isActive !== undefined ? (isActive ? 'active' : 'inactive') : undefined
      }
    )

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
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
    const { email, firstName, lastName, role, password } = body

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // In production, hash the password
    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role: role || 'user',
        password, // TODO: Hash password in production
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Log the activity
    await logUserActivity(
      newUser.id,
      'USER_CREATED',
      undefined,
      {
        email,
        role: newUser.role,
        firstName,
        lastName
      }
    )

    return NextResponse.json(newUser)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
