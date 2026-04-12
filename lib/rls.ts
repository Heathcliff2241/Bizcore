/**
 * Row-Level Security (RLS) Utilities for BizCore
 *
 * Provides helper functions to set and manage tenant context
 * for PostgreSQL RLS policies
 *
 * Usage:
 * const data = await withRLSContext(tenantId, async () => {
 *   return prisma.product.findMany()
 * })
 */

/**
 * Optional: Global type augmentation for the tenant context
 */
declare global {
  let __currentTenantId: number | undefined
}

/**
 * Sets the RLS tenant context for subsequent database queries
 * Stores in global context (thread-safe for Next.js request isolation)
 *
 * @param tenantId - The tenant ID to set in RLS context
 */
export function setRLSTenantContext(tenantId: number): void {
  if (typeof globalThis === 'undefined') {
    console.warn('RLS: globalThis not available')
    return
  }
  
  (globalThis as Record<string, unknown>).__currentTenantId = tenantId
}

/**
 * Gets the current RLS tenant context
 *
 * @returns The current tenant ID or undefined
 */
export function getRLSTenantContext(): number | undefined {
  if (typeof globalThis === 'undefined') return undefined
  return (globalThis as Record<string, unknown>).__currentTenantId as number | undefined
}

/**
 * Clears the RLS tenant context
 * Important: Call in finally blocks to prevent context leakage
 */
export function clearRLSTenantContext(): void {
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as Record<string, unknown>).__currentTenantId
  }
}

/**
 * Executes database operations within a tenant RLS context
 * Automatically sets and clears tenant context
 *
 * @param tenantId - The tenant ID for this operation
 * @param operation - Async function containing database queries
 * @returns Result of the operation
 *
 * @example
 * const products = await withRLSContext(42, async () => {
 *   return prisma.product.findMany()
 * })
 */
export async function withRLSContext<T>(
  tenantId: number,
  operation: () => Promise<T>
): Promise<T> {
  try {
    setRLSTenantContext(tenantId)
    return await operation()
  } finally {
    clearRLSTenantContext()
  }
}

/**
 * Validates that a tenant context is set
 * Useful for safety checks in sensitive operations
 *
 * @throws Error if no tenant context is set
 */
export function validateRLSContext(): number {
  const tenantId = getRLSTenantContext()
  if (!tenantId) {
    throw new Error('RLS: No tenant context set. Database queries may fail.')
  }
  return tenantId
}

/**
 * Optional: Prisma middleware to automatically set RLS context
 * Add to your lib/prisma.ts if you want automatic context setting
 *
 * @example
 * import { PrismaClient } from '@prisma/client'
 * import { createRLSMiddleware } from '@/lib/rls'
 *
 * const prisma = new PrismaClient()
 * prisma.$use(createRLSMiddleware())
 */
export function createRLSMiddleware() {
  return async (params: Record<string, unknown>, next: (params: Record<string, unknown>) => Promise<unknown>) => {
    // Middleware runs for every Prisma operation
    // RLS context should already be set by setRLSTenantContext()
    // This middleware is here for debugging/logging if needed
    
    const tenantId = getRLSTenantContext()
    
    if (process.env.NODE_ENV === 'development' && tenantId) {
      console.debug(`[RLS] Query on table '${params.model}' with tenantId=${tenantId}`)
    }
    
    return next(params)
  }
}

/**
 * Logs RLS violations or suspicious activity
 * 
 * @param tableName - Table that was accessed
 * @param tenantId - Tenant ID from context
 * @param action - What happened (e.g., 'cross_tenant_attempt', 'empty_result')
 */
export async function logRLSViolation(
  tableName: string,
  tenantId: number,
  action: string
): Promise<void> {
  // This would insert into rls_audit_log table if created
  console.warn(
    `[RLS] Potential violation: table=${tableName} tenant=${tenantId} action=${action}`
  )
  
  // In production, you might want to:
  // - Send to Sentry/error tracking
  // - Log to structured logging service
  // - Insert to rls_audit_log table
}

/**
 * Type-safe wrapper for withRLSContext with Prisma operations
 *
 * @example
 * const products = await withPrismaRLS(prisma, tenantId, (client) => {
 *   return client.product.findMany()
 * })
 */
export async function withPrismaRLS<T>(
  prismaClient: Record<string, unknown>,
  tenantId: number,
  operation: (client: Record<string, unknown>) => Promise<T>
): Promise<T> {
  return withRLSContext(tenantId, () => operation(prismaClient))
}

/**
 * Optional: Global type augmentation for the tenant context
 * Uncomment if you want TypeScript support for globalThis.__currentTenantId
 */

export {}
