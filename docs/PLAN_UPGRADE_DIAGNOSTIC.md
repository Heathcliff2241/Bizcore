# Plan Upgrade Diagnostic and Fix

## Issue Summary
- User upgrades from "Free Trial" to a paid plan (e.g., "Standard Monthly")
- Admin approves the payment
- Email shows "Plan: Free Trial" instead of the upgraded plan name
- Dashboard still shows "Free Trial" instead of the upgraded plan

## Root Cause
The `planId` in the subscription record is NOT being updated from "trial" to the new plan ID when the admin approves the payment.

## Diagnostic Steps

### Step 1: Check the Current Subscription Status (Get Tenant ID First)

```sql
-- First, find your tenant
SELECT id, name, subdomain FROM tenants WHERE name LIKE '%Quartz%' OR subdomain LIKE '%quartz%';
```

### Step 2: Check the Subscription Record

```sql
-- Replace <TENANT_ID> with the actual tenant ID
SELECT 
  id,
  tenantId,
  planId,
  status,
  billingCycle,
  pendingUpgradePlanId,
  currentPeriodStart,
  currentPeriodEnd,
  createdAt,
  updatedAt
FROM subscriptions
WHERE tenantId = <TENANT_ID>;
```

**What to look for:**
- [ ] `planId` should NOT be "trial" - it should be "basic", "premium", etc.
- [ ] `status` should be "active" (not "trial")
- [ ] `billingCycle` should be "monthly" or "annual" (not "trial")
- [ ] `pendingUpgradePlanId` should be NULL after approval
- [ ] `currentPeriodEnd` should be ~30 days from now (for monthly) or ~365 days (for annual)

**If planId is still "trial":** The UPDATE query is not working properly ❌

### Step 3: Check the Payment Record

```sql
-- Check if the payment was approved
SELECT 
  id,
  subscriptionId,
  status,
  amount,
  metadata,
  createdAt,
  updatedAt
FROM payments
WHERE subscriptionId = <SUBSCRIPTION_ID>
ORDER BY createdAt DESC
LIMIT 1;
```

**What to look for:**
- [ ] `status` should be "paid"
- [ ] `metadata` should have `"verificationStatus": "verified"`

### Step 4: Check Plan Table

```sql
-- Make sure the plans exist
SELECT id, name, description, billingCycle, isActive FROM plans WHERE isActive = true;
```

**Expected output:**
```
id         | name                  | description                                  | billingCycle | isActive
-----------|----------------------|----------------------------------------------|--------------|----------
trial      | Free Trial            | 14 days full access                          | trial        | true
basic      | Standard Monthly      | Perfect for small businesses                 | monthly      | true
premium    | Standard Yearly       | Save ₱3,989 per year                         | annual       | true
enterprise | Enterprise            | Custom pricing for large businesses           | monthly      | true
```

---

## Manual Fix (If Database Shows planId Still = "trial")

If the subscription's `planId` is still "trial" after payment approval, you can manually update it:

```sql
-- Replace <TENANT_ID> with your tenant ID
-- Replace <NEW_PLAN_ID> with the plan you upgraded to (basic, premium, enterprise)
UPDATE subscriptions
SET 
  planId = '<NEW_PLAN_ID>',
  status = 'active',
  billingCycle = 'monthly',  -- Change to 'annual' if upgrading to premium/yearly
  currentPeriodStart = NOW(),
  currentPeriodEnd = NOW() + INTERVAL '30 days',  -- or '365 days' for annual
  renewalDate = NOW() + INTERVAL '30 days',
  nextPaymentDate = NOW() + INTERVAL '30 days',
  pendingUpgradePlanId = NULL,
  planChangedAt = NOW(),
  updatedAt = NOW()
WHERE tenantId = <TENANT_ID>;
```

**Verify the fix:**
```sql
SELECT planId, status, billingCycle FROM subscriptions WHERE tenantId = <TENANT_ID>;
```

---

## Code Changes Made (v1)

### File: `/app/api/admin/payments/route.ts`

**Change 1: Better logging in subscription update**
- Added detailed logging to show what planId is being set
- Verify the update was applied by checking the returned subscription object

**Change 2: Use updated subscription for email**
- Changed email sending to use `updatedSubscription.planId` (the freshly updated value from DB)
- Instead of trying to infer from the original `payment.subscription.pendingUpgradePlanId`
- This ensures we're using the actual value written to the database

**Example of the fix:**
```typescript
// OLD (potentially wrong):
const planIdToFetch = payment.subscription.pendingUpgradePlanId || updatedSubscription.planId;

// NEW (correct):
const planIdToFetch = updatedSubscription.planId;  // Use what we actually stored
```

---

## Next Steps if Fix Doesn't Work

### If Logs Show planId IS Being Set Correctly But Email Still Shows "Trial"

1. **Check the email template** - It might be hardcoding "Free Trial"
   - Search for `sendTenantPaymentApprovedEmail` in `/lib/email/`
   - Make sure it's using the `planName` parameter correctly

2. **Check cache** - Browser cache might be showing old email
   - Clear browser cache and resend email manually

### If Logs Show planId is NOT Being Set

1. **Check Prisma connection** - Database connection might be lost
   - Look for connection errors in server logs

2. **Check for Prisma transaction issues** - The update might be in a transaction that's not committing
   - Look for transaction-related errors

### If planId Shows as Different Plan But Email Still Wrong

1. **Check email sending time** - Email might be sent before DB update completes
   - The code updates first, then sends email, so this shouldn't happen
   - But check logs for timing issues

---

## Testing the Fix

### Test 1: Manual Payment Approval Flow

1. Create a new tenant (or use existing test tenant)
2. Go to dashboard → Billing → Select a plan to upgrade
3. Submit payment (GCash or manual)
4. Go to admin panel → Payments
5. Approve the payment

**Expected result:**
- Logs should show: `[PUT /api/admin/payments] UPGRADE - Setting planId to: basic` (or whatever plan)
- Logs should show: `[PUT /api/admin/payments] AFTER UPDATE - subscription: { planId: 'basic', ... }`
- Email should say: "Plan: Standard Monthly" (or whatever plan name matches)
- Dashboard should show the new plan name

### Test 2: Check Database Directly

Run the diagnostic SQL queries above after approval to verify:
- [ ] `subscriptions.planId` = new plan (not "trial")
- [ ] `subscriptions.status` = "active"
- [ ] `subscriptions.billingCycle` = "monthly" or "annual"

### Test 3: Check /current Endpoint

```
GET /api/tenant/subscriptions/current
```

Response should have:
```json
{
  "subscription": {
    "planId": "basic",  // Not "trial"
    "status": "active",  // Not "trial"
    "billingCycle": "monthly"  // Not "trial"
  },
  "plan": {
    "name": "Standard Monthly",  // Not "Free Trial"
    "price": 1999,
    "cycle": "monthly"
  }
}
```

---

## Troubleshooting Checklist

- [ ] Check server logs for errors during payment approval
- [ ] Verify plan records exist in database
- [ ] Verify subscription was created in onboarding
- [ ] Verify payment has pendingUpgradePlanId set before approval
- [ ] Verify subscription update is actually persisting to database
- [ ] Verify email is using correct plan name from database

---

## Related Files

- Payment approval logic: `/app/api/admin/payments/route.ts`
- Email templates: `/lib/email/paymentEmails.ts`
- Subscription upgrade: `/app/api/tenant/subscriptions/upgrade/route.ts`
- Subscription current: `/app/api/tenant/subscriptions/current/route.ts`
- Onboarding: `/app/api/onboarding/apply/route.ts`
- Database schema: `/prisma/schema.prisma`
- Plan seed data: `/prisma/migrations/20251205022000_add_plan_model_with_seed/migration.sql`

