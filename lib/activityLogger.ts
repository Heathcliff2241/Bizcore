import { prisma } from '@/lib/prisma'

export interface LogActivityParams {
  userId?: number
  tenantId?: number
  action: string
  details?: Record<string, unknown> | null
  ipAddress?: string
  userAgent?: string
}

/**
 * Normalize user roles - treat tenant_owner and tenant as one (tenant)
 * Maps: tenant_owner → tenant, all others stay the same
 */
export function normalizeUserRole(role: string): string {
  if (role === 'tenant_owner') {
    return 'tenant'
  }
  return role
}

/**
 * Log an activity to the database
 * Use this for audit trails and monitoring important actions
 */
export async function logActivity({
  userId,
  tenantId,
  action,
  details,
  ipAddress,
  userAgent
}: LogActivityParams) {
  try {
    const detailsValue = details ? JSON.parse(JSON.stringify(details)) : null
    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        tenantId: tenantId || null,
        action,
        details: detailsValue,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      }
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw - logging failures shouldn't crash the app
  }
}

/**
 * Log tenant-related activities
 */
export async function logTenantActivity(
  tenantId: number,
  action: string,
  userId?: number,
  details?: Record<string, unknown>
) {
  return logActivity({
    tenantId,
    userId,
    action,
    details
  })
}

/**
 * Log user-related activities
 */
export async function logUserActivity(
  userId: number,
  action: string,
  tenantId?: number,
  details?: Record<string, unknown>
) {
  return logActivity({
    userId,
    tenantId,
    action,
    details
  })
}

/**
 * Extract IP address from request headers
 */
export function getClientIp(request: Request | undefined): string | undefined {
  if (!request) return undefined
  
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return request.headers.get('x-client-ip') || undefined
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(request: Request | undefined): string | undefined {
  if (!request) return undefined
  return request.headers.get('user-agent') || undefined
}
