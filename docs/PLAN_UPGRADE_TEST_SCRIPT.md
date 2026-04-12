# Plan Upgrade Flow Testing Guide

## Test Overview
This guide provides manual tests to verify:
1. ✅ Upgrade flow works end-to-end
2. ✅ Plan status updates persist in database
3. ✅ Subscription data integrity after payment verification
4. ✅ Proration calculations are accurate

---

## Prerequisites

### Start Development Environment
```bash
npm run docker:up          # PostgreSQL + Nginx
npm run dev:all           # Both Next.js and Vite apps
```

### Verify Services Running
- Next.js: http://localhost:3000
- pgAdmin: http://localhost:5050
- PostgreSQL: localhost:5432

---

## Test 1: Trial → Basic Monthly Upgrade (With Payment)

### Step 1.1: Create Test Tenant
1. Go to `/admin/tenants/new`
2. Fill form:
   - **Name**: `Test Upgrade Tenant`
   - **Subdomain**: `test-upgrade-1`
   - **Owner Email**: `upgrade-test@test.com`
   - **Plan**: Select `Trial`
3. Click **Create Tenant**
4. ✅ **Verify**: Tenant created with Trial plan

### Step 1.2: Check Database State (Before Upgrade)
Open pgAdmin (http://localhost:5050):
1. Login: `admin@pgadmin.org` / `admin`
2. Navigate to PostgreSQL → Servers → bizcore
3. Right-click → Query Tool
4. Run query:
```sql
SELECT 
  s.id,
  s."tenantId",
  s."planId",
  s.status,
  s."pendingUpgradePlanId",
  s."currentPeriodStart",
  s."currentPeriodEnd",
  s."billingCycle"
FROM subscriptions s
WHERE s."tenantId" = (
  SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
)
ORDER BY s.id DESC
LIMIT 1;
```
5. ✅ **Expected Result**:
   - `planId`: `trial`
   - `status`: `trial`
   - `pendingUpgradePlanId`: `NULL`
   - `billingCycle`: `trial`

### Step 1.3: Login as Tenant and Initiate Upgrade
1. Go to `/dashboard/test-upgrade-1/billing/subscriptions`
2. You should see:
   - **Current Plan**: Trial (Free, 14-day countdown)
   - **Manage Plan** button
3. Click **Manage Plan** → Scroll to "Basic Monthly" plan card
4. Click **Upgrade** button
5. ✅ **Verify**: UpgradeFlowModal appears with:
   - "Upgrade to Basic Monthly (₱1,999/month)"
   - Proration calculation showing amount due

### Step 1.4: Submit GCash Payment
In the modal:
1. Confirm the upgrade plan
2. Select **Payment Method** → Choose **GCash**
3. Enter **GCash Transaction ID**: `TEST-GCash-001`
4. Click **Pay with GCash**
5. Modal shows "Verifying..." with 3-second polling

### Step 1.5: Check Database (Pending Upgrade State)
Run pgAdmin query again:
```sql
SELECT 
  s.id,
  s."tenantId",
  s."planId",
  s.status,
  s."pendingUpgradePlanId",
  s."upgradePendingAt"
FROM subscriptions s
WHERE s."tenantId" = (
  SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
)
ORDER BY s.id DESC
LIMIT 1;
```

6. ✅ **Expected Result**:
   - `planId`: `trial` (⚠️ Not changed yet)
   - `pendingUpgradePlanId`: `basic` (👈 Waiting for payment verification)
   - `upgradePendingAt`: Recent timestamp
   - `status`: `trial` (Still trial until payment verified)

### Step 1.6: Check Payment Record
Run query:
```sql
SELECT 
  p.id,
  p."subscriptionId",
  p.amount,
  p.status,
  p.metadata->'verificationStatus' as verification_status,
  p."submittedAt",
  p."createdAt"
FROM payments p
WHERE p."subscriptionId" = (
  SELECT s.id FROM subscriptions s
  WHERE s."tenantId" = (
    SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
  )
)
ORDER BY p.id DESC
LIMIT 1;
```

7. ✅ **Expected Result**:
   - `status`: `unpaid`
   - `verification_status`: `pending`
   - `amount`: Matches proration amount

### Step 1.7: Admin Approves Payment
1. Go to `/admin/payments`
2. Find payment from "Test Upgrade Tenant" (just submitted)
3. Click **[✓ Approve]** button
4. Admin notes: `Test upgrade verification`
5. Click **Verify** button
6. ✅ **Verify**: Modal closes, payment appears as approved

### Step 1.8: Check Database (After Admin Approval)
Run subscription query again:
```sql
SELECT 
  s.id,
  s."tenantId",
  s."planId",
  s.status,
  s."pendingUpgradePlanId",
  s."billingCycle",
  s."currentPeriodStart",
  s."currentPeriodEnd"
FROM subscriptions s
WHERE s."tenantId" = (
  SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
)
ORDER BY s.id DESC
LIMIT 1;
```

9. ✅ **Expected Result**:
   - `planId`: `basic` (✅ UPGRADED!)
   - `status`: `active`
   - `pendingUpgradePlanId`: `NULL` (Cleared)
   - `billingCycle`: `monthly`
   - `currentPeriodStart`: Today
   - `currentPeriodEnd`: Today + 30 days

### Step 1.9: Verify Tenant Sees Updated Plan
1. Go to `/dashboard/test-upgrade-1/billing/subscriptions`
2. ✅ **Expected**:
   - **Current Plan**: Basic Monthly (₱1,999/month)
   - **Next Renewal**: ~30 days from today
   - **Status Badge**: Active (green)

### Step 1.10: Check Payment Status
Run payment query again:
```sql
SELECT 
  p.id,
  p.status,
  p.metadata->'verificationStatus' as verification_status,
  p.metadata->'verifiedAt' as verified_at,
  p.metadata->'adminNotes' as admin_notes
FROM payments p
WHERE p."subscriptionId" = (
  SELECT s.id FROM subscriptions s
  WHERE s."tenantId" = (
    SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
  )
)
ORDER BY p.id DESC
LIMIT 1;
```

11. ✅ **Expected Result**:
    - `status`: `paid`
    - `verification_status`: `verified`
    - `verified_at`: Recent timestamp
    - `admin_notes`: "Test upgrade verification"

---

## Test 2: Basic Monthly → Premium Annual Upgrade (With Proration)

### Step 2.1: Use Existing Tenant from Test 1
Continue with `test-upgrade-1` that's now on Basic Monthly

### Step 2.2: Check Current Subscription
Run query:
```sql
SELECT 
  s.id,
  s."planId",
  s."billingCycle",
  s.status,
  s."currentPeriodEnd",
  EXTRACT(DAY FROM (s."currentPeriodEnd" - CURRENT_DATE)) as days_remaining
FROM subscriptions s
WHERE s."tenantId" = (
  SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
)
ORDER BY s.id DESC
LIMIT 1;
```

✅ **Expected**: `planId` = `basic`, `billingCycle` = `monthly`, ~30 days remaining

### Step 2.3: Tenant Initiates Upgrade to Premium Annual
1. Go to `/dashboard/test-upgrade-1/billing/subscriptions`
2. Scroll to "Premium Annual" card
3. Click **Upgrade** button
4. Modal shows:
   - Current: Basic Monthly (₱1,999)
   - New: Premium Annual (₱19,999)
   - **Proration**: Calculates unused balance from current cycle
   - **Amount Due**: Difference between plans

### Step 2.4: Submit Payment
1. Select **GCash** payment
2. Enter **GCash Transaction ID**: `TEST-GCash-002`
3. Click **Pay with GCash**

### Step 2.5: Verify Pending Upgrade
Run query:
```sql
SELECT 
  s."planId",
  s."pendingUpgradePlanId",
  s."upgradePendingAt"
FROM subscriptions s
WHERE s."tenantId" = (
  SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
)
ORDER BY s.id DESC
LIMIT 1;
```

✅ **Expected**: `planId` = `basic`, `pendingUpgradePlanId` = `premium`

### Step 2.6: Admin Approves Second Payment
1. Go to `/admin/payments`
2. Find newest payment (Premium upgrade)
3. Click **[✓ Approve]**
4. Verify payment

### Step 2.7: Verify Upgrade Applied
Run query:
```sql
SELECT 
  s."planId",
  s."billingCycle",
  s."currentPeriodStart",
  s."currentPeriodEnd",
  EXTRACT(DAY FROM (s."currentPeriodEnd" - s."currentPeriodStart")) as cycle_days
FROM subscriptions s
WHERE s."tenantId" = (
  SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
)
ORDER BY s.id DESC
LIMIT 1;
```

✅ **Expected**:
- `planId` = `premium`
- `billingCycle` = `annual`
- `currentPeriodEnd` = ~365 days from start

### Step 2.8: Tenant Dashboard Verification
1. Go to `/dashboard/test-upgrade-1/billing/subscriptions`
2. ✅ **Expected**:
   - **Current Plan**: Premium Annual (₱19,999/year)
   - **Status**: Active
   - **Renewal Date**: ~365 days away

---

## Test 3: Reject Payment & Retry

### Step 3.1: Create New Tenant for Rejection Test
1. Go to `/admin/tenants/new`
2. Create:
   - **Name**: `Test Payment Rejection`
   - **Subdomain**: `test-reject-1`
   - **Email**: `reject-test@test.com`
   - **Plan**: Trial
3. ✅ Tenant created

### Step 3.2: Initiate Upgrade
1. Login to `/dashboard/test-reject-1/billing/subscriptions`
2. Upgrade to Basic Monthly
3. Submit GCash payment (Reference: `TEST-REJECT-001`)
4. Modal shows "Verifying..."

### Step 3.3: Admin Rejects Payment
1. Go to `/admin/payments`
2. Find the pending payment
3. Click **[✗ Reject]** button
4. Enter reason: `Invalid transaction reference`
5. Click **Reject** button

### Step 3.4: Verify Subscription NOT Changed
Run query:
```sql
SELECT 
  s."planId",
  s.status,
  s."pendingUpgradePlanId"
FROM subscriptions s
WHERE s."tenantId" = (
  SELECT id FROM tenants WHERE subdomain = 'test-reject-1'
)
ORDER BY s.id DESC
LIMIT 1;
```

✅ **Expected**:
- `planId` = `trial` (Still on trial!)
- `status` = `trial`
- `pendingUpgradePlanId` = `NULL`

### Step 3.5: Verify Payment Status
Run query:
```sql
SELECT 
  p.status,
  p.metadata->'verificationStatus' as verification_status,
  p.metadata->'rejectionReason' as rejection_reason
FROM payments p
WHERE p."subscriptionId" = (
  SELECT s.id FROM subscriptions s
  WHERE s."tenantId" = (
    SELECT id FROM tenants WHERE subdomain = 'test-reject-1'
  )
)
ORDER BY p.id DESC
LIMIT 1;
```

✅ **Expected**:
- `status` = `unpaid`
- `verification_status` = `rejected`
- `rejection_reason` = `Invalid transaction reference`

### Step 3.6: Tenant Can Retry
1. Go to `/dashboard/test-reject-1/billing/subscriptions`
2. Upgrade to Basic Monthly again
3. Submit payment (Reference: `TEST-REJECT-RETRY-001`)
4. Should work normally

---

## Test 4: Plan Status Persistence (Long-term)

### Step 4.1: Browser Refresh Test
1. Go to `/dashboard/test-upgrade-1/billing/subscriptions`
2. ✅ Verify plan shows "Basic Monthly"
3. **Hard refresh** (Ctrl+F5)
4. ✅ Verify plan STILL shows "Basic Monthly" (data from DB)

### Step 4.2: Logout & Login Test
1. Logout from tenant dashboard
2. Wait 5 seconds
3. Login again to the same subdomain
4. Go to subscriptions page
5. ✅ Verify plan shows "Basic Monthly"

### Step 4.3: Direct Database Check
```sql
-- Get all upgraded tenants
SELECT 
  t.subdomain,
  t.name,
  s."planId",
  s.status,
  s."currentPeriodEnd",
  COUNT(p.id) as payment_count
FROM tenants t
JOIN subscriptions s ON t.id = s."tenantId"
LEFT JOIN payments p ON s.id = p."subscriptionId"
WHERE t.subdomain LIKE 'test-%'
GROUP BY t.id, t.subdomain, t.name, s.id, s."planId", s.status, s."currentPeriodEnd"
ORDER BY s."currentPeriodEnd" DESC;
```

✅ **Expected**: All upgraded tenants show their new plan, all payments associated

---

## Test 5: API Response Validation

### Step 5.1: Test Upgrade Endpoint Response
Open DevTools (F12) → Network tab:
1. Initiate upgrade from tenant dashboard
2. Find POST request to `/api/tenant/subscriptions/upgrade`
3. Check response body:
```json
{
  "success": true,
  "subscription": {
    "id": 123,
    "planId": "trial",
    "pendingUpgradePlanId": "basic",
    "status": "trial",
    "upgradePendingAt": "2025-12-07T10:30:00Z"
  },
  "proration": {
    "currentCycleDays": 30,
    "amountDue": 1852,
    ...
  }
}
```

✅ **Expected**: 
- Returns **UPDATED subscription** (not stale data)
- `pendingUpgradePlanId` is set correctly
- Proration calculation included

### Step 5.2: Test Payment Submit Response
In DevTools, find POST `/api/tenant/subscriptions/payment/submit`:
```json
{
  "success": true,
  "payment": {
    "id": 456,
    "status": "unpaid",
    "amount": 1852,
    "metadata": {
      "verificationStatus": "pending",
      "submittedAt": "2025-12-07T10:35:00Z"
    }
  }
}
```

✅ **Expected**: Payment created with `unpaid` status, polling ready

### Step 5.3: Test Payment Verify Response
In `/admin/payments`, find PUT `/api/admin/payments`:
```json
{
  "success": true,
  "payment": {
    "status": "paid",
    "metadata": {
      "verificationStatus": "verified"
    }
  },
  "subscription": {
    "planId": "basic",
    "status": "active",
    "pendingUpgradePlanId": null,
    "billingCycle": "monthly"
  }
}
```

✅ **Expected**: Subscription updated with new plan, pending cleared

---

## Test 6: Invoice Creation & Persistence

### Step 6.1: Check Invoices Created
```sql
SELECT 
  i.id,
  i."invoiceNumber",
  i.status,
  i.subtotal,
  i.total,
  i."issuedAt",
  i."paidAt",
  p.status as payment_status
FROM invoices i
LEFT JOIN payments p ON i."paymentId" = p.id
WHERE i."subscriptionId" = (
  SELECT s.id FROM subscriptions s
  WHERE s."tenantId" = (
    SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
  )
)
ORDER BY i."issuedAt" DESC;
```

✅ **Expected**: Multiple invoices for each upgrade, marked as `issued` or `paid`

### Step 6.2: Invoice Line Items
Check that line items contain:
```sql
SELECT 
  i."invoiceNumber",
  i."lineItems"
FROM invoices i
WHERE i."subscriptionId" = (
  SELECT s.id FROM subscriptions s
  WHERE s."tenantId" = (
    SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
  )
)
LIMIT 1;
```

✅ **Expected**: Line items describe the upgrade (e.g., "Upgrade from trial to basic")

---

## Test 7: Billing Cycle Dates Correctness

### Step 7.1: Monthly Cycle (30 days)
After upgrading to Monthly plan, check:
```sql
SELECT 
  s."planId",
  s."billingCycle",
  s."currentPeriodStart",
  s."currentPeriodEnd",
  EXTRACT(DAY FROM (s."currentPeriodEnd" - s."currentPeriodStart")) as cycle_days
FROM subscriptions s
WHERE s."tenantId" = (
  SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
)
AND s."planId" = 'basic'
LIMIT 1;
```

✅ **Expected**: `cycle_days` ≈ 30

### Step 7.2: Annual Cycle (365 days)
After upgrading to Annual plan, check:
```sql
SELECT 
  s."planId",
  s."billingCycle",
  EXTRACT(DAY FROM (s."currentPeriodEnd" - s."currentPeriodStart")) as cycle_days
FROM subscriptions s
WHERE s."tenantId" = (
  SELECT id FROM tenants WHERE subdomain = 'test-upgrade-1'
)
AND s."planId" = 'premium'
LIMIT 1;
```

✅ **Expected**: `cycle_days` ≈ 365

---

## Test 8: Email Verification

### Step 8.1: Check Email Logs
Check your email inbox (upgrade-test@test.com):
- [ ] **Confirmation email** after payment submission
- [ ] **Verification email** after admin approval
- [ ] **Success email** with new plan details

### Step 8.2: Check Email Content
Each email should contain:
- ✅ Correct tenant name
- ✅ Correct plan name
- ✅ Correct amount
- ✅ Renewal date
- ✅ Action links (if applicable)

---

## Cleanup

### Drop Test Tenants
```sql
DELETE FROM tenants 
WHERE subdomain LIKE 'test-%';
```

This cascades to delete subscriptions, payments, invoices, etc.

---

## Success Criteria

| Test | Expected Result | Status |
|------|-----------------|--------|
| Test 1: Trial → Basic | Plan upgrades after payment approval | ⬜ |
| Test 2: Basic → Premium | Proration calculated, annual cycle applied | ⬜ |
| Test 3: Payment Rejection | Subscription stays on old plan | ⬜ |
| Test 4: Persistence | Plan persists after refresh/logout | ⬜ |
| Test 5: API Responses | Returns updated subscriptions (not stale) | ⬜ |
| Test 6: Invoices | Created for each upgrade, linked to payments | ⬜ |
| Test 7: Billing Cycles | Monthly = 30 days, Annual = 365 days | ⬜ |
| Test 8: Emails | All notifications sent with correct info | ⬜ |

---

## Troubleshooting

### Plan Not Updating After Approval
1. Check `/api/admin/payments/route.ts` line 206:
   ```typescript
   if (payment.subscription.pendingUpgradePlanId) {
     subscriptionUpdate.planId = payment.subscription.pendingUpgradePlanId;
   }
   ```
2. Verify `pendingUpgradePlanId` is set during upgrade

### Proration Calculation Wrong
1. Check `/lib/proration.ts` calculations
2. Run debug endpoint: `/api/tenant/subscriptions/cycle-debug`

### Email Not Sending
1. Check `.env.local` SMTP settings
2. Check `/app/api/admin/payments/route.ts` email function calls

### Stale Data in Modal
1. Ensure upgrade endpoint returns updated subscription object
2. Check line in `/app/api/tenant/subscriptions/upgrade/route.ts`
