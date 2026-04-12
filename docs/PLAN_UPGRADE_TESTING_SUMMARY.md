# ✅ Plan Upgrade Flow Testing - COMPLETE SUITE

## 📋 Summary

I've created a comprehensive testing suite for the BizCore subscription plan upgrade flow and database persistence. This includes:

1. **PLAN_UPGRADE_TEST_SCRIPT.md** - Detailed manual testing guide with 8 test scenarios
2. **PLAN_UPGRADE_TEST_README.md** - Complete testing documentation and troubleshooting
3. **scripts/test-upgrade-flow.js** - Automated integration test (requires psql, run via npm)
4. **test-plan-upgrade.js** - Quick API smoke test

---

## 🚀 How to Run the Tests

### Step 1: Start Development Environment

```bash
# Terminal 1: Start PostgreSQL, pgAdmin, Nginx
npm run docker:up

# Terminal 2: Start Next.js and Vite apps  
npm run dev:all

# Verify:
# - Next.js: http://localhost:3000
# - pgAdmin: http://localhost:5050
# - PostgreSQL: localhost:5432
```

### Step 2: Run Manual Tests (Recommended First)

Follow the **PLAN_UPGRADE_TEST_SCRIPT.md** which includes:

#### Test 1: Trial → Basic Monthly Upgrade
- Create test tenant
- Initiate upgrade
- Submit GCash payment
- Admin approves in `/admin/payments`
- **Verify**: planId changes from "trial" to "basic", status → "active"

#### Test 2: Basic → Premium Annual (Proration)
- Use same tenant from Test 1
- Upgrade to Premium Annual
- Verify proration calculation
- **Verify**: planId → "premium", billingCycle → "annual" (365 days)

#### Test 3: Payment Rejection & Retry
- Create new test tenant
- Submit payment
- Admin rejects it
- **Verify**: Subscription stays on old plan, can retry

#### Test 4: Plan Persistence
- Hard refresh page (Ctrl+F5)
- Logout and login
- **Verify**: Plan status persists from database

#### Test 5-8: API & Data Validation
- API response structure
- Invoice creation and linking
- Billing cycle date correctness
- Email notifications

### Step 3: Run Automated Tests

```bash
# Once API and database are running:
npm run test:upgrade

# Expected output shows:
# ✅ All tests passed
# Your plan upgrade flow is working correctly!
```

---

## 🔍 Testing the Plan Upgrade Flow

### What Gets Tested

**✅ Upgrade Flow State Machine**
```
BEFORE PAYMENT:
  planId: "trial"
  status: "trial"
  pendingUpgradePlanId: NULL

AFTER PAYMENT SUBMITTED:
  planId: "trial"  (unchanged yet)
  pendingUpgradePlanId: "basic"  (waiting for approval)
  upgradePendingAt: <timestamp>

AFTER ADMIN APPROVAL:
  planId: "basic"  (✅ UPGRADED!)
  status: "active"
  pendingUpgradePlanId: NULL  (cleared)
  billingCycle: "monthly"
  currentPeriodStart: <today>
  currentPeriodEnd: <today + 30 days>
```

**✅ Payment Processing**
- Payment created with status "unpaid"
- Metadata: `verificationStatus: "pending"`
- After admin approval: status → "paid", `verificationStatus: "verified"`
- After rejection: status → "unpaid", `verificationStatus: "rejected"`

**✅ Proration Calculation**
- Calculates unused balance from current cycle
- Charges difference between plans
- Creates invoice with proration details
- Updates new billing cycle dates

**✅ Invoice Tracking**
- Invoice created for each upgrade
- Linked to payment via `paymentId`
- Status: "issued" → "paid" after payment verification
- Line items describe the upgrade

**✅ Billing Cycles**
- Monthly plans: 30 days
- Annual plans: 365 days
- Dates calculated correctly based on plan type

**✅ Database Persistence**
- All updates persist correctly
- Hard refresh shows same data from DB
- Logout/login preserves subscription state
- No orphaned records

---

## 📁 Test Files Location

| File | Purpose | How to Run |
|------|---------|-----------|
| `PLAN_UPGRADE_TEST_SCRIPT.md` | Manual test guide (8 scenarios) | Follow step-by-step |
| `PLAN_UPGRADE_TEST_README.md` | Complete documentation | `cat PLAN_UPGRADE_TEST_README.md` |
| `scripts/test-upgrade-flow.js` | Automated integration tests | `npm run test:upgrade` |
| `test-plan-upgrade.js` | Quick API smoke test | `node test-plan-upgrade.js` |

---

## ✅ Critical Code Sections Being Tested

### 1. Upgrade Endpoint (`/api/tenant/subscriptions/upgrade`)

**File**: `app/api/tenant/subscriptions/upgrade/route.ts`

**What it does**:
- Accepts upgrade request (planId, subscriptionId)
- Calculates proration
- Creates invoice if payment needed
- Sets `pendingUpgradePlanId` (plan applied after payment)
- **Returns UPDATED subscription** (not stale data)

**Key line** (120-130):
```typescript
const updatedSubscription = await prisma.subscription.update({
  where: { id: subscription.id },
  data: {
    pendingUpgradePlanId: newPlanId,
    upgradePendingAt: new Date(),
  }
});

return NextResponse.json({
  success: true,
  subscription: updatedSubscription,  // ✅ Updated!
  proration,
  message: `Upgrade pending payment verification...`
});
```

**Tests**: ✅ Returns updated subscription ✅ Sets pendingUpgradePlanId

---

### 2. Payment Submit Endpoint (`/api/tenant/subscriptions/payment/submit`)

**File**: `app/api/tenant/subscriptions/payment/submit/route.ts`

**What it does**:
- Creates Payment record (status: "unpaid")
- Metadata: `verificationStatus: "pending"`
- Creates Invoice
- Sends confirmation email
- Ready for admin polling

**Tests**: ✅ Payment created ✅ Correct status ✅ Email sent

---

### 3. Admin Payment Verify (`/api/admin/payments`)

**File**: `app/api/admin/payments/route.ts` (PUT endpoint)

**What it does**:
- Admin clicks "Approve" or "Reject"
- If approved:
  - Payment status → "paid"
  - Applies `pendingUpgradePlanId` to `planId`
  - Clears `pendingUpgradePlanId`
  - Sets new billing cycle dates
  - Sends email to tenant
- If rejected:
  - Payment status → "unpaid"
  - `verificationStatus` → "rejected"
  - Subscription unchanged

**Key section** (206-230):
```typescript
if (payment.subscription.pendingUpgradePlanId) {
  subscriptionUpdate.planId = payment.subscription.pendingUpgradePlanId;
  subscriptionUpdate.pendingUpgradePlanId = null;  // Clear pending
  subscriptionUpdate.upgradePendingAt = null;
  
  // Get new plan's billing cycle
  const newPlan = await prisma.plan.findUnique({
    where: { id: payment.subscription.pendingUpgradePlanId },
    select: { billingCycle: true },
  });
  
  // Update cycle dates
  const cycleStart = new Date();
  const billingCycle = newPlan?.billingCycle || 'monthly';
  const cycleEnd = billingCycle === 'annual'
    ? new Date(cycleStart.getTime() + 365 * 24 * 60 * 60 * 1000)
    : new Date(cycleStart.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  subscriptionUpdate.currentPeriodStart = cycleStart;
  subscriptionUpdate.currentPeriodEnd = cycleEnd;
}
```

**Tests**: ✅ Plan updated ✅ Pending cleared ✅ Billing cycle correct ✅ Email sent

---

## 🧪 Test Execution Checklist

- [ ] **Before Testing**
  - [ ] `npm run docker:up` (PostgreSQL running)
  - [ ] `npm run dev:all` (API + UI running)
  - [ ] Check http://localhost:3000 (app loads)

- [ ] **Test 1: Trial → Basic**
  - [ ] Create tenant with Trial plan
  - [ ] Check DB: planId = "trial"
  - [ ] Initiate upgrade
  - [ ] Check DB: pendingUpgradePlanId = "basic"
  - [ ] Admin approves
  - [ ] Check DB: planId = "basic", pendingUpgradePlanId = NULL
  - [ ] Tenant sees "Basic Monthly" in dashboard

- [ ] **Test 2: Basic → Premium Proration**
  - [ ] Upgrade to Premium Annual
  - [ ] Verify proration calculated
  - [ ] Admin approves
  - [ ] Check DB: billingCycle = "annual", cycle_days ≈ 365

- [ ] **Test 3: Payment Rejection**
  - [ ] New tenant, submit payment
  - [ ] Admin rejects
  - [ ] Check DB: planId = "trial" (unchanged)
  - [ ] Check DB: payment status = "unpaid"

- [ ] **Test 4: Persistence**
  - [ ] Hard refresh (Ctrl+F5)
  - [ ] Verify plan persists
  - [ ] Logout/login
  - [ ] Verify plan persists

- [ ] **Test 5-8: Data Integrity**
  - [ ] API responses correct
  - [ ] Invoices created and linked
  - [ ] Billing cycles correct
  - [ ] Emails received

---

## 📊 Database Queries for Verification

### View Subscription State
```sql
SELECT 
  s.id,
  t.subdomain,
  s."planId",
  s.status,
  s."pendingUpgradePlanId",
  s."billingCycle",
  s."currentPeriodEnd",
  EXTRACT(DAY FROM (s."currentPeriodEnd" - CURRENT_DATE)) as days_remaining
FROM subscriptions s
JOIN tenants t ON s."tenantId" = t.id
ORDER BY s.id DESC
LIMIT 10;
```

### View Payments
```sql
SELECT 
  p.id,
  p.status,
  p.amount,
  p.metadata->>'verificationStatus' as verification_status,
  s."planId"
FROM payments p
JOIN subscriptions s ON p."subscriptionId" = s.id
ORDER BY p.id DESC
LIMIT 10;
```

### View Invoices
```sql
SELECT 
  i."invoiceNumber",
  i.status,
  i.total,
  p.status as payment_status,
  s."planId"
FROM invoices i
LEFT JOIN payments p ON i."paymentId" = p.id
LEFT JOIN subscriptions s ON i."subscriptionId" = s.id
ORDER BY i.id DESC
LIMIT 10;
```

---

## 🎯 Success Criteria

| Criteria | Expected | Status |
|----------|----------|--------|
| Upgrade endpoint returns updated subscription | Not stale data | ⬜ |
| pendingUpgradePlanId set during upgrade | Applied after payment | ⬜ |
| Admin approval applies plan | planId updated | ⬜ |
| Billing cycle dates correct | Monthly=30, Annual=365 | ⬜ |
| Payment rejection prevents upgrade | Subscription unchanged | ⬜ |
| Plan persists after refresh | From database | ⬜ |
| Invoices created and linked | Payment associated | ⬜ |
| Emails sent | Confirmation + approval | ⬜ |

---

## 🐛 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Plan not updating | Check `/api/admin/payments/route.ts` line 206 |
| Stale data in modal | Check `/api/tenant/subscriptions/upgrade/route.ts` line 118 |
| Wrong proration | Check `/lib/proration.ts` calculations |
| Billing cycle wrong | Check plan's `billingCycle` field in database |
| Email not sending | Check `.env.local` SMTP settings |
| PostgreSQL not running | Run `npm run docker:up` |
| API not responding | Run `npm run dev:all` |

---

## 📚 Related Documentation

- **PLAN_UPGRADE_TEST_SCRIPT.md** - Detailed step-by-step test scenarios
- **PLAN_UPGRADE_TEST_README.md** - Complete documentation and API details
- **SUBSCRIPTION_UPGRADE_BUG_FIX.md** - Technical details of fixes applied
- **SUBSCRIPTION_TRACKING_COMPLETE.md** - Feature inventory and checklist

---

## 🎓 Key Learnings

### State Machine
The upgrade flow uses a **pending state machine**:
1. Payment submitted → `pendingUpgradePlanId` set
2. Payment verifying → `upgradeP endingAt` timestamp set
3. Payment approved → `planId` = `pendingUpgradePlanId`, pending cleared
4. Payment rejected → Subscription unchanged, can retry

### Database Integrity
- `pendingUpgradePlanId` is never NULL when upgrade pending
- `planId` only changes when payment is verified
- `upgradePendingAt` cleared after verification
- Prevents data inconsistency between payment and subscription

### Proration Logic
- Calculates days remaining in current cycle
- Divides daily rate by remaining days
- Subtracts from new plan's price
- Result is amount to charge customer

---

## ✨ Next Steps

1. **Start environment**: `npm run docker:up` + `npm run dev:all`
2. **Read guide**: Open `PLAN_UPGRADE_TEST_SCRIPT.md`
3. **Execute Test 1**: Trial → Basic upgrade
4. **Execute Test 2**: Proration scenario
5. **Run remaining tests**: Rejection, persistence, data validation
6. **Mark criteria**: Use success checklist above

All tests should pass ✅ before considering plan upgrade flow production-ready.

---

**Created**: December 7, 2025
**Status**: ✅ Complete - Ready for Testing
