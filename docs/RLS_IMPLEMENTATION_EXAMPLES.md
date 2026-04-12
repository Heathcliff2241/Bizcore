/**
 * Example: RLS Implementation in API Routes
 *
 * This file shows how to integrate RLS into your existing BizCore routes
 * Copy patterns from this file to update your actual API routes
 *
 * Location: Copy these patterns to:
 * - /app/api/tenant/ routes
 * - /app/api/pos/ routes
 * - /app/dashboard/ routes
 * - Any route that accesses tenant-scoped data
 */

import { NextRequest, NextResponse } from 'next/server'
import { withRLSContext } from '@/lib/rls'
// Note: Update prisma import path based on your actual structure
// import prisma from '@/lib/prisma'

/**
 * PATTERN 1: Simple GET with RLS
 *
 * This is the most common pattern - fetch data for current tenant
 */
export async function GET_products_example(
  req: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    // 1. Get tenant from subdomain
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.subdomain }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // 2. Verify request is authorized (user owns/manages tenant)
    // This should check session, user.role, or tenantUsers table
    // Skipped here for brevity

    // 3. Execute query within RLS context
    const products = await withRLSContext(tenant.id, async () => {
      return prisma.product.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { sortOrder: 'asc' }
      })
      // ↑ RLS automatically adds: WHERE tenantId = tenant.id
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  // No finally needed - withRLSContext clears context automatically
}

/**
 * PATTERN 2: POST with RLS (Create operation)
 *
 * Example: Create new product for tenant
 */
export async function POST_product_example(
  req: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.subdomain }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await req.json()

    // Create within RLS context
    const product = await withRLSContext(tenant.id, async () => {
      return prisma.product.create({
        data: {
          tenantId: tenant.id, // Include tenantId in creation
          name: body.name,
          price: body.price,
          categoryId: body.categoryId,
          isActive: true
        }
      })
      // ↑ RLS WITH CHECK ensures: tenantId = tenant.id
      // If you try to create with different tenantId, RLS will reject it
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATTERN 3: Multiple operations in one request
 *
 * Example: Get orders AND customers for dashboard
 */
export async function GET_dashboard_example(
  req: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.subdomain }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Execute ALL queries within same RLS context
    const [orders, customers, revenue] = await withRLSContext(tenant.id, async () => {
      return Promise.all([
        // Query 1: Orders
        prisma.order.findMany({
          where: { status: 'completed' },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        // Query 2: Customers
        prisma.customer.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        // Query 3: Aggregation
        prisma.order.aggregate({
          where: { status: 'completed' },
          _sum: { total: true }
        })
      ])
      // ↑ All 3 queries automatically filtered by tenantId = tenant.id
    })

    return NextResponse.json({
      orders,
      customers,
      totalRevenue: revenue._sum.total || 0
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATTERN 4: Manual context management (if withRLSContext doesn't fit)
 *
 * Example: Complex operation with custom error handling
 */
export async function DELETE_product_example(
  req: NextRequest,
  { params }: { params: { subdomain: string; id: string } }
) {
  const { setRLSTenantContext, clearRLSTenantContext } = await import('@/lib/rls')

  let tenant = null
  try {
    // Get tenant
    tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.subdomain }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // MANUALLY set RLS context
    setRLSTenantContext(tenant.id)

    // Check if product exists (with RLS applied)
    const product = await prisma.product.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!product) {
      // This could be "not found" or "access denied by RLS"
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete (with RLS applied)
    await prisma.product.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    // ALWAYS clear context
    clearRLSTenantContext()
  }
}

/**
 * PATTERN 5: POS-specific example (multi-step authentication)
 *
 * Example: POS employee login with RLS
 */
export async function POST_pos_login_example(
  req: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const { email } = await req.json()

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.subdomain }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Find employee within RLS context
    const employee = await withRLSContext(tenant.id, async () => {
      return prisma.employee.findUnique({
        where: { tenantId_email: { tenantId: tenant.id, email } }
      })
      // ↑ RLS ensures: only returns employees from this tenant
    })

    if (!employee) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password...
    // Create session...
    // Return token...

    return NextResponse.json({
      token: 'jwt_token_here',
      employee: { id: employee.id, email: employee.email }
    })
  } catch (error) {
    console.error('POS login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * MIGRATION CHECKLIST
 *
 * Follow this checklist to add RLS to your routes:
 *
 * STEP 1: Update a route
 * - [ ] Find your API route file
 * - [ ] Import { withRLSContext } from '@/lib/rls'
 * - [ ] Get tenant from subdomain/header/params
 * - [ ] Wrap database operations in withRLSContext()
 * - [ ] Test with 2+ different tenants to ensure isolation
 *
 * STEP 2: Run migration
 * - [ ] npm run db:migrate
 * - [ ] Verify RLS is enabled: SELECT * FROM pg_policies;
 *
 * STEP 3: Test
 * - [ ] Local: Create products in tenant A, verify can't access from tenant B
 * - [ ] Staging: Load test with RLS enabled
 * - [ ] Production: Deploy and monitor errors
 *
 * STEP 4: Repeat for all routes
 * Priority:
 * 1. Data access routes (/api/tenant/*)
 * 2. Financial routes (/api/payments/*, /api/subscriptions/*)
 * 3. Auth routes (/api/auth/*)
 * 4. Content routes (/api/products/*, /api/orders/*)
 *
 * COMMON MISTAKES TO AVOID
 *
 * ❌ DON'T: Forget to call withRLSContext()
 * ✅ DO:   Wrap all data queries in withRLSContext(tenantId, ...)
 *
 * ❌ DON'T: Set context but forget to clear it
 * ✅ DO:   Use withRLSContext() or finally { clearRLSTenantContext() }
 *
 * ❌ DON'T: Trust client's tenant ID
 * ✅ DO:   Validate user owns/manages tenant before setting context
 *
 * ❌ DON'T: Query without setting context first
 * ✅ DO:   Always set context before any database query
 *
 * ❌ DON'T: Ignore RLS errors
 * ✅ DO:   Log and monitor RLS violations
 */
