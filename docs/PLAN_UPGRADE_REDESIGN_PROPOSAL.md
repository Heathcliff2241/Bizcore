# Plan Upgrade System Redesign - Proposal

## Current Problems with Payment-Based Plan Upgrade Flow

### 1. **Root Cause Analysis**
The current plan upgrade flow is overly complex and has several failure points:

- **Payment → Subscription coupling issue**: The `pendingUpgradePlanId` may be NULL when payment is approved because:
  - It's not being reliably persisted during the upgrade request
  - No audit trail exists to track state changes
  - Payment and subscription updates happen in separate API calls with no transactional guarantee

- **Multiple State Updates**: 
  - Upgrade request sets `pendingUpgradePlanId`
  - Payment submit creates a Payment record
  - Payment approval must read the `pendingUpgradePlanId` and apply it
  - Any failure in step 1 breaks steps 2-3

- **No Visibility**: 
  - Admin sees "Payments" but not WHY that payment exists
  - No link between payment and the upgrade request
  - Can't see the upgrade workflow from tenant side

- **No Rollback**: If payment approval fails, subscription remains in limbo with `pendingUpgradePlanId` set

## How Orders System Works (The Gold Standard)

### Order Flow Architecture
```
1. CUSTOMER CREATES ORDER
   └─ POST /api/orders
      - Validates products & stock
      - Creates Order record with status='pending'
      - Creates OrderItems
      - Returns order_id
      - Status: READY for processing

2. TENANT MANAGES ORDER (via OrdersManager)
   ├─ Fetch: GET /api/orders
   ├─ View: GET /api/orders/{id}
   └─ Update Status: PUT /api/orders/{id}
      - pending → confirmed → preparing → ready → out_for_delivery → delivered
      - Payment status: unpaid → paid → refunded
      - Single source of truth: Order record

3. Key Advantages
   ✅ Simple, linear progression
   ✅ Single entity (Order) manages entire workflow
   ✅ Admin can see all orders and their statuses
   ✅ Easy to add new statuses or steps
   ✅ Audit trail built-in (timestamps, status changes)
   ✅ Clear separation: create vs manage
```

## Proposed New Plan Upgrade System

### New Architecture: PlanUpgradeRequest Model

Instead of embedding upgrade logic in Subscription + Payment, create a dedicated `PlanUpgradeRequest` entity:

```prisma
model PlanUpgradeRequest {
  id           Int      @id @default(autoincrement())
  tenantId     Int      @unique  // One active upgrade per tenant
  currentPlan  String   // e.g., "trial"
  newPlan      String   // e.g., "basic"
  status       UpgradeStatus @default(pending)  // pending, payment_submitted, approved, applied, cancelled, expired
  
  // Financial details
  amountDue    Int      // in cents
  prorationDetails Json // { currentCycleDays, totalCycleDays, creditApplied, etc }
  
  // Payment link
  paymentId    Int?     // Links to Payment record (created when customer submits proof)
  payment      Payment? @relation(fields: [paymentId], references: [id])
  
  // Audit trail
  requestedAt  DateTime @default(now())
  paymentSubmittedAt DateTime?
  approvedAt   DateTime?
  appliedAt    DateTime?
  cancelledAt  DateTime?
  expiresAt    DateTime  // Payment expires 7 days after request
  
  // Admin approval
  approvedBy   Int?     // Admin user ID
  approvalNotes String?
  
  // Relations
  subscription Subscription @relation(fields: [tenantId], references: [tenantId])
  tenant       Tenant       @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
  @@index([status])
  @@index([expiresAt])
  @@map("plan_upgrade_requests")
}

enum UpgradeStatus {
  pending              // Waiting for customer to submit payment proof
  payment_submitted    // Customer uploaded GCash proof, awaiting admin approval
  approved             // Admin approved, applying upgrade
  applied              // Upgrade applied to subscription
  cancelled            // Upgrade cancelled by customer or admin
  expired              // Payment not submitted within 7 days
}
```

### New Flow (Same As Orders!)

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: TENANT INITIATES UPGRADE                            │
│ POST /api/tenant/subscriptions/upgrade-request              │
│                                                              │
│ Input: { newPlanId }                                        │
│ ✅ Validates plan is higher tier                            │
│ ✅ Creates PlanUpgradeRequest { status: pending }           │
│ ✅ Calculates proration (prorationDetails)                  │
│ ✅ Returns upgrade request with amount due                  │
│ ✅ Sends email to customer with payment instructions        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: TENANT SUBMITS PAYMENT PROOF                        │
│ POST /api/tenant/subscriptions/upgrade-request/{id}/submit  │
│                                                              │
│ Input: { gcashTransactionId, gcashProof }                   │
│ ✅ Creates Payment record                                   │
│ ✅ Updates request { status: payment_submitted }            │
│ ✅ Sets paymentSubmittedAt                                  │
│ ✅ Sends email to admin with payment for review             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: ADMIN MANAGES UPGRADE REQUESTS                      │
│ Page: /admin/plan-upgrades                                  │
│                                                              │
│ ✅ Lists all pending upgrade requests                       │
│ ✅ Shows: tenant name, current plan, new plan, amount       │
│ ✅ Shows payment proof                                      │
│ ✅ Single action: Approve or Reject                         │
│                                                              │
│ PUT /api/admin/upgrade-requests/{id}/approve                │
│ ├─ Updates request { status: approved }                     │
│ ├─ Sets approvedAt & approvedBy                             │
│ ├─ Calls internal function: applyPlanUpgrade()              │
│ └─ Updates Subscription { planId, billingCycle, etc }       │
│                                                              │
│ PUT /api/admin/upgrade-requests/{id}/reject                 │
│ ├─ Updates request { status: cancelled }                    │
│ └─ Sends rejection email                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: PLAN UPGRADE APPLIED                                │
│ PlanUpgradeRequest { status: applied }                      │
│                                                              │
│ ✅ Subscription.planId updated                              │
│ ✅ billingCycle reset                                       │
│ ✅ currentPeriodStart/End reset                             │
│ ✅ Email sent to tenant: "Upgrade successful!"              │
└─────────────────────────────────────────────────────────────┘
```

## What Changes

### 1. **Remove Coupling Between Payment & Subscription**
- Delete: `subscription.pendingUpgradePlanId`
- Delete: `subscription.upgradePendingAt`
- Add: `PlanUpgradeRequest` as the source of truth
- Payment now just records "proof of payment", not plan intent

### 2. **Add Dedicated Admin Dashboard Page**
```
/admin/plan-upgrades
├─ Status tabs: pending, payment_submitted, approved, applied
├─ Each upgrade shows: tenant name, current→new plan, amount, dates
├─ Actions: View payment proof, Approve, Reject
└─ Clear audit trail
```

### 3. **Simplify API Routes**

**Delete/Refactor:**
- `/api/admin/payments` → Only for order payments now
- `/api/tenant/subscriptions/upgrade` → Becomes `/api/tenant/subscriptions/upgrade-request`
- `/api/tenant/subscriptions/payment/submit` → Becomes `/api/tenant/subscriptions/upgrade-request/{id}/submit`

**New Routes:**
```
POST   /api/tenant/subscriptions/upgrade-request
       └─ Create upgrade request, return plan details

POST   /api/tenant/subscriptions/upgrade-request/{id}/submit
       └─ Submit payment proof, create Payment record

PUT    /api/admin/upgrade-requests/{id}/approve
       └─ Approve upgrade, apply to subscription

PUT    /api/admin/upgrade-requests/{id}/reject
       └─ Reject upgrade

GET    /api/admin/upgrade-requests
       └─ List all requests with filters
```

### 4. **Tenant-Side Visibility**
Show upgrade request status on subscription page:
```
Current Upgrade Requests:
┌─────────────────────────────────────┐
│ Trial → Basic Monthly               │
│ Status: Payment Submitted            │ ← Shows current status
│ Amount Due: ₱1,856.21               │
│ Submitted: Dec 6, 2024              │
│ Expires: Dec 13, 2024               │
│ [View Status] [Cancel]              │
└─────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Database & Models
- [ ] Create `PlanUpgradeRequest` migration
- [ ] Update Prisma schema
- [ ] Remove `pendingUpgradePlanId` from Subscription

### Phase 2: API Routes
- [ ] Create upgrade request routes
- [ ] Create admin approval routes
- [ ] Update Payment routes (remove plan logic)
- [ ] Add comprehensive logging

### Phase 3: Admin Dashboard
- [ ] Create `/admin/plan-upgrades` page
- [ ] List, filter, approve/reject upgrades
- [ ] Show payment proof, audit trail

### Phase 4: Tenant UI
- [ ] Show upgrade request status
- [ ] Allow cancel upgrade
- [ ] Submit payment proof flow

### Phase 5: Migration & Testing
- [ ] Migrate existing pending upgrades
- [ ] Test full workflow end-to-end
- [ ] Remove old code

## Benefits

✅ **Clarity**: PlanUpgradeRequest is the single source of truth
✅ **Auditability**: Every status change is recorded with timestamps
✅ **Testability**: Each step is independent and can be tested
✅ **Maintainability**: Adding new statuses requires no code changes to other parts
✅ **Visibility**: Both admin and tenant can see progress
✅ **Reliability**: No more missing `pendingUpgradePlanId` because we have explicit status
✅ **Extensibility**: Can add approval workflows, multiple approvers, conditions
✅ **Consistency**: Follows proven order management pattern

## Estimated Effort

- Database changes: 1-2 hours
- API routes: 4-6 hours
- Admin dashboard: 4-6 hours
- Tenant UI updates: 2-3 hours
- Testing & migration: 2-3 hours
- **Total: ~16-20 hours**

## Risk Mitigation

- Keep old `pendingUpgradePlanId` during transition for backwards compatibility
- Run migration script to convert pending upgrades
- Test with staging database before production
- Add comprehensive error logging
