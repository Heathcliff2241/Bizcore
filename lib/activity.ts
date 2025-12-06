/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from './prisma';

export type ActivityAction = 
  | 'TENANT_CREATED'
  | 'TENANT_UPDATED'
  | 'TENANT_DELETED'
  | 'TENANT_SUBSCRIPTION_UPDATED'
  | 'TENANT_SUBSCRIPTION_CANCELED'
  | 'TENANT_LOGIN'
  | 'TENANT_LOGOUT'
  | 'PAGE_CREATED'
  | 'PAGE_UPDATED'
  | 'PAGE_DELETED'
  | 'PAGE_PUBLISHED'
  | 'PAGE_DESIGN_UPDATED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_VERIFIED'
  | 'CUSTOMER_SIGNUP'
  | 'CUSTOMER_LOGIN'
  | 'CUSTOMER_LOGOUT'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_SIGNUP'
  | 'SETTINGS_UPDATED';

export interface ActivityLogData {
  userId?: number | null;
  tenantId?: number | null;
  action: ActivityAction;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Log an activity to the activity log
 */
export async function logActivity(data: ActivityLogData) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: data.userId || null,
        tenantId: data.tenantId || null,
        action: data.action,
        details: data.details || {},
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  } catch (error) {
    console.error('[ActivityLog] Failed to log activity:', error);
    // Don't throw - activity logging is non-critical
  }
}

/**
 * Get recent activities for a tenant
 */
export async function getTenantActivities(tenantId: number, limit: number = 50) {
  try {
    return await prisma.activityLog.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('[ActivityLog] Failed to get tenant activities:', error);
    return [];
  }
}

/**
 * Get recent activities for the admin dashboard
 */
export async function getAdminActivities(limit: number = 100) {
  try {
    return await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('[ActivityLog] Failed to get admin activities:', error);
    return [];
  }
}

/**
 * Get activities by action type
 */
export async function getActivitiesByAction(action: ActivityAction, limit: number = 50) {
  try {
    return await prisma.activityLog.findMany({
      where: { action },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('[ActivityLog] Failed to get activities by action:', error);
    return [];
  }
}
