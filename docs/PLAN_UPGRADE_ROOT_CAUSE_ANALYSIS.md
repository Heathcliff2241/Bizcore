# 🔍 Plan Upgrade Issue - Root Cause Analysis

## Problem Statement
- User on "Free Trial" plan
- User upgrades to a paid plan (e.g., "Standard Monthly")
- Admin approves the payment
- **Result**: Plan still shows as "Free Trial" instead of the upgraded plan

## Email Evidence
Email received says:
```
Your Payment Has Been Approved!
Plan: Free Trial
Amount Paid: ₱1,856.21
Status: Active Now
```

But the admin approved an upgrade to a DIFFERENT plan, not Trial.

---

## Root Cause Hypothesis

### Hypothesis 1: planId NOT Being Updated ❌ ← MOST LIKELY
When admin approves:
- `planId` stays as "trial" instead of changing to "basic" (or whatever was approved)
- This would explain why dashboard shows Trial
- This would explain why email gets wrong plan name

**Evidence needed**:
- Check database: SELECT planId FROM subscriptions WHERE tenantId = X;
- Should be "basic", but is probably still "trial"

### Hypothesis 2: pendingUpgradePlanId NOT Being Set ⚠️
When user upgrades, `pendingUpgradePlanId` not saved:
- Admin sees nothing to approve
- Subscription never changes

**Evidence needed**:
- Check upgrade API response
- Check if `/api/tenant/subscriptions/upgrade` returns `pendingUpgradePlanId`

### Hypothesis 3: Second Subscription Created ⚠️ (unlikely)
Onboarding creates subscription1 with trial.
Upgrade creates subscription2 with new plan.
But we're reading from subscription1.

**Evidence needed**:
- SELECT COUNT(*) FROM subscriptions WHERE tenantId = X;
- Should be 1, not 2+

### Hypothesis 4: Email Template Hardcoded ⚠️ (unlikely)
Email template has "Free Trial" hardcoded somewhere.

**Evidence**:
- The email function does receive `planName` parameter
- It uses it in the template
- So this would only happen if `planName` was passed as "Free Trial"

### Hypothesis 5: Status Still "trial" But Plan Changed ⚠️
After upgrade:
- `planId` = "basic" ✅
- `status` = "trial" ❌ (should be "active")

Then `/current` endpoint has logic that might prioritize status="trial".

**Current endpoint logic**:
```typescript
const planIdToShow = subscription.pendingUpgradePlanId || subscription.planId;
```

This should show "basic" even if status="trial".

---

## What SHOULD Happen (Correct Flow)

### 1. Onboarding (Initial Setup)
```sql
INSERT INTO subscriptions:
  planId: "trial"
  status: "trial"
  pendingUpgradePlanId: NULL
  currentPeriodEnd: <14 days>
```

### 2. User Initiates Upgrade
```
POST /api/tenant/subscriptions/upgrade
  body: { newPlanId: "basic" }
```

```sql
UPDATE subscriptions:
  planId: "trial" (NOT CHANGED YET)
  status: "trial" (NOT CHANGED)
  pendingUpgradePlanId: "basic" ← MARKED AS PENDING
  upgradePendingAt: <now>
```

Frontend shows: "Basic Monthly" (because of pendingUpgradePlanId logic)

### 3. Payment Submitted
```
POST /api/tenant/subscriptions/payment/submit
```

Creates Payment record:
```sql
INSERT INTO payments:
  status: "unpaid"
  subscriptionId: <ID>
  metadata: { verificationStatus: "pending" }
```

### 4. Admin Approves
```
PUT /api/admin/payments
  body: { paymentId: X, action: "verify" }
```

```sql
UPDATE subscriptions:
  planId: "basic" ← NOW UPDATED!
  status: "active" ← NOW ACTIVE!
  pendingUpgradePlanId: NULL ← CLEARED!
  currentPeriodStart: <now>
  currentPeriodEnd: <now + 30 days or 365 days>
  billingCycle: "monthly" (or "annual")
```

### 5. Email Sent
Fetches plan name from `subscriptions.planId` ("basic"):
```
Plan: Standard Monthly
Status: Active Now
```

---

## Critical Code Locations

### Update Code (Should Change planId)
**File**: `/app/api/admin/payments/route.ts`
**Lines**: 208-260

```typescript
if (payment.subscription.pendingUpgradePlanId) {
  subscriptionUpdate.planId = payment.subscription.pendingUpgradePlanId;  // ← CRITICAL LINE
  subscriptionUpdate.status = 'active';
  // ... calculate billing dates ...
}

const updatedSubscription = await prisma.subscription.update({
  where: { id: payment.subscriptionId },
  data: subscriptionUpdate,
});

// Fetch plan name from UPDATED subscription
const planData = await prisma.plan.findUnique({
  where: { id: updatedSubscription.planId },  // ← SHOULD BE "basic"
});
```

### Email Sending
**File**: `/app/api/admin/payments/route.ts`
**Lines**: 263-278

Uses `updatedSubscription.planId` to fetch plan name and send email.

### Current Endpoint (What Dashboard Sees)
**File**: `/api/tenant/subscriptions/current/route.ts`
**Lines**: 76-111

```typescript
const planIdToShow = subscription.pendingUpgradePlanId || subscription.planId;
const pricing = PLAN_PRICING[planIdToShow];
```

---

## How to Diagnose

### Step 1: Check Database State
```sql
SELECT 
  id,
  planId,
  status,
  pendingUpgradePlanId,
  billingCycle,
  currentPeriodStart,
  currentPeriodEnd
FROM subscriptions
WHERE tenantId = (
  SELECT id FROM tenants WHERE name = 'Quartz Account'  -- Your tenant
);
```

**What to look for**:
- [ ] Is there ONE subscription (not multiple)?
- [ ] Is `planId` still "trial"? (BUG if yes)
- [ ] Should be "basic" or whatever plan you approved
- [ ] Is `pendingUpgradePlanId` NULL? (Should be NULL after approval)
- [ ] Is `status` "active"? (Should be, not "trial")
- [ ] Are billing dates set? (currentPeriodEnd ~30 days away for monthly)

### Step 2: Check Payment Record
```sql
SELECT 
  id,
  status,
  subscriptionId,
  metadata
FROM payments
WHERE subscriptionId IN (
  SELECT id FROM subscriptions 
  WHERE tenantId = (SELECT id FROM tenants WHERE name = 'Quartz Account')
)
ORDER BY createdAt DESC
LIMIT 1;
```

**What to look for**:
- [ ] Does `status` = "paid"?
- [ ] Is `metadata.verificationStatus` = "verified"?
- [ ] Is metadata present?

### Step 3: Check if Update Actually Happened
```sql
SELECT 
  subscriptionId,
  planId as current_planId,
  (SELECT p."pendingUpgradePlanId" 
   FROM subscriptions p 
   WHERE p.id = payments.subscriptionId
  ) as pending_plan
FROM payments
WHERE subscriptionId = <subscription_id_from_step1>
ORDER BY createdAt DESC
LIMIT 1;
```

### Step 4: Check API Response
Make a request to `/api/tenant/subscriptions/current`:

```
GET /api/tenant/subscriptions/current
Response:
{
  "subscription": {
    "planId": "???",        ← SHOULD BE "basic"
    "status": "???",        ← SHOULD BE "active"
    ...
  },
  "plan": {
    "name": "???"           ← SHOULD BE plan name, not "Free Trial"
  }
}
```

---

## Likely Bug Locations

### Bug Location 1: planId Update Not Persisting
**File**: `/app/api/admin/payments/route.ts`
**Issue**: The update doesn't actually set `planId`
**Fix**: Ensure line 228 executes: `subscriptionUpdate.planId = payment.subscription.pendingUpgradePlanId;`

**Check**:
```typescript
if (payment.subscription.pendingUpgradePlanId) {
  console.log('Setting planId to:', payment.subscription.pendingUpgradePlanId);
  subscriptionUpdate.planId = payment.subscription.pendingUpgradePlanId;
}
```

### Bug Location 2: Wrong Subscription Being Updated
**File**: `/app/api/admin/payments/route.ts`
**Issue**: Updating wrong subscription ID
**Check**:
```typescript
console.log('Payment subscriptionId:', payment.subscriptionId);
console.log('Payment subscription tenant:', payment.subscription.tenantId);
// Verify this matches the tenant you're testing with
```

### Bug Location 3: Email Fetching Old Plan
**File**: `/app/api/admin/payments/route.ts` lines 267-270
**Issue**: Fetching `updatedSubscription.planId` but it's not actually updated
**Check**:
```typescript
console.log('Updated subscription planId:', updatedSubscription.planId);
// Should be "basic", not "trial"
```

### Bug Location 4: Race Condition
**Issue**: Email sent before database write completes
**Fix**: Email is sent AFTER the update completes, so this is unlikely

### Bug Location 5: Trial Recreated After Upgrade
**Issue**: Something resets subscription back to trial
**Locations to check**:
- `/api/tenant/subscriptions/current` - creates trial if no subscription exists
- Anywhere else that calls `subscription.create()`

---

## The "Remove Trial from Upgrade" Suggestion

You mentioned: "remove the trial activation from the upgrade flow because that gets handled now in the onboarding flow"

This suggests:
- **Current**: Trial is created in onboarding AND also in upgrade flow
- **Issue**: Upgrade might be creating a NEW trial subscription or resetting existing one
- **Solution**: Don't create/activate trial in upgrade endpoint - only in onboarding

**Locations creating trial**:
1. `/api/onboarding/apply/route.ts` lines 238-251 ✅ (correct place)
2. `/api/tenant/subscriptions/current/route.ts` lines 77-87 ⚠️ (creates if missing, OK)

---

## Recommended Immediate Actions

### 1. Add Logging
Add console.log statements in `/api/admin/payments/route.ts` to trace the update:

```typescript
// Line 228
if (payment.subscription.pendingUpgradePlanId) {
  console.log('[UPGRADE DEBUG] Setting planId to:', payment.subscription.pendingUpgradePlanId);
  subscriptionUpdate.planId = payment.subscription.pendingUpgradePlanId;
}

// Line 250
console.log('[UPGRADE DEBUG] Updated subscription:', {
  id: updatedSubscription.id,
  planId: updatedSubscription.planId,
  status: updatedSubscription.status,
  pendingUpgradePlanId: updatedSubscription.pendingUpgradePlanId,
});
```

### 2. Check Database Directly
Run the SQL queries above to see actual data.

### 3. Check Email Content
Is the email showing the actual `planName` parameter or a hardcoded "Free Trial"?

### 4. Consider Simpler Approach
You mentioned removing trial activation. This might be the right approach if:
- Trial setup should ONLY happen in onboarding
- Upgrade should NEVER touch trial status
- Only set `planId` and `pendingUpgradePlanId` in upgrade

---

## Next Steps

1. **Run diagnostic SQL queries** (Step 1-4 above)
2. **Check logs** with added console.log statements
3. **Verify**: Is `planId` actually "trial" in DB or is it updated to "basic"?
4. **If planId is still "trial"**: The update query isn't working
5. **If planId is "basic" but email says "trial"**: The email fetch logic is wrong
6. **If everything looks updated**: The `/current` endpoint might have caching issue

---

**Status**: Needs investigation
**Priority**: High - blocking production functionality
**Estimated Fix Time**: 30 minutes (after diagnosis)
