# Tenant Notification Integration for Subscriptions

## Overview

This document describes the comprehensive tenant notification system implemented for subscription lifecycle events (cancellation, reactivation request, and reactivation payment).

## Implementation Summary

### 1. **Notification Helper Functions** (`/lib/notifications.ts`)

Added four new notification helper functions that mirror the admin notification system but use the tenant `Notification` model:

```typescript
// Create a subscription cancelled notification
export async function createSubscriptionCancelledNotification(
  tenantId: number,
  planName: string,
  refundAmount: number,
  subdomain: string
)

// Create a reactivation request notification
export async function createReactivationRequestNotification(
  tenantId: number,
  planName: string,
  amount: number,
  subdomain: string
)

// Create a reactivation payment submitted notification
export async function createReactivationPaymentSubmittedNotification(
  tenantId: number,
  planName: string,
  amount: number,
  transactionId: string,
  expiresAt: Date,
  subdomain: string
)

// Create a reactivation payment verified notification
export async function createReactivationPaymentVerifiedNotification(
  tenantId: number,
  planName: string,
  amount: number,
  subdomain: string
)
```

**Key Features:**
- Broadcast notifications to all tenant users (no specific userId)
- Consistent formatting with existing notification system
- Proper action URLs for dashboard navigation
- Priority levels: `high` for critical events, `medium` for requests
- Rich metadata for tracking and debugging

### 2. **Cancellation Endpoint** (`/api/tenant/subscriptions/cancel`)

**Changes:**
- Imports `createSubscriptionCancelledNotification` helper
- Creates tenant notification when subscription is cancelled
- Notification includes refund amount in the message
- Broadcast to all tenant users (userId: null)

**Notification Details:**
- **Type:** `subscription_cancelled`
- **Title:** "Subscription Cancelled"
- **Message:** "Your {Plan} subscription has been cancelled. Refund of ₱{amount} will be processed."
- **Action URL:** `/dashboard/{subdomain}/billing/subscriptions`
- **Priority:** `high`

### 3. **Reactivation Request Endpoint** (`/api/tenant/subscriptions/reactivation-request`)

**Changes:**
- Imports `createReactivationRequestNotification` helper
- Creates tenant notification when reactivation request is submitted
- Follows same pattern as admin notification creation

**Notification Details:**
- **Type:** `reactivation_requested`
- **Title:** "Reactivation Request Submitted"
- **Message:** "Your request to reactivate the {Plan} plan (₱{amount}) has been submitted and is under review."
- **Action URL:** `/dashboard/{subdomain}/billing/subscriptions`
- **Priority:** `medium`

### 4. **Reactivation Payment Endpoints** 

#### Payment Submission (`/api/tenant/subscriptions/reactivation/payment/submit`)

**Changes:**
- Imports `createReactivationPaymentSubmittedNotification` helper
- Creates tenant notification when payment is submitted
- Includes transaction ID and expiration date in metadata

**Notification Details:**
- **Type:** `reactivation_payment_submitted`
- **Title:** "Reactivation Payment Submitted"
- **Message:** "Payment of ₱{amount} for {Plan} reactivation has been received and is being verified. Transaction: {id}"
- **Action URL:** `/dashboard/{subdomain}/billing/subscriptions`
- **Priority:** `high`
- **Metadata:** Includes `transactionId`, `expiresAt` for tracking

#### Payment Verification (`/api/admin/subscriptions/payment/verify`)

**Changes:**
- Imports `createReactivationPaymentVerifiedNotification` helper
- Creates tenant notification when payment is verified by admin
- Only creates notification for active subscriptions (successful verification)

**Notification Details:**
- **Type:** `reactivation_payment_verified`
- **Title:** "Reactivation Payment Verified"
- **Message:** "Your payment of ₱{amount} for {Plan} has been verified. Your subscription is now active!"
- **Action URL:** `/dashboard/{subdomain}/billing/subscriptions`
- **Priority:** `high`

### 5. **Notification Display** (`/app/dashboard/[subdomain]/notifications/page.tsx`)

**Changes:**
- Extended `getNotificationTypeColor` function with subscription notification types
- Added emoji icons and color schemes for each subscription event

**Notification Type Colors:**
- `subscription_cancelled`: 🔴 Red (cancelled state)
- `reactivation_requested`: 🔄 Blue (pending action)
- `reactivation_payment_submitted`: 💳 Yellow (pending verification)
- `reactivation_payment_verified`: ✅ Green (success)

## Data Model

All notifications use the existing `Notification` model from Prisma schema:

```prisma
model Notification {
  id        Int       @id @default(autoincrement())
  tenantId  Int
  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId    Int?      // null for broadcast notifications
  user      User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  type      String    // e.g., 'subscription_cancelled', 'reactivation_requested'
  title     String
  message   String
  actionUrl String?
  priority  String    @default("medium") // low, medium, high, urgent
  status    String    @default("unread")  // unread, read, archived
  metadata  Json?
  createdAt DateTime  @default(now())
  readAt    DateTime?
  archivedAt DateTime?
}
```

## Notification Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION LIFECYCLE                    │
└─────────────────────────────────────────────────────────────┘

1. CANCELLATION
   ├─ Tenant cancels subscription
   ├─ Endpoint: POST /api/tenant/subscriptions/cancel
   ├─ Creates admin notification (AdminNotification)
   ├─ Creates tenant notification (Notification) ← NEW
   ├─ Sends email to tenant and admin
   └─ Logs activity

2. REACTIVATION REQUEST
   ├─ Tenant initiates reactivation
   ├─ Endpoint: POST /api/tenant/subscriptions/reactivation-request
   ├─ Creates admin notification (AdminNotification)
   ├─ Creates tenant notification (Notification) ← NEW
   ├─ Sends email to tenant
   └─ Logs activity

3. REACTIVATION PAYMENT SUBMISSION
   ├─ Tenant submits GCash payment proof
   ├─ Endpoint: POST /api/tenant/subscriptions/reactivation/payment/submit
   ├─ Creates admin notification (AdminNotification)
   ├─ Creates tenant notification (Notification) ← NEW
   ├─ Sends emails to tenant and admin
   └─ Logs activity

4. PAYMENT VERIFICATION (Admin)
   ├─ Admin verifies and approves payment
   ├─ Endpoint: POST /api/admin/subscriptions/payment/verify
   ├─ Updates payment status to 'paid'
   ├─ Activates subscription
   ├─ Creates tenant notification (Notification) ← NEW
   ├─ Sends email to tenant
   └─ Updates invoice status

5. NOTIFICATION DISPLAY
   ├─ All tenant users see notifications in dashboard
   ├─ Notifications appear in notification bell
   ├─ Notifications appear in full notifications page
   ├─ Users can mark as read or archive
   └─ Color coding by subscription event type
```

## Key Features

### 1. **Broadcast Notifications**
- Notifications are created without a specific userId
- All tenant users can see the same subscription notifications
- Important for company-wide subscription updates

### 2. **Consistent with Admin System**
- Uses same `createNotification` base function
- Follows same naming conventions and patterns
- Parallel structure: every admin notification has a tenant equivalent

### 3. **Rich Metadata**
- Transactions IDs, expiration dates, amounts stored
- Enables future filtering and analytics
- JSON format for flexibility

### 4. **Error Resilience**
- Notification creation failures don't block main operation
- Logged for debugging but don't fail API endpoints
- Email and activity logging still work even if notifications fail

### 5. **Proper Priority Levels**
- Critical events (cancellation, payment verified): `high` priority
- Requests awaiting action (reactivation request, payment submitted): `high` priority
- Uses UI color coding to help users quickly identify event importance

## Testing Checklist

### Manual Testing

- [ ] **Subscription Cancellation**
  - Cancel subscription from tenant dashboard
  - Verify tenant notification created with type `subscription_cancelled`
  - Verify notification appears in tenant notifications bell
  - Verify notification appears in full notifications page
  - Verify notification can be marked as read/archived

- [ ] **Reactivation Request**
  - Submit reactivation request from cancelled subscription
  - Verify tenant notification created with type `reactivation_requested`
  - Verify admin also receives notification
  - Check notification displays correct plan and amount

- [ ] **Reactivation Payment Submission**
  - Submit GCash payment for reactivation
  - Verify tenant notification created with type `reactivation_payment_submitted`
  - Verify transaction ID is in notification metadata
  - Verify expiration date is correct (7 days from submission)

- [ ] **Payment Verification**
  - Admin approves payment from admin dashboard
  - Verify tenant notification created with type `reactivation_payment_verified`
  - Verify subscription status is now 'active'
  - Verify notification confirms subscription reactivation

- [ ] **Notification Display**
  - Check subscription notification colors in tenant notifications page
  - Verify emoji icons display correctly
  - Verify action URLs navigate to billing page
  - Check bulk mark-as-read works for multiple notifications

### Verification Points

1. **Database Level**
   ```sql
   SELECT * FROM "Notification" 
   WHERE type IN (
     'subscription_cancelled',
     'reactivation_requested', 
     'reactivation_payment_submitted',
     'reactivation_payment_verified'
   )
   ORDER BY createdAt DESC LIMIT 10;
   ```

2. **Logs**
   - Check console logs: `[Notification] Created: {type}`
   - Verify no error logs in notification creation

3. **Email Integration**
   - Verify tenant receives email notification
   - Verify admin receives email notification
   - Verify both email and notification are created

4. **UI/UX**
   - Notifications appear in notification bell count
   - Notifications page shows correct emoji and color
   - Notification title and message are readable

## Files Modified

1. **lib/notifications.ts**
   - Added 4 new notification helper functions
   - Lines: ~280-380 (added)

2. **app/api/tenant/subscriptions/cancel/route.ts**
   - Added import for `createSubscriptionCancelledNotification`
   - Added notification creation call
   - Lines: 1, ~120-130 (modified)

3. **app/api/tenant/subscriptions/reactivation-request/route.ts**
   - Added import for `createReactivationRequestNotification`
   - Added notification creation call
   - Lines: 1, ~140-155 (modified)

4. **app/api/tenant/subscriptions/reactivation/payment/submit/route.ts**
   - Added import for `createReactivationPaymentSubmittedNotification`
   - Added notification creation call
   - Lines: 1, ~175-190 (modified)

5. **app/api/admin/subscriptions/payment/verify/route.ts**
   - Added import for `createReactivationPaymentVerifiedNotification`
   - Added notification creation call in approval branch
   - Lines: 1, ~140-160 (modified)

6. **app/dashboard/[subdomain]/notifications/page.tsx**
   - Extended `getNotificationTypeColor` function
   - Added subscription event type colors and emoji icons
   - Lines: 88-107 (modified)

## Related Documentation

- `/docs/TENANT_NOTIFICATION_IMPLEMENTATION.md` - Initial tenant notification setup
- `NOTIFICATION_SYSTEM_PLAN.md` - Overall notification architecture
- `README_SUBSCRIPTIONS.md` - Subscription system overview

## Future Enhancements

1. **Notification Templates**
   - Create reusable templates for subscription notifications
   - Support for customizable messages per tenant

2. **Notification Preferences**
   - Allow users to customize notification types they receive
   - Email frequency settings (immediate, daily digest, etc.)

3. **In-App Alerts**
   - Toast notifications for immediate feedback
   - Modal dialogs for critical subscription events

4. **Analytics**
   - Track notification read rates
   - Monitor which notifications drive user action
   - A/B test notification messaging

5. **Webhook Support**
   - Send notifications to external systems
   - Integration with accounting/ERP systems
   - Audit trail for compliance

## Conclusion

The comprehensive tenant notification system for subscriptions is now fully integrated into BizCore. Users will receive timely, relevant notifications about their subscription lifecycle events through the notification bell and full notifications page. The system mirrors the admin notification structure for consistency and maintainability.
