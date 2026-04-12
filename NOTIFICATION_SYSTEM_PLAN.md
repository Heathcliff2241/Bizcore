# BizCore Notification System Implementation Plan

## 1. CURRENT STATE ASSESSMENT

### Activity Logging Status
- ✅ **Implemented**: API routes for auth, subscriptions, payments, customers, POS, pages
- ❌ **Missing**: Admin API routes (subscriptions, payments, tenants, analytics)
- **Location**: `/app/api/` and `/lib/activityLogger.ts`

### Notification System Status
- ❌ **NOT IMPLEMENTED**: Tenant notifications
- ❌ **NOT IMPLEMENTED**: Admin notifications
- ❌ **NOT IMPLEMENTED**: Notification UI components
- ❌ **NOT IMPLEMENTED**: Database schema for notifications

---

## 2. COMPLETE ADMIN LOGGING SETUP

### Priority: HIGH (Complete First)

#### 2.1 Admin Routes to Add Logging
```
/app/api/admin/payments/route.ts          → GET (fetch payments)
/app/api/admin/subscriptions/route.ts     → GET (fetch subscriptions)
/app/api/admin/subscriptions/plans/route.ts → GET, POST, PUT, DELETE
/app/api/admin/payments/[id]/route.ts     → POST (verify/reject payments)
/app/api/admin/tenants/route.ts           → GET (list tenants)
/app/api/admin/tenants/[id]/route.ts      → GET, PUT (view/update tenant)
/app/api/admin/analytics/route.ts         → GET (revenue, users, activity)
```

#### 2.2 Logging Template
```typescript
await logActivity({
  userId: session.user.id,
  tenantId: null, // null for super-admin actions
  action: 'payment_verified|payment_rejected|plan_updated|tenant_updated|etc',
  entityType: 'payment|subscription|plan|tenant|analytics',
  entityId: id.toString(),
  changes: { before: {}, after: {} },
  ipAddress: getClientIp(request),
  userAgent: getUserAgent(request),
  metadata: { reason?, notes? }
});
```

---

## 3. TENANT NOTIFICATION SYSTEM

### 3.1 Database Schema Addition

#### New Table: `Notification`
```prisma
model Notification {
  id                Int       @id @default(autoincrement())
  tenantId          Int       // Tenant that receives notification
  userId            Int?      // Specific user (optional, if null = all tenant users)
  type              String    // 'low_stock', 'new_order', 'new_customer', 'payment_confirmed', etc
  title             String
  message           String
  actionUrl         String?   // Link to relevant page (e.g., /inventory, /orders/123)
  priority          String    @default("medium") // 'low', 'medium', 'high', 'urgent'
  status            String    @default("unread") // 'unread', 'read', 'archived', 'dismissed'
  
  // Metadata for context
  metadata          Json?     // { productId, stockLevel, threshold, orderId, customerId, etc }
  
  // Tracking
  createdAt         DateTime  @default(now())
  readAt            DateTime?
  archivedAt        DateTime?
  dismissedAt       DateTime?
  
  // Relations
  tenant            Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user              User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([tenantId])
  @@index([status])
  @@index([createdAt])
}
```

#### Update: `Tenant` Model
```prisma
notifications Notification[]
```

#### Update: `User` Model
```prisma
notifications Notification[]
```

### 3.2 Notification Types & Triggers

#### A. Inventory Notifications
**Type**: `low_stock`
- **Trigger**: Product/ingredient stock falls below threshold
- **When**: 
  - During inventory update
  - On POS order placement (stock reduction)
  - On inventory purchase/receive
- **Threshold**: User-configurable per product (default 10% of max stock)
- **Message**: "Product '{name}' stock low: {current} units (threshold: {threshold})"
- **Action URL**: `/dashboard/[subdomain]/inventory/products/[id]`
- **Priority**: High (if critical stock) / Medium (if warning)

#### B. Order Notifications
**Type**: `new_order`
- **Trigger**: New order placed on storefront or POS
- **When**: Order creation completed
- **Message**: "New order #{orderNumber} from {customerName} - ₱{amount}"
- **Action URL**: `/dashboard/[subdomain]/orders/[orderId]`
- **Priority**: High (for new orders)
- **Metadata**: { orderId, customerName, amount, items }

#### C. Customer Notifications
**Type**: `new_customer`
- **Trigger**: New customer registration on storefront
- **When**: Customer account created
- **Message**: "New customer registered: {name} ({email})"
- **Action URL**: `/dashboard/[subdomain]/customers/[customerId]`
- **Priority**: Medium
- **Metadata**: { customerId, customerName, email }

#### D. Payment Notifications
**Type**: `payment_confirmed` | `payment_failed` | `payment_expired`
- **Trigger**: Payment status changes
- **When**: Admin verifies/rejects payment
- **Message**: "Payment for {planName} confirmed" or "Payment expired"
- **Action URL**: `/dashboard/[subdomain]/billing/subscriptions`
- **Priority**: High
- **Metadata**: { paymentId, planName, amount }

#### E. System/Admin Notifications
**Type**: `admin_alert` | `feature_announcement`
- **Trigger**: System events, announcements
- **When**: Manual or scheduled
- **Message**: Custom
- **Priority**: Varies

### 3.3 Notification Recipients

#### Rule 1: Broadcast to All Tenant Users
- New order
- New customer
- Low stock
- Payment status changes

#### Rule 2: Broadcast to Tenant Admins Only
- Payment failures
- System alerts
- Admin actions

#### Rule 3: User-Specific
- Personal payment confirmations (after verification)
- Personal activity-related notifications

### 3.4 Implementation Priority

**Phase 1 (MVP)**: 
1. Low stock (product/ingredient inventory)
2. New orders (POS + Storefront)
3. New customers (Storefront registration)

**Phase 2 (Enhancement)**:
1. Payment notifications
2. System alerts
3. Email notifications (digest)

---

## 4. API ENDPOINTS

### 4.1 Notification Endpoints (Tenant)

```
GET /api/tenant/notifications
  - Query: ?status=unread&limit=20&offset=0
  - Returns: Paginated notifications

PATCH /api/tenant/notifications/:id/read
  - Mark single notification as read
  
PATCH /api/tenant/notifications/read-all
  - Mark all notifications as read
  
DELETE /api/tenant/notifications/:id
  - Archive/dismiss notification
  
DELETE /api/tenant/notifications/clear-all
  - Archive all old notifications
```

### 4.2 Notification Triggers (Internal)

```
POST /api/internal/notifications/create
  - Internal-only endpoint to create notifications
  - Used by other APIs when events occur
  - Protected by secret token or same-origin

POST /api/internal/notifications/bulk
  - Create multiple notifications (for broadcast)
```

---

## 5. UI COMPONENTS

### 5.1 Notification Center
**Location**: `/components/notifications/NotificationCenter.tsx`
- Bell icon in header with unread count badge
- Dropdown showing recent 5 notifications
- Link to full notification center page

### 5.2 Notification Page
**Location**: `/app/dashboard/[subdomain]/notifications/page.tsx`
- List all notifications (paginated)
- Filter by: status (unread/read), type, date range
- Mark as read/archive buttons
- Search/sort options

### 5.3 Notification Toast
**Location**: `/components/notifications/NotificationToast.tsx`
- Real-time toast notification on screen
- Shows immediately when notification created
- Auto-dismisses after 5 seconds
- Click to view details

### 5.4 Notification Settings
**Location**: `/app/dashboard/[subdomain]/settings/notifications/page.tsx`
- Toggle notification types on/off
- Set low-stock threshold per product category
- Email digest preferences
- Quiet hours (optional)

---

## 6. REAL-TIME UPDATES (WebSocket/Polling)

### 6.1 Strategy: Polling (Simple) vs WebSocket (Advanced)
- **MVP**: Use polling every 30 seconds (client-side fetch)
- **Phase 2**: Implement WebSocket for real-time updates

### 6.2 Polling Implementation
```typescript
// Client-side hook: useNotifications.ts
- Fetch notifications every 30 seconds
- Update Zustand store
- Trigger toast for new notifications
- Handle unread count
```

---

## 7. DATABASE MIGRATION

### Create `Notification` table
```sql
CREATE TABLE "Notification" (
  id SERIAL PRIMARY KEY,
  tenantId INT NOT NULL,
  userId INT,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  actionUrl VARCHAR(500),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'unread',
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  readAt TIMESTAMP,
  archivedAt TIMESTAMP,
  dismissedAt TIMESTAMP,
  FOREIGN KEY (tenantId) REFERENCES "Tenant"(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE INDEX idx_notification_tenant_status ON "Notification"(tenantId, status);
CREATE INDEX idx_notification_created ON "Notification"(createdAt DESC);
```

---

## 8. IMPLEMENTATION TIMELINE

### Week 1
- [ ] Complete admin API logging (all 7 routes)
- [ ] Create `Notification` database schema + migration
- [ ] Set up notification creation helper functions

### Week 2
- [ ] Implement low-stock notifications (trigger + API)
- [ ] Implement new-order notifications
- [ ] Implement new-customer notifications
- [ ] Add notification endpoints (GET, read, delete)

### Week 3
- [ ] Build NotificationCenter component (header bell)
- [ ] Build NotificationPage (full list)
- [ ] Add polling hook (useNotifications)
- [ ] Add notification toast component

### Week 4
- [ ] Build notification settings page
- [ ] Add notification filters/search
- [ ] Testing & bug fixes
- [ ] Deployment

---

## 9. CODE EXAMPLES

### Example 1: Trigger Low Stock Notification
```typescript
// In inventory update API endpoint
if (newStock <= product.lowStockThreshold) {
  await createNotification({
    tenantId: subscription.tenantId,
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: `${product.name} is running low (${newStock} units)`,
    actionUrl: `/dashboard/${tenant.subdomain}/inventory/products/${product.id}`,
    priority: newStock === 0 ? 'urgent' : 'high',
    metadata: {
      productId: product.id,
      currentStock: newStock,
      threshold: product.lowStockThreshold,
      productName: product.name
    }
  });
}
```

### Example 2: Trigger New Order Notification
```typescript
// In POS order creation API endpoint
await createNotification({
  tenantId: order.tenantId,
  type: 'new_order',
  title: `New Order #${order.orderNumber}`,
  message: `Order from ${customer.name} - ₱${order.total}`,
  actionUrl: `/dashboard/${tenant.subdomain}/orders/${order.id}`,
  priority: 'high',
  metadata: {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: customer.name,
    amount: order.total,
    itemCount: order.items.length
  }
});
```

### Example 3: Fetch Notifications (Client)
```typescript
// Tenant API: GET /api/tenant/notifications
const response = await fetch('/api/tenant/notifications?status=unread&limit=10');
const { notifications, total } = await response.json();

// Returns:
[
  {
    id: 1,
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: 'Cappuccino coffee is running low (5 units)',
    actionUrl: '/dashboard/quartz/inventory/products/123',
    priority: 'high',
    status: 'unread',
    createdAt: '2025-12-06T10:30:00Z',
    metadata: { productId: 123, currentStock: 5, threshold: 10 }
  }
]
```

---

## 10. CONSIDERATIONS & GOTCHAS

1. **Notification Spam**: Filter duplicate notifications within 5-minute window
2. **Timezone**: Store dates in UTC, convert on client-side
3. **Scalability**: Archive old notifications (older than 30 days) automatically
4. **Multi-tenant**: Always filter by tenantId, never cross-tenant leakage
5. **Permissions**: Only tenant users can see tenant notifications
6. **Activity Log**: Log notification creation separately from displayed notifications

---

## Summary

**Admin Logging**: Add logActivity to 7 admin API routes
**Notification Database**: Create Notification table with indexes
**Notification Triggers**: Implement 3 core notification types
**API Endpoints**: Build 5 notification endpoints
**UI Components**: Build 4 components (bell, page, toast, settings)
**Timeline**: 4 weeks to full implementation

---
