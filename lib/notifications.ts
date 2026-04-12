import { prisma } from '@/lib/prisma';

interface CreateNotificationParams {
  tenantId: number;
  userId?: number | null;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification for a tenant
 * If userId is not provided, the notification will be visible to all tenant users
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notification = await (prisma.notification as any).create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
        priority: params.priority || 'medium',
        metadata: params.metadata || {},
        status: 'unread',
      },
    });

    console.log(`[Notification] Created: ${params.type} for tenant ${params.tenantId}`);
    return notification;
  } catch (error) {
    console.error('[Notification] Failed to create:', error);
    throw error;
  }
}

/**
 * Create a low stock notification
 */
export async function createLowStockNotification(
  tenantId: number,
  productId: number,
  productName: string,
  currentStock: number,
  threshold: number,
  subdomain: string
) {
  return createNotification({
    tenantId,
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: `${productName} is running low: ${currentStock} units (threshold: ${threshold})`,
    actionUrl: `/dashboard/${subdomain}/catalog`,
    priority: currentStock === 0 ? 'urgent' : 'high',
    metadata: {
      productId,
      productName,
      currentStock,
      threshold,
    },
  });
}

/**
 * Create a new order notification
 */
export async function createNewOrderNotification(
  tenantId: number,
  orderId: number,
  orderNumber: string,
  customerName: string,
  amount: number,
  itemCount: number,
  subdomain: string
) {
  return createNotification({
    tenantId,
    type: 'new_order',
    title: `New Order #${orderNumber}`,
    message: `Order from ${customerName} - ₱${amount.toLocaleString('en-PH')} (${itemCount} items)`,
    actionUrl: `/dashboard/${subdomain}/orders/${orderId}`,
    priority: 'high',
    metadata: {
      orderId,
      orderNumber,
      customerName,
      amount,
      itemCount,
    },
  });
}

/**
 * Create a new customer notification
 */
export async function createNewCustomerNotification(
  tenantId: number,
  customerId: number,
  customerName: string,
  email: string,
  subdomain: string
) {
  return createNotification({
    tenantId,
    type: 'new_customer',
    title: 'New Customer Registered',
    message: `${customerName} (${email}) just registered`,
    actionUrl: `/dashboard/${subdomain}/people`,
    priority: 'medium',
    metadata: {
      customerId,
      customerName,
      email,
    },
  });
}

/**
 * Create a payment confirmation notification
 */
export async function createPaymentConfirmedNotification(
  tenantId: number,
  planName: string,
  amount: number,
  transactionId: string,
  subdomain: string
) {
  return createNotification({
    tenantId,
    type: 'payment_confirmed',
    title: 'Payment Confirmed',
    message: `Your payment for ${planName} (₱${amount.toLocaleString('en-PH')}) has been confirmed`,
    actionUrl: `/dashboard/${subdomain}/billing/subscriptions`,
    priority: 'high',
    metadata: {
      planName,
      amount,
      transactionId,
    },
  });
}

/**
 * Create a payment failed notification
 */
export async function createPaymentFailedNotification(
  tenantId: number,
  planName: string,
  amount: number,
  reason: string,
  subdomain: string
) {
  return createNotification({
    tenantId,
    type: 'payment_failed',
    title: 'Payment Failed',
    message: `Payment for ${planName} (₱${amount.toLocaleString('en-PH')}) failed: ${reason}`,
    actionUrl: `/dashboard/${subdomain}/billing/subscriptions`,
    priority: 'urgent',
    metadata: {
      planName,
      amount,
      reason,
    },
  });
}

/**
 * Create a payment expired notification
 */
export async function createPaymentExpiredNotification(
  tenantId: number,
  planName: string,
  amount: number,
  subdomain: string
) {
  return createNotification({
    tenantId,
    type: 'payment_expired',
    title: 'Payment Window Expired',
    message: `Your payment for ${planName} (₱${amount.toLocaleString('en-PH')}) window has expired. Please try again.`,
    actionUrl: `/dashboard/${subdomain}/billing/subscriptions`,
    priority: 'high',
    metadata: {
      planName,
      amount,
    },
  });
}

/**
 * Create a subscription cancelled notification
 */
export async function createSubscriptionCancelledNotification(
  tenantId: number,
  planName: string,
  refundAmount: number,
  subdomain: string
) {
  return createNotification({
    tenantId,
    type: 'subscription_cancelled',
    title: 'Subscription Cancelled',
    message: `Your ${planName} subscription has been cancelled. Refund of ₱${refundAmount.toLocaleString('en-PH')} will be processed.`,
    actionUrl: `/dashboard/${subdomain}/billing/subscriptions`,
    priority: 'high',
    metadata: {
      planName,
      refundAmount,
    },
  });
}

/**
 * Create a reactivation request notification
 */
export async function createReactivationRequestNotification(
  tenantId: number,
  planName: string,
  amount: number,
  subdomain: string
) {
  return createNotification({
    tenantId,
    type: 'reactivation_requested',
    title: 'Reactivation Request Submitted',
    message: `Your request to reactivate the ${planName} plan (₱${(amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}) has been submitted and is under review.`,
    actionUrl: `/dashboard/${subdomain}/billing/subscriptions`,
    priority: 'medium',
    metadata: {
      planName,
      amount,
    },
  });
}

/**
 * Create a reactivation payment submitted notification
 */
export async function createReactivationPaymentSubmittedNotification(
  tenantId: number,
  planName: string,
  amount: number,
  transactionId: string,
  expiresAt: Date,
  subdomain: string
) {
  return createNotification({
    tenantId,
    type: 'reactivation_payment_submitted',
    title: 'Reactivation Payment Submitted',
    message: `Payment of ₱${(amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} for ${planName} reactivation has been received and is being verified. Transaction: ${transactionId}`,
    actionUrl: `/dashboard/${subdomain}/billing/subscriptions`,
    priority: 'high',
    metadata: {
      planName,
      amount,
      transactionId,
      expiresAt: expiresAt.toISOString(),
    },
  });
}

/**
 * Create a reactivation payment verified notification
 */
export async function createReactivationPaymentVerifiedNotification(
  tenantId: number,
  planName: string,
  amount: number,
  subdomain: string
) {
  return createNotification({
    tenantId,
    type: 'reactivation_payment_verified',
    title: 'Reactivation Payment Verified',
    message: `Your payment of ₱${amount.toLocaleString('en-PH')} for ${planName} has been verified. Your subscription is now active!`,
    actionUrl: `/dashboard/${subdomain}/billing/subscriptions`,
    priority: 'high',
    metadata: {
      planName,
      amount,
    },
  });
}
