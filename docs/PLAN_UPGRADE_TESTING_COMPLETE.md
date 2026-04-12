# 🧪 Plan Upgrade Flow Testing Suite - Complete Package

## 📦 What Was Created

I've created a **complete testing suite** for the BizCore plan upgrade flow with automated checks and manual test procedures. The suite validates that:

✅ **Upgrade Flow Works** - Trial → Basic → Premium → Annual plans
✅ **Plan Status Persists** - Database updates persist across sessions
✅ **Payment Processing** - GCash submission and admin verification
✅ **Billing Cycles** - Correct calculation (30 days vs 365 days)
✅ **Data Integrity** - No orphaned records, complete history
✅ **State Machine** - Proper subscription state transitions

---

## 📋 Files Created

### 1. **QUICK_START_PLAN_UPGRADE_TEST.md** ⭐ START HERE
**Quick reference** - 5-minute setup, 30-minute test workflow

Content:
- Quick service startup commands
- 4 test scenarios with exact steps
- Quick SQL queries for verification
- Success checklist
- Troubleshooting quick links

**Run Time**: 30 minutes for complete testing

---

### 2. **PLAN_UPGRADE_TEST_SCRIPT.md** - DETAILED MANUAL GUIDE
**Comprehensive manual testing** - Step-by-step instructions for 8 test scenarios

Content:
- **Test 1**: Trial → Basic Monthly upgrade (with payment)
- **Test 2**: Basic Monthly → Premium Annual (with proration)
- **Test 3**: Payment rejection & retry
- **Test 4**: Plan status persistence (refresh, logout, logout)
- **Test 5**: API response validation
- **Test 6**: Invoice creation & persistence
- **Test 7**: Billing cycle date correctness
- **Test 8**: Email notifications

Each test includes:
- Step-by-step instructions
- Expected database states
- SQL verification queries
- Success criteria
- Troubleshooting tips

**Run Time**: 45-60 minutes for all 8 tests

---

### 3. **PLAN_UPGRADE_TEST_README.md** - COMPLETE DOCUMENTATION
**Full reference documentation** - API details, schema info, troubleshooting

Content:
- Overview of testing approach
- Detailed test scenarios with state diagrams
- Using pgAdmin for verification
- Database schema validation
- API endpoint details
- Success criteria checklist
- Troubleshooting guide
- Performance considerations
- Related code files

**Pages**: 10+ comprehensive sections

---

### 4. **PLAN_UPGRADE_TESTING_SUMMARY.md** - EXECUTIVE SUMMARY
**High-level overview** - What's tested and why

Content:
- Summary of test suite
- How to run each test type
- Critical code sections being tested
- Test execution checklist
- Database query examples
- Success criteria matrix
- Troubleshooting table

**Best for**: Quick orientation and understanding scope

---

### 5. **scripts/test-upgrade-flow.js** - AUTOMATED TESTS
**Automated integration testing** - Environment and schema validation

Features:
- Environment checks (Node.js, PostgreSQL, API)
- Schema validation (tables, columns, constraints)
- API endpoint availability
- Data integrity checks
- State machine validation
- Billing cycle verification
- Invoice tracking validation
- Data persistence checks

Run with:
```bash
npm run test:upgrade
```

**Prerequisites**: PostgreSQL and API must be running

---

### 6. **test-plan-upgrade.js** - QUICK API TEST
**Lightweight smoke test** - API endpoint availability

Features:
- Basic health checks
- Plan endpoint validation
- Upgrade/payment endpoint verification
- 8 quick tests

Run with:
```bash
node test-plan-upgrade.js
```

---

### 7. **package.json** - Updated Scripts
Added test command:
```json
"test:upgrade": "node scripts/test-upgrade-flow.js"
```

Now run with: `npm run test:upgrade`

---

## 🎯 How to Use This Suite

### For Quick Testing (30 minutes)
1. Read: **QUICK_START_PLAN_UPGRADE_TEST.md**
2. Follow the 4 test scenarios
3. Check success criteria

### For Comprehensive Testing (1-2 hours)
1. Read: **PLAN_UPGRADE_TESTING_SUMMARY.md** (overview)
2. Follow: **PLAN_UPGRADE_TEST_SCRIPT.md** (8 detailed tests)
3. Verify: Using **PLAN_UPGRADE_TEST_README.md** (reference)

### For Detailed Reference
- API details: **PLAN_UPGRADE_TEST_README.md**
- Code locations: **PLAN_UPGRADE_TEST_README.md** (Related Files section)
- Troubleshooting: **PLAN_UPGRADE_TEST_README.md** (Troubleshooting section)

---

## 🚀 Getting Started (3 Steps)

### Step 1: Start Services
```bash
# Terminal 1
npm run docker:up

# Terminal 2
npm run dev:all
```

### Step 2: Run Quick Check
```bash
npm run test:upgrade
```

### Step 3: Follow Test Scenarios
Open **QUICK_START_PLAN_UPGRADE_TEST.md** and follow the 4 test scenarios.

---

## 📊 Test Coverage

### Upgrade Flow State Machine
```
TRIAL --[submit payment]--> TRIAL (pendingUpgrade: BASIC)
                                |
                          [admin approve]
                                |
                                v
                           BASIC (ACTIVE)
                                |
                        [submit 2nd upgrade]
                                |
                                v
                      BASIC (pendingUpgrade: PREMIUM)
                                |
                          [admin approve]
                                |
                                v
                         PREMIUM (ACTIVE, annual cycle)
```

### What Gets Verified
- ✅ Each state transition correct
- ✅ `pendingUpgradePlanId` properly set/cleared
- ✅ Payment status tracked correctly
- ✅ Billing cycles calculated correctly
- ✅ Database persists correctly
- ✅ API responses current (not stale)
- ✅ Invoices created and linked
- ✅ Emails sent at each step

---

## 🔍 Key Tests Explained

### Test 1: Basic Upgrade (Trial → Basic)
**What**: Upgrade from free trial to paid monthly plan
**Steps**: Create tenant → Upgrade → Submit payment → Admin approves
**Verify**: 
- Database: `planId` = "trial" → "basic"
- Database: `status` = "trial" → "active"
- Database: `pendingUpgradePlanId` = NULL
- UI: Dashboard shows "Basic Monthly"

### Test 2: Proration (Basic → Premium Annual)
**What**: Upgrade with proration calculation
**Steps**: Upgrade → Calculate unused balance → Submit payment → Admin approves
**Verify**:
- Proration shown before payment
- Invoice includes proration line items
- Database: `billingCycle` = "monthly" → "annual"
- Database: `currentPeriodEnd` ≈ 365 days away

### Test 3: Rejection
**What**: Admin rejects payment, subscription unchanged
**Steps**: Submit upgrade → Admin rejects
**Verify**:
- Database: `planId` unchanged (still "trial")
- Database: `pendingUpgradePlanId` = NULL
- Tenant can immediately retry upgrade

### Test 4: Persistence
**What**: Plan status persists across sessions
**Steps**: Hard refresh → Logout/login
**Verify**:
- Data loaded from database (not in-memory)
- Same plan shown after refresh
- Same plan shown after login

---

## 💡 What Was Fixed

This testing suite validates these **critical fixes**:

### 1. Upgrade Endpoint Returns Updated Data
**Problem**: Endpoint returned old subscription object before update
**Fix**: Return result of `prisma.subscription.update()` call
**File**: `/app/api/tenant/subscriptions/upgrade/route.ts` (line 118)
**Test**: Validates response contains updated `pendingUpgradePlanId`

### 2. Payment Verify Applies Pending Plan
**Problem**: After admin approval, old plan stayed active
**Fix**: Set `planId = pendingUpgradePlanId` on verification
**File**: `/app/api/admin/payments/route.ts` (line 206)
**Test**: Validates plan changes to upgraded plan after approval

### 3. Billing Cycle Calculation
**Problem**: Billing dates calculated incorrectly
**Fix**: Use plan's `billingCycle` field to calculate 30 vs 365 days
**File**: `/app/api/admin/payments/route.ts` (line 75)
**Test**: Validates monthly = 30 days, annual = 365 days

### 4. Proration Accuracy
**Problem**: Proration amounts calculated incorrectly
**Fix**: Implement correct daily rate × remaining days formula
**File**: `/lib/proration.ts`
**Test**: Validates proration matches expected amount

---

## 📈 Testing Timeline

| Phase | Duration | Activity |
|-------|----------|----------|
| Setup | 2 min | Start docker + dev servers |
| Quick Test | 30 min | Run 4 quick scenarios |
| Full Test | 1-2 hours | Run all 8 detailed scenarios |
| Verification | 15 min | Review success criteria |
| **Total** | **2 hours** | Complete validation |

---

## ✨ Key Takeaways

### Testing Philosophy
- **Automated**: Environment and schema validation
- **Manual**: Real-world upgrade scenarios
- **Comprehensive**: 8 different test scenarios
- **Documented**: Every step explained

### What's Validated
- Complete upgrade flow (trial → basic → premium → annual)
- Payment processing and verification
- Database persistence and integrity
- Proration calculations
- Billing cycle dates
- Email notifications
- API response correctness

### Files to Know
```
Testing Guides:
  QUICK_START_PLAN_UPGRADE_TEST.md       (start here - 30 min)
  PLAN_UPGRADE_TEST_SCRIPT.md            (detailed - 8 tests)
  PLAN_UPGRADE_TEST_README.md            (reference)
  
Code Being Tested:
  /api/tenant/subscriptions/upgrade       (initiate upgrade)
  /api/tenant/subscriptions/payment/submit (submit payment)
  /api/admin/payments                     (verify/reject)
  /lib/proration.ts                       (calculations)
```

---

## 🎓 What This Validates

### Functionality
- Subscription upgrades work end-to-end
- Payment processing integrates correctly
- Admin approval flow works
- Payment rejection prevents upgrade

### Data Integrity
- Plans persist in database correctly
- No orphaned records created
- Payment history complete
- Invoice tracking accurate

### User Experience
- Fresh data shown (not stale cached data)
- Proper feedback at each step
- Correct plan shown in UI
- Proration clearly communicated

### Production Readiness
- All critical paths tested
- Edge cases covered (rejection, persistence)
- Database schema correct
- API responses consistent

---

## 🔗 Quick Links to Test Docs

- **Start Testing**: QUICK_START_PLAN_UPGRADE_TEST.md
- **Detailed Tests**: PLAN_UPGRADE_TEST_SCRIPT.md (Tests 1-8)
- **Reference**: PLAN_UPGRADE_TEST_README.md
- **Overview**: PLAN_UPGRADE_TESTING_SUMMARY.md

---

## ✅ Next Steps

1. **Read**: QUICK_START_PLAN_UPGRADE_TEST.md (5 min)
2. **Setup**: Run `npm run docker:up` + `npm run dev:all` (2 min)
3. **Test**: Follow 4 quick test scenarios (30 min)
4. **Verify**: Check success criteria (5 min)

**Total Time**: ~45 minutes for quick validation

For comprehensive testing, allow **1-2 hours** to run all 8 test scenarios from PLAN_UPGRADE_TEST_SCRIPT.md.

---

**Created**: December 7, 2025
**Status**: ✅ Complete - Ready for Testing
**Coverage**: ✅ All critical upgrade flow paths
