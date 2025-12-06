import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch dashboard statistics
    const now = new Date()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    const [
      totalTenants,
      activeTenants,
      activeAdminUsers,
      activeSubscriptions,
      recentActivityLogs,
      alerts,
      tenantsLastMonth,
      adminsLastMonth,
      subscriptionsLastMonth,
      totalCustomers,
      totalEmployees
    ] = await Promise.all([
      // Total tenants (all time)
      prisma.tenant.count(),

      // Active tenants (with active status)
      prisma.tenant.count({
        where: {
          isActive: true
        }
      }),

      // Active admin users (super admins that logged in last 30 days)
      prisma.user.count({
        where: {
          role: 'admin',
          lastLogin: {
            gte: thirtyDaysAgo
          }
        }
      }),

      // Active subscriptions (not expired, paying customers)
      prisma.tenant.count({
        where: {
          isActive: true,
          subscriptionExpires: {
            gt: now
          }
        }
      }),

      // Recent activity logs (last 10)
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: true,
          user: true
        }
      }),

      // System alerts - fetch pending payments from admin notifications
      prisma.adminNotification.findMany({
        where: {
          type: 'pending_payment',
          isRead: false,
          isDismissed: false
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Tenants created in previous month (for growth)
      prisma.tenant.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),

      // Admins that logged in previous month (for growth)
      prisma.user.count({
        where: {
          role: 'admin',
          lastLogin: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),

      // Subscriptions active in previous month (for growth)
      prisma.tenant.count({
        where: {
          isActive: true,
          subscriptionExpires: {
            gt: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),

      // Total customers across all tenants
      prisma.customer.count(),

      // Total employees across all tenants
      prisma.employee.count()
    ])

    // Calculate real growth percentages (current period vs previous period)
    const tenantGrowth = tenantsLastMonth > 0
      ? Math.round(((totalTenants - tenantsLastMonth) / tenantsLastMonth) * 100)
      : totalTenants > 0 ? 100 : 0

    const adminGrowth = adminsLastMonth > 0
      ? Math.round(((activeAdminUsers - adminsLastMonth) / adminsLastMonth) * 100)
      : activeAdminUsers > 0 ? 100 : 0

    const subscriptionGrowth = subscriptionsLastMonth > 0
      ? Math.round(((activeSubscriptions - subscriptionsLastMonth) / subscriptionsLastMonth) * 100)
      : activeSubscriptions > 0 ? 100 : 0

    // Map activity logs
    const recentActivity = recentActivityLogs.map(log => ({
      id: log.id,
      action: log.action,
      tenant: log.tenant?.name,
      timestamp: log.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      type: 'update' as const
    }))

    // Map notifications to alerts
    const formattedAlerts = alerts.map(notification => ({
      id: notification.id,
      message: notification.message,
      type: 'warning' as const,
      severity: 'high' as const
    }))

    return NextResponse.json({
      totalTenants,
      activeAdminUsers,
      activeTenants,
      activeSubscriptions,
      totalCustomers,
      totalEmployees,
      tenantGrowth,
      adminGrowth,
      subscriptionGrowth,
      recentActivity,
      alerts: formattedAlerts
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
