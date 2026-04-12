import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/admin/export/users
 * Export all users as CSV (includes Users, Customers, Employees, and Tenants)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[EXPORT USERS] Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email
    })
    
    if (!session?.user?.id) {
      console.error('[EXPORT USERS] No user ID in session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin') {
      console.error('[EXPORT USERS] User role is not admin:', session.user.role)
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    // Build filter conditions
    const userWhere: Record<string, unknown> = {}
    const customerWhere: Record<string, unknown> = {}
    const employeeWhere: Record<string, unknown> = {}
    const tenantWhere: Record<string, unknown> = {}

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
      tenantWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      userWhere.isActive = true
      customerWhere.isActive = true
      employeeWhere.isActive = true
      tenantWhere.isActive = true
    } else if (status === 'inactive') {
      userWhere.isActive = false
      customerWhere.isActive = false
      employeeWhere.isActive = false
      tenantWhere.isActive = false
    }

    // Fetch all user types (no pagination for export)
    const [systemUsers, customers, employees, tenants] = await Promise.all([
      !role || (role && role !== 'customer' && role !== 'employee' && role !== 'tenant') 
        ? prisma.user.findMany({
            where: role ? { ...userWhere, role } : { ...userWhere, role: { not: 'tenant_owner' } },
            include: {
              ownedTenants: {
                select: { name: true, subdomain: true },
              },
              tenantUsers: {
                include: {
                  tenant: {
                    select: { name: true, subdomain: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],

      !role || role === 'customer'
        ? prisma.customer.findMany({
            where: customerWhere,
            include: {
              tenant: {
                select: { id: true, name: true, subdomain: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],

      !role || role === 'employee'
        ? prisma.employee.findMany({
            where: employeeWhere,
            include: {
              tenant: {
                select: { id: true, name: true, subdomain: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],

      !role || role === 'tenant'
        ? prisma.tenant.findMany({
            where: tenantWhere,
            select: {
              id: true,
              name: true,
              subdomain: true,
              ownerFirstName: true,
              ownerLastName: true,
              ownerEmail: true,
              isActive: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
    ])

    console.log('[EXPORT USERS] Fetched data:', {
      systemUserCount: systemUsers.length,
      customerCount: customers.length,
      employeeCount: employees.length,
      tenantCount: tenants.length
    })

    console.log('[EXPORT USERS] Sample customer:', customers[0])
    console.log('[EXPORT USERS] Sample employee:', employees[0])
    console.log('[EXPORT USERS] Sample tenant:', tenants[0])

    // Format system users
    console.log('[EXPORT USERS] Starting format of system users')
    const formattedSystemUsers = systemUsers.map((user) => {
      const ownedTenants = user.ownedTenants.map((t) => t.name).join(', ')
      const memberTenants = user.tenantUsers.map((tu) => tu.tenant.name).join(', ')
      const allTenants = [ownedTenants, memberTenants].filter(Boolean).join(', ')

      return {
        id: user.id,
        email: user.email,
        first_name: user.firstName || 'N/A',
        last_name: user.lastName || 'N/A',
        role: user.role,
        status: user.isActive ? 'Active' : 'Inactive',
        phone: user.phone || 'N/A',
        tenants: allTenants || 'None',
        owned_tenants_count: user.ownedTenants.length,
        member_tenants_count: user.tenantUsers.length,
        email_verified: user.emailVerified ? 'Yes' : 'No',
        created_at: user.createdAt.toISOString(),
        last_login: user.lastLogin ? user.lastLogin.toISOString() : 'Never',
      }
    })
    console.log('[EXPORT USERS] Formatted system users')

    // Format customers
    console.log('[EXPORT USERS] Starting format of customers')
    const formattedCustomers = customers.map((customer) => {
      try {
        return {
          id: customer.id,
          email: customer.email || 'N/A',
          first_name: customer.firstName || 'N/A',
          last_name: customer.lastName || 'N/A',
          role: 'customer',
          status: customer.isActive ? 'Active' : 'Inactive',
          phone: customer.phone || 'N/A',
          tenants: customer.tenant?.name || 'None',
          owned_tenants_count: 0,
          member_tenants_count: 1,
          email_verified: customer.emailVerified ? 'Yes' : 'No',
          created_at: customer.createdAt.toISOString(),
          last_login: customer.lastLogin ? customer.lastLogin.toISOString() : 'Never',
        }
      } catch (e) {
        console.error('[EXPORT USERS] Error formatting customer:', { customerId: customer.id, error: e })
        throw e
      }
    })
    console.log('[EXPORT USERS] Formatted customers')

    // Format employees
    console.log('[EXPORT USERS] Starting format of employees')
    const formattedEmployees = employees.map((employee) => {
      try {
        return {
          id: employee.id,
          email: employee.email || 'N/A',
          first_name: employee.firstName || 'N/A',
          last_name: employee.lastName || 'N/A',
          role: 'employee',
          status: employee.isActive ? 'Active' : 'Inactive',
          phone: 'N/A',
          tenants: employee.tenant?.name || 'None',
          owned_tenants_count: 0,
          member_tenants_count: 1,
          email_verified: 'N/A',
          created_at: employee.createdAt.toISOString(),
          last_login: employee.lastLogin ? employee.lastLogin.toISOString() : 'Never',
        }
      } catch (e) {
        console.error('[EXPORT USERS] Error formatting employee:', { employeeId: employee.id, error: e })
        throw e
      }
    })
    console.log('[EXPORT USERS] Formatted employees')

    // Format tenants
    console.log('[EXPORT USERS] Starting format of tenants')
    const formattedTenants = tenants.map((tenant) => ({
      id: tenant.id,
      email: tenant.ownerEmail || 'N/A',
      first_name: tenant.ownerFirstName || 'N/A',
      last_name: tenant.ownerLastName || 'N/A',
      role: 'tenant',
      status: tenant.isActive ? 'Active' : 'Inactive',
      phone: 'N/A',
      tenants: tenant.name,
      owned_tenants_count: 1,
      member_tenants_count: 0,
      email_verified: 'Yes',
      created_at: tenant.createdAt.toISOString(),
      last_login: 'N/A',
    }))
    console.log('[EXPORT USERS] Formatted tenants')

    // Combine all users
    console.log('[EXPORT USERS] Combining all formatted data')
    const exportData = [
      ...formattedSystemUsers,
      ...formattedCustomers,
      ...formattedEmployees,
      ...formattedTenants,
    ]

    // Sort by creation date (most recent first)
    console.log('[EXPORT USERS] Sorting export data')
    exportData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log('[EXPORT USERS] Success! Returning', exportData.length, 'records')
    return NextResponse.json(exportData)
  } catch (error) {
    console.error('[EXPORT USERS] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ error: 'Failed to export users' }, { status: 500 })
  }
}


