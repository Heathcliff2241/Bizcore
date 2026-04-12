# 🚀 PLAN UPGRADE FLOW - QUICK START GUIDE

## ⚡ 5-Minute Setup

### 1. Start Services
```bash
npm run docker:up          # PostgreSQL + Nginx
npm run dev:all           # Next.js + Vite
```

### 2. Access Points
```
App:      http://localhost:3000
pgAdmin:  http://localhost:5050  (admin@pgadmin.org / admin)
API:      http://localhost:3000/api/...
```

### 3. Quick Test
```bash
npm run test:upgrade      # Automated environment check
```

---

## 📋 Test Workflow (30 minutes)

### Test 1: Trial → Basic (10 min)
```
1. Go to /admin/tenants/new
2. Create "Test Tenant 1" with Trial plan
3. Login to /dashboard/test-tenant-1/billing/subscriptions
4. Click Upgrade → Select Basic Monthly
5. Submit GCash payment (TEST-REF-001)
6. Go to /admin/payments → Approve
7. Verify: planId = "basic" in DB
```

### Test 2: Basic → Premium (10 min)
```
1. Same tenant, upgrade to Premium Annual
2. Verify proration shown
3. Submit GCash payment (TEST-REF-002)
4. Admin approves
5. Verify: billingCycle = "annual", ~365 days
```

### Test 3: Persistence (5 min)
```
1. Hard refresh (Ctrl+F5)
2. Verify plan still shows "Premium Annual"
3. Logout/login
4. Verify plan still correct
```

### Test 4: Rejection (5 min)
```
1. Create new tenant, initiate upgrade
2. Admin rejects payment
3. Verify: planId unchanged, still on old plan
4. Tenant can retry upgrade
```

---

## 🔍 Quick DB Checks

**pgAdmin → Query Tool**

### Check Subscription State
```sql
SELECT "planId", status, "pendingUpgradePlanId"
FROM subscriptions
WHERE "tenantId" IN (SELECT id FROM tenants WHERE subdomain LIKE 'test%')
ORDER BY id DESC LIMIT 5;
```

### Check Pending Upgrades
```sql
SELECT s."planId", s."pendingUpgradePlanId", p.status
FROM subscriptions s
LEFT JOIN payments p ON s.id = p."subscriptionId"
WHERE s."pendingUpgradePlanId" IS NOT NULL;
```

### Check Billing Cycles
```sql
SELECT s."planId", s."billingCycle",
  EXTRACT(DAY FROM (s."currentPeriodEnd" - s."currentPeriodStart")) as cycle_days
FROM subscriptions s
WHERE s.status = 'active';
```

---

## ✅ Success Checklist

- [ ] Test 1: Upgrade works, plan changes
- [ ] Test 2: Proration calculated, annual cycle set
- [ ] Test 3: Plan persists after refresh
- [ ] Test 4: Rejection doesn't change plan
- [ ] All API endpoints respond correctly
- [ ] Emails received for each step
- [ ] No database errors in logs

---

## 🐛 If Something Fails

### Plan Not Updating
```
Check: /app/api/admin/payments/route.ts line 206
Should have: subscriptionUpdate.planId = payment.subscription.pendingUpgradePlanId
```

### Stale Data in Modal
```
Check: /app/api/tenant/subscriptions/upgrade/route.ts line 118
Should return: subscription from UPDATE query (not before)
```

### Wrong Billing Cycle
```
Check: /app/api/admin/payments/route.ts line 75
Should calculate: annual = 365 days, monthly = 30 days
```

### Email Not Sending
```
Check: .env.local has SMTP config
Check: /app/api/admin/payments/route.ts line 150+ email calls
```

---

## 📊 What's Being Validated

| Component | Test | Expected |
|-----------|------|----------|
| Upgrade Endpoint | Returns data | Updated subscription (not stale) |
| Payment Submit | Creates record | Status = "unpaid", pending = true |
| Admin Verify | Updates subscription | planId changed, pending cleared |
| Proration | Calculates amount | Correct unused balance deducted |
| Billing Cycle | Sets dates | Monthly = 30 days, Annual = 365 days |
| Database | Persists | Data visible after refresh/login |
| Invoices | Creates for each | Linked to payments, correct amount |
| Emails | Sends notifications | Confirmation + approval |

---

## 📞 Full Documentation

For detailed step-by-step tests:
- **PLAN_UPGRADE_TEST_SCRIPT.md** - Complete manual test guide
- **PLAN_UPGRADE_TEST_README.md** - Full documentation with troubleshooting

---

## ⏱️ Estimated Time

- **Setup**: 2 minutes (docker up + dev)
- **Test 1**: 10 minutes (trial → basic)
- **Test 2**: 10 minutes (basic → premium)
- **Test 3-4**: 10 minutes (persistence + rejection)
- **Total**: ~30 minutes for full validation

---

## 🎯 Key Files to Know

```
Components:
  /components/billing/UpgradeFlowModal.tsx        (UI for upgrade)
  
APIs:
  /app/api/tenant/subscriptions/upgrade            (Initiate upgrade)
  /app/api/tenant/subscriptions/payment/submit     (Submit payment)
  /app/api/admin/payments                          (Verify/reject)
  
Database:
  subscriptions table (planId, pendingUpgradePlanId, status)
  payments table      (status, amount, metadata)
  invoices table      (status, total, lineItems)
```

---

**Status**: ✅ Ready to Test
**Last Updated**: December 7, 2025
