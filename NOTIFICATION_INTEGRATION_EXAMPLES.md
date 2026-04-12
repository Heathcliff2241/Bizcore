# Notification Integration Examples

This document shows how to integrate notifications into existing BizCore API endpoints.

---

## 1. Low Stock Notifications (Inventory)

### Location: `app/api/inventory/update/route.ts` or similar

```typescript
import { createLowStockNotification } from '@/lib/notifications';

export async function PUT(request: NextRequest) {
  // ... existing code ...
  
  const { productId, newStock, tenantId } = await request.json();
  
  // Update inventory
  const product = await prisma.product.update({
    where: { id: productId },
    data: { stock: newStock }
  });

  // Check if stock is below threshold
  const threshold = product.lowStockThreshold || Math.ceil(product.maxStock * 0.1); // 10% of max
  
  if (newStock <= threshold && newStock > 0) {
    // Create low stock notification
    await createLowStockNotification(
      tenantId,
      productId,
      product.name,
      newStock,
      threshold,
      tenant.subdomain
    );
  } else if (newStock === 0) {
    // Create urgent out-of-stock notification
    await createLowStockNotification(
      tenantId,
      productId,
      product.name,
      0,
      threshold,
      tenant.subdomain
    );
  }
  
  return NextResponse.json({ success: true });
}
```

---

## 2. New Order Notifications

### Location: `app/api/pos/orders/route.ts`

```typescript
import { createNewOrderNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  // ... existing code ...
  
  const order = await prisma.order.create({
    data: {
      tenantId,
      customerId,
      orderNumber: generateOrderNumber(),
      // ... other fields ...
    },
    include: { items: true, customer: true }
  });

  // Create notification for new order
  await createNewOrderNotification(
    tenantId,
    order.id,
    order.orderNumber,
    order.customer.name,
    order.totalAmount,
    order.items.length,
    tenant.subdomain
  );

  return NextResponse.json({ success: true, order });
}
```

### Location: `app/api/orders/route.ts` (Storefront orders)

```typescript
import { createNewOrderNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  // ... create order ...
  
  const order = await prisma.order.create({
    data: { /* ... */ },
    include: { customer: true, items: true }
  });

  // Notify tenant about new storefront order
  await createNewOrderNotification(
    order.tenantId,
    order.id,
    order.orderNumber,
    order.customer?.name || 'Guest',
    order.total,
    order.items.length,
    tenant.subdomain
  );

  return NextResponse.json({ success: true, order });
}
```

---

## 3. New Customer Notifications

### Location: `app/api/customers/route.ts`

```typescript
import { createNewCustomerNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  // ... validate & get tenant ...
  
  const { firstName, lastName, email, phone } = await request.json();

  // Create customer
  const customer = await prisma.customer.create({
    data: {
      tenantId,
      firstName,
      lastName,
      email,
      phone
    }
  });

  // Log activity
  await logActivity({
    userId: session.user.id,
    tenantId,
    action: 'CUSTOMER_CREATED',
    entityType: 'customer',
    entityId: customer.id.toString(),
    // ...
  });

  // Notify tenant of new customer
  await createNewCustomerNotification(
    tenantId,
    customer.id,
    `${firstName} ${lastName}`,
    email || 'N/A',
    tenant.subdomain
  );

  return NextResponse.json({ success: true, customer });
}
```

### For Storefront Customer Registration

```typescript
import { createNewCustomerNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  // ... in customer registration endpoint ...
  
  const newCustomer = await prisma.customer.create({
    data: {
      tenantId,
      firstName,
      lastName,
      email,
      registeredAt: new Date()
    }
  });

  // Notify tenant that a customer registered on storefront
  await createNewCustomerNotification(
    tenantId,
    newCustomer.id,
    `${firstName} ${lastName}`,
    email,
    tenant.subdomain
  );

  return NextResponse.json({ customer: newCustomer });
}
```

---

## 4. Payment Notifications

### Location: `app/api/admin/payments/route.ts` (Payment Verification)

```typescript
import {
  createPaymentConfirmedNotification,
  createPaymentFailedNotification
} from '@/lib/notifications';

export async function POST(request: NextRequest) {
  // ... verify payment ...
  
  const { paymentId, status, adminNotes } = await request.json();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      subscription: {
        select: {
          tenantId: true,
          planId: true,
          tenant: { select: { subdomain: true } }
        }
      }
    }
  });

  if (status === 'verified' || status === 'paid') {
    // Update payment
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'paid',
        metadata: {
          ...payment.metadata,
          verificationStatus: 'verified',
          verifiedAt: new Date().toISOString(),
          adminNotes
        }
      }
    });

    // Notify tenant - payment confirmed
    await createPaymentConfirmedNotification(
      payment.subscription.tenantId,
      getPlanName(payment.subscription.planId), // 'Standard Monthly', etc
      payment.amount / 100, // Convert from centavos to pesos
      payment.metadata.gcashTransactionId,
      payment.subscription.tenant.subdomain
    );

    // Activate the pending upgrade
    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        planId: payment.subscription.pendingUpgradePlanId || payment.subscription.planId,
        pendingUpgradePlanId: null,
        status: 'active'
      }
    });

  } else if (status === 'rejected') {
    // Update payment
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'rejected',
        metadata: {
          ...payment.metadata,
          verificationStatus: 'rejected',
          rejectionReason: adminNotes || 'Payment verification failed'
        }
      }
    });

    // Notify tenant - payment failed
    await createPaymentFailedNotification(
      payment.subscription.tenantId,
      getPlanName(payment.subscription.planId),
      payment.amount / 100,
      adminNotes || 'Payment verification failed',
      payment.subscription.tenant.subdomain
    );
  }

  return NextResponse.json({ success: true });
}
```

### Location: `app/api/tenant/subscriptions/payment/status/route.ts`

Already integrated! The status endpoint auto-updates invoice status:

```typescript
// Check if payment has expired using metadata
const now = new Date();
const expiresAtTime = payment.metadata?.expiresAt ? new Date(payment.metadata.expiresAt as string) : null;
const isExpired = expiresAtTime && expiresAtTime < now;

// Update associated invoice status if payment status has changed
if (isExpired || payment.status === 'rejected' || payment.status === 'failed') {
  await prisma.invoice.updateMany({
    where: { paymentId: payment.id },
    data: { 
      status: isExpired ? 'expired' : 'failed'
    }
  });

  // ✨ ADD THIS: Notify tenant about payment expiration
  if (isExpired) {
    await createPaymentExpiredNotification(
      subscription.tenantId,
      getPlanName(subscription.planId),
      payment.amount / 100,
      subscription.tenant.subdomain
    );
  }
} else if (payment.status === 'paid') {
  await prisma.invoice.updateMany({
    where: { paymentId: payment.id },
    data: { 
      status: 'paid',
      paidAt: new Date()
    }
  });

  // ✨ ADD THIS: Notify tenant about payment confirmation
  await createPaymentConfirmedNotification(
    subscription.tenantId,
    getPlanName(subscription.planId),
    payment.amount / 100,
    payment.metadata?.gcashTransactionId,
    subscription.tenant.subdomain
  );
}
```

---

## 5. Ingredient Low Stock (POS Feature)

### Location: `app/api/inventory/ingredients/update/route.ts`

```typescript
import { createLowStockNotification } from '@/lib/notifications';

export async function PUT(request: NextRequest) {
  // ... existing code ...
  
  const { ingredientId, newStock, tenantId } = await request.json();
  
  const ingredient = await prisma.ingredient.update({
    where: { id: ingredientId },
    data: { currentStock: newStock }
  });

  // Check if below threshold
  if (newStock <= ingredient.lowStockThreshold) {
    await createLowStockNotification(
      tenantId,
      ingredientId,
      ingredient.name,
      newStock,
      ingredient.lowStockThreshold,
      tenant.subdomain
    );
  }

  return NextResponse.json({ success: true });
}
```

---

## 6. Helper Function: Get Plan Name

Add this utility function to help with payment notifications:

```typescript
// lib/utils.ts or add to lib/notifications.ts

function getPlanName(planId: string): string {
  const planNames: Record<string, string> = {
    'trial': 'Free Trial',
    'basic': 'Standard Monthly',
    'premium': 'Standard Yearly',
    'enterprise': 'Enterprise'
  };
  return planNames[planId] || planId;
}
```

---

## Integration Checklist

- [ ] Import notification functions in API routes
- [ ] Add notification triggers after relevant create/update operations
- [ ] Test each notification type
- [ ] Verify notifications appear in tenant dashboard
- [ ] Check theme colors are applied correctly
- [ ] Test unread badge updates
- [ ] Test mark as read functionality
- [ ] Test archive/delete
- [ ] Verify polling updates every 30 seconds
- [ ] Check mobile responsiveness

---

## Notes

- All notification creation is asynchronous and won't block request responses
- Use try-catch if you want to handle notification creation errors
- Notifications are optional—system works fine if notifications fail to create
- Store metadata with context data for future features (analytics, notifications settings, etc.)
- Subdomain is required for actionUrl to work correctly

