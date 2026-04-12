# 📑 Plan Upgrade Testing Suite - Complete Index

## 📌 Start Here

> **New to the testing suite?** Start with this document, then follow the links below.

---

## 🎯 What You're Testing

The BizCore **subscription plan upgrade flow** with focus on:
- ✅ Upgrade works end-to-end (Trial → Basic → Premium → Annual)
- ✅ Plan status updates **persist** in database
- ✅ Payment processing and verification
- ✅ Proration calculations
- ✅ Billing cycle calculations (30 vs 365 days)

---

## 📚 Documentation Structure

### 🚀 **For Quick Testing (30 minutes)**
**Document**: [`QUICK_START_PLAN_UPGRADE_TEST.md`](QUICK_START_PLAN_UPGRADE_TEST.md)

Quick reference with:
- 5-minute setup instructions
- 4 core test scenarios
- SQL verification queries
- Success checklist
- Quick troubleshooting

**Best for**: Getting up and running quickly

---

### 🧪 **For Detailed Manual Testing (1-2 hours)**
**Document**: [`PLAN_UPGRADE_TEST_SCRIPT.md`](PLAN_UPGRADE_TEST_SCRIPT.md)

Comprehensive step-by-step guide with 8 test scenarios:
1. Trial → Basic Monthly upgrade (with payment)
2. Basic Monthly → Premium Annual (proration)
3. Payment rejection & retry
4. Plan persistence (refresh, logout, login)
5. API response validation
6. Invoice creation & linking
7. Billing cycle date correctness
8. Email notifications

**Each test includes**:
- Detailed step-by-step instructions
- Expected database states (before/after)
- SQL queries to verify results
- Success criteria
- Troubleshooting tips

**Best for**: Thorough validation of all upgrade scenarios

---

### 📖 **For Complete Reference (when needed)**
**Document**: [`PLAN_UPGRADE_TEST_README.md`](PLAN_UPGRADE_TEST_README.md)

Full documentation including:
- API endpoint details
- Database schema validation
- Using pgAdmin for verification
- Response structure examples
- Performance expectations
- Related code file locations
- Comprehensive troubleshooting

**Best for**: Deep understanding and reference

---

### 📊 **For Overview & Summary**
**Document**: [`PLAN_UPGRADE_TESTING_SUMMARY.md`](PLAN_UPGRADE_TESTING_SUMMARY.md)

High-level summary with:
- What's being tested and why
- Critical code sections
- Database query examples
- Success criteria matrix
- Quick troubleshooting table
- Key learnings

**Best for**: Understanding scope and architecture

---

### 📦 **For Complete Package Overview**
**Document**: [`PLAN_UPGRADE_TESTING_COMPLETE.md`](PLAN_UPGRADE_TESTING_COMPLETE.md)

Executive summary of the entire testing suite:
- What was created
- How to use the suite
- Test coverage details
- Key fixes being validated
- Testing timeline

**Best for**: Understanding what's in the package

---

## 🔄 Recommended Reading Order

### Option A: Quick Path (30 min)
```
1. This file (2 min)
   ↓
2. QUICK_START_PLAN_UPGRADE_TEST.md (5 min)
   ↓
3. Setup services (2 min)
   ↓
4. Run 4 test scenarios (20 min)
   ↓
5. Review success checklist (1 min)
```

### Option B: Comprehensive Path (2-3 hours)
```
1. This file (2 min)
   ↓
2. PLAN_UPGRADE_TESTING_SUMMARY.md (10 min)
   ↓
3. QUICK_START_PLAN_UPGRADE_TEST.md (5 min)
   ↓
4. Setup services (2 min)
   ↓
5. PLAN_UPGRADE_TEST_SCRIPT.md - Run all 8 tests (90-120 min)
   ↓
6. PLAN_UPGRADE_TEST_README.md - Reference as needed (as needed)
   ↓
7. Review success criteria (5 min)
```

### Option C: Deep Dive (1 hour reference)
```
1. PLAN_UPGRADE_TEST_README.md
   ↓
2. Review critical code sections
   ↓
3. Check database schema
   ↓
4. Run specific tests as needed
```

---

## 🗂️ All Testing Documents

| Document | Purpose | Time | Best For |
|----------|---------|------|----------|
| **QUICK_START_PLAN_UPGRADE_TEST.md** | Quick reference | 30 min | Quick validation |
| **PLAN_UPGRADE_TEST_SCRIPT.md** | Detailed manual tests | 1-2 hours | Comprehensive testing |
| **PLAN_UPGRADE_TEST_README.md** | Complete documentation | Reference | Deep reference |
| **PLAN_UPGRADE_TESTING_SUMMARY.md** | Overview & checklist | 10 min | Understanding scope |
| **PLAN_UPGRADE_TESTING_COMPLETE.md** | Package overview | 5 min | Package understanding |
| **This file** | Navigation index | 5 min | Finding what you need |

---

## 🏃 Quick Start (Copy-Paste Ready)

### 1. Start Services
```bash
# Terminal 1: PostgreSQL + Nginx
npm run docker:up

# Terminal 2: Next.js + Vite
npm run dev:all
```

### 2. Verify Services
```
App:      http://localhost:3000
pgAdmin:  http://localhost:5050
```

### 3. Run Tests
```bash
npm run test:upgrade           # Automated checks
```

### 4. Follow Manual Tests
Open: `QUICK_START_PLAN_UPGRADE_TEST.md`

---

## ✅ Success Criteria

Your upgrade flow is working when **ALL** of these pass:

- [ ] Test 1: Trial → Basic upgrade works
- [ ] Test 2: Proration calculates correctly  
- [ ] Test 3: Payment rejection prevents upgrade
- [ ] Test 4: Plan persists after refresh/logout
- [ ] Test 5: API returns correct response structure
- [ ] Test 6: Invoices created and linked
- [ ] Test 7: Billing cycles correct (30 vs 365 days)
- [ ] Test 8: Emails sent with correct info

---

## 🔗 Code Being Tested

### APIs Validating
```
POST /api/tenant/subscriptions/upgrade           → Initiates upgrade
POST /api/tenant/subscriptions/payment/submit    → Submits payment
GET  /api/tenant/subscriptions/payment/status    → Polls status
PUT  /api/admin/payments                         → Verifies payment
```

### Key Files
```
/app/api/tenant/subscriptions/upgrade/route.ts
/app/api/tenant/subscriptions/payment/submit/route.ts
/app/api/admin/payments/route.ts
/lib/proration.ts
/components/billing/UpgradeFlowModal.tsx
```

### Database Tables
```
subscriptions   → planId, pendingUpgradePlanId, status, billingCycle
payments        → status, amount, metadata
invoices        → status, total, lineItems
```

---

## 🎓 Understanding the Tests

### Test 1: Basic Upgrade
```
State Machine:
  TRIAL (planId: "trial")
    ↓ [upgrade to basic]
  TRIAL (pendingUpgradePlanId: "basic")
    ↓ [admin approves]
  BASIC (planId: "basic") ✅
```

### Test 2: Proration
```
Logic:
  Current price: ₱1,999 (30 days = ₱66/day)
  Days remaining: 14
  Unused balance: 14 × ₱66 = ₱924
  New price: ₱19,999
  Amount due: ₱19,999 - ₱924 = ₱19,075
```

### Test 3: Rejection
```
When admin rejects:
  - Payment status: "paid" → "unpaid"
  - Subscription: unchanged (still on old plan)
  - Tenant: can retry upgrade immediately
```

### Test 4: Persistence
```
Fresh data from database:
  1. Hard refresh (Ctrl+F5) → planId from DB
  2. Logout/login → planId from new session
  3. Browser cache cleared → planId from API
```

---

## 🐛 Common Issues & Quick Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| Plan not updating | `/api/admin/payments/route.ts:206` | Add: `subscriptionUpdate.planId = payment.subscription.pendingUpgradePlanId` |
| Stale data in modal | `/api/tenant/subscriptions/upgrade/route.ts:118` | Return: updated subscription from `.update()` |
| Wrong billing cycle | `/app/api/admin/payments/route.ts:75` | Use plan's `billingCycle` field |
| Email not sending | `.env.local` | Check SMTP config |
| DB not connected | `npm run docker:up` | Start PostgreSQL |
| API not running | `npm run dev:all` | Start Next.js |

---

## 📊 Test Matrix

Which document covers what:

|  | Quick Start | Test Script | README | Summary | Complete |
|---|---|---|---|---|---|
| **Setup** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Test 1: Basic** | ✅ | ✅ (detailed) | ✅ | ✅ | ✅ |
| **Test 2: Proration** | ✅ | ✅ (detailed) | ✅ | ✅ | ✅ |
| **Test 3: Rejection** | ✅ | ✅ (detailed) | ✅ | ✅ | ✅ |
| **Test 4: Persistence** | ✅ | ✅ (detailed) | ✅ | ✅ | ✅ |
| **Test 5-8: Data** | ✗ | ✅ (detailed) | ✅ | ✅ | ✅ |
| **API Details** | ✗ | ✓ | ✅ | ✓ | ✗ |
| **Troubleshooting** | ✓ | ✅ | ✅ | ✓ | ✗ |
| **Reference** | ✗ | ✓ | ✅ | ✓ | ✗ |
| **SQL Queries** | ✓ | ✅ | ✓ | ✓ | ✗ |

---

## 🎯 Your Testing Journey

### Day 1: Understanding
```
Read documentation (30 min)
  QUICK_START_PLAN_UPGRADE_TEST.md
  PLAN_UPGRADE_TESTING_SUMMARY.md
```

### Day 1-2: Quick Testing
```
Setup environment (2 min)
Run 4 quick tests (30 min)
Verify database (10 min)
Check success criteria (5 min)
```

### Day 2-3: Comprehensive Testing
```
Setup environment (2 min)
Run all 8 tests from PLAN_UPGRADE_TEST_SCRIPT.md (90 min)
Use PLAN_UPGRADE_TEST_README.md for reference
Verify all success criteria
```

---

## 📞 Need Help?

### For Quick Answers
→ See troubleshooting section in **QUICK_START_PLAN_UPGRADE_TEST.md**

### For API Details
→ See "API ENDPOINT VALIDATION" in **PLAN_UPGRADE_TEST_README.md**

### For Database Queries
→ See "DATABASE QUERIES FOR VERIFICATION" in **PLAN_UPGRADE_TEST_README.md**

### For Code Locations
→ See "RELATED FILES" in **PLAN_UPGRADE_TEST_README.md**

### For Complete Overview
→ Read **PLAN_UPGRADE_TESTING_COMPLETE.md**

---

## 🚀 I'm Ready - What's Next?

1. **Open**: `QUICK_START_PLAN_UPGRADE_TEST.md`
2. **Follow**: Step-by-step instructions (4 tests, 30 min)
3. **Verify**: Success criteria checklist
4. **Done**: Report results ✅

---

## 📝 Document Tree

```
├─ 📖 INDEX (you are here)
│
├─ 🚀 QUICK_START_PLAN_UPGRADE_TEST.md
│  ├─ 5-minute setup
│  ├─ 4 test scenarios
│  ├─ SQL queries
│  └─ Quick troubleshooting
│
├─ 🧪 PLAN_UPGRADE_TEST_SCRIPT.md
│  ├─ Test 1: Trial → Basic
│  ├─ Test 2: Basic → Premium (proration)
│  ├─ Test 3: Payment rejection
│  ├─ Test 4: Persistence
│  ├─ Test 5: API responses
│  ├─ Test 6: Invoices
│  ├─ Test 7: Billing cycles
│  └─ Test 8: Email notifications
│
├─ 📚 PLAN_UPGRADE_TEST_README.md
│  ├─ Complete documentation
│  ├─ API details
│  ├─ Database schema
│  ├─ pgAdmin usage
│  ├─ Code files
│  └─ Comprehensive troubleshooting
│
├─ 📊 PLAN_UPGRADE_TESTING_SUMMARY.md
│  ├─ Overview
│  ├─ What's being tested
│  ├─ Code sections
│  ├─ Database queries
│  └─ Success criteria
│
└─ 📦 PLAN_UPGRADE_TESTING_COMPLETE.md
   ├─ Package overview
   ├─ Files created
   ├─ How to use
   └─ Key takeaways
```

---

## ⏱️ Time Estimates

```
Setup:                  2 minutes
Quick tests (4):       30 minutes
Detailed tests (8):   90 minutes
Verification:          5 minutes
─────────────────────
Total quick path:     40 minutes
Total full path:     140 minutes (2.3 hours)
```

---

## 🎓 What You'll Learn

After running these tests, you'll understand:
- ✅ How the upgrade flow works end-to-end
- ✅ How data persists in the database
- ✅ How payment processing integrates
- ✅ How proration calculations work
- ✅ How billing cycles are calculated
- ✅ What happens at each state transition
- ✅ How to verify with SQL queries
- ✅ Where to find relevant code

---

## ✨ Ready to Start?

Choose your path:

### 🏃 Quick (30 min)
→ Open **QUICK_START_PLAN_UPGRADE_TEST.md**

### 🚶 Thorough (2 hours)
→ Open **PLAN_UPGRADE_TEST_SCRIPT.md**

### 📖 Reference (anytime)
→ Open **PLAN_UPGRADE_TEST_README.md**

---

**Last Updated**: December 7, 2025  
**Status**: ✅ Ready for Testing  
**Confidence Level**: 🟢 All critical paths covered
