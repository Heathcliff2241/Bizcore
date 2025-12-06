# Tenant Subscription Management Page – Enhancement Plan
## "How Apple Would Design This" 🍎

---

## Executive Summary

The current subscription management page is **admin-centric** (showing all tenants). This plan transforms it into a **tenant-centric subscription management system** where individual SME businesses manage their own subscription, billing, usage, and account lifecycle—the way Apple does it with App Store Subscriptions, Apple Music, or iCloud+.

**Apple's Philosophy:**
- **Clarity over complexity** – One subscription, one view, all answers
- **Transparency** – Next payment amount/date always visible, no surprises
- **Control** – Easy upgrade/downgrade/cancel with clear consequences
- **Reassurance** – Usage metrics show ROI, clear renewal reminders

---

## Phase 1: Current State Analysis

### What We Have
```
Tenant Model Fields:
├── subscriptionPlan (enum: free, basic, premium, enterprise)
├── subscriptionExpires (DateTime)
└── isPremium (boolean) ❌ REDUNDANT

Page Issues:
├── Shows ALL tenants (admin view, not tenant view)
├── No usage/feature tracking
├── No payment history
├── No billing method storage
├── No upgrade/downgrade flow
├── No renewal notifications
├── Simple on/off status only
└── No cost savings calculation
```

### Schema Gaps That Block Apple-Like Experience
1. **No Invoice/Payment History** – Users can't see past transactions
2. **No Usage Tracking** – Can't show "You have 85% of your storage used"
3. **No Billing Method** – Can't show "Your card ending in 4242"
4. **No Preferences** – Can't store "Remind me 7 days before renewal"
5. **No Dunning Management** – Failed payments aren't tracked
6. **No Plan Comparison** – Users can't see features side-by-side

---

## Phase 2: Backend Schema Enhancements

### BizCore Pricing (Final Structure)

**BizCore One** - ₱0
- 14-Day Free Trial
- No credit card required
- Full access to all features

**Monthly** - ₱1,999/month
- Best for shops trying BizCore short-term
- Cancel anytime
- Full feature access

**Yearly** - ₱19,999/year (⭐ Best Value)
- Save ₱3,989 every year (2 months free vs. monthly)
- ₱1,666/month when billed yearly
- Lock in your price for 12 months
- Priority stability & updates
- Automatic renewal recommended

---

### New Tables Needed

#### 1. **Subscription (Master record per tenant)**
```prisma
model Subscription {
  id                    Int       @id @default(autoincrement())
  tenantId              Int       @unique  // One active subscription per tenant
  tenant                Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  planId                String    // References plan: 'trial', 'basic', 'premium', 'enterprise'
  status                SubscriptionStatus @default(active)  // active, paused, cancelled, expired, overdue
  
  // Billing Cycle Details
  billingCycle          BillingCycle  // 'monthly' | 'annual' | 'lifetime'
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  renewalDate           DateTime?     // NULL if cancelled
  
  // Payment Tracking
  nextPaymentAmount     Int?          // In cents (₱)
  nextPaymentDate       DateTime?
  autoRenew             Boolean @default(true)
  
  // Plan History
  previousPlanId        String?       // Before upgrade/downgrade
  planChangedAt         DateTime?
  
  // Proration & Credits
  unusedBalance         Int @default(0)  // Credits from cancellation/downgrade
  
  // Upgrade Path
  pendingUpgradePlanId  String?       // Queued for next billing cycle
  upgradePendingAt      DateTime?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @default(now())
  
  // Relations
  payments              Payment[]
  invoices              Invoice[]
  usageRecords          UsageRecord[]
  
  @@index([tenantId])
  @@index([status])
  @@index([renewalDate])
}
```

#### 2. **Invoice (One per billing cycle)**
```prisma
model Invoice {
  id                    Int       @id @default(autoincrement())
  subscriptionId        Int
  subscription          Subscription  @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  invoiceNumber         String    @unique  // INV-2024-001
  status                InvoiceStatus @default(draft)  // draft, issued, paid, failed, refunded
  
  // Amount Details
  subtotal              Int       // Amount before tax (in cents)
  tax                   Int @default(0)
  discount              Int @default(0)
  total                 Int       // subtotal + tax - discount
  
  // Dates
  issuedAt              DateTime  @default(now())
  dueDate               DateTime
  paidAt                DateTime?
  
  // Line Items
  lineItems             Json      // Array of {description, quantity, unitPrice, amount}
  notes                 String?
  
  // References
  paymentId             Int?
  payment               Payment?  @relation(fields: [paymentId], references: [id], onDelete: SetNull)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @default(now())
  
  @@index([subscriptionId])
  @@index([status])
  @@index([issuedAt])
}
```

#### 3. **Payment (Transaction record)**
```prisma
model Payment {
  id                    Int       @id @default(autoincrement())
  subscriptionId        Int
  subscription          Subscription  @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  status                PaymentStatus @default(pending)  // pending, succeeded, failed, refunded
  
  // Amount & Method
  amount                Int       // in cents (₱)
  currency              String @default("PHP")
  paymentMethod         String?   // 'card', 'digital_wallet', 'bank_transfer'
  
  // Card Details (masked)
  cardBrand             String?   // 'visa', 'mastercard'
  cardLastFour          String?   // '4242'
  cardExpiry            String?   // 'MM/YY'
  
  // Gateway
  gatewayId             String?   // Stripe payment_intent_id
  gatewayTransactionId  String?
  
  // Error Handling
  errorMessage          String?
  failureReason         String?   // 'card_declined', 'expired_card'
  retryCount            Int @default(0)
  nextRetryAt           DateTime?
  
  // Metadata
  idempotencyKey        String?   @unique
  metadata              Json?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @default(now())
  
  invoices              Invoice[]
  
  @@index([subscriptionId])
  @@index([status])
  @@index([createdAt])
}
```

#### 4. **UsageRecord (Track feature usage)**
```prisma
model UsageRecord {
  id                    Int       @id @default(autoincrement())
  subscriptionId        Int
  subscription          Subscription  @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  metric                String    // 'orders_created', 'employees_added', 'api_calls', 'storage_gb'
  value                 Int       // Current usage amount
  limit                 Int?      // Plan limit (NULL = unlimited)
  
  // Percentage for UI progress bars
  percentage            Int       // 0-100 for UI
  
  recordedAt            DateTime @default(now())
  
  @@unique([subscriptionId, metric])
  @@index([subscriptionId])
}
```

#### 5. **BillingPreference (User preferences)**
```prisma
model BillingPreference {
  id                    Int       @id @default(autoincrement())
  tenantId              Int       @unique
  tenant                Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Notification Settings
  notifyBeforeRenewal   Boolean @default(true)
  notificationDaysBefore Int @default(7)  // Remind 7 days before
  
  // Billing Details
  billingEmail          String?   // Separate from main tenant contact
  billingName           String?   // Company name for invoices
  billingAddress        Json?
  taxId                 String?   // VAT/TIN number
  
  // Preferences
  autoRenew             Boolean @default(true)
  autoUpgradeIfOverage  Boolean @default(false)
  
  // Payment Method Storage
  preferredPaymentMethodId Int?  // References a PaymentMethod
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @default(now())
  
  @@index([tenantId])
}
```

### New Enums
```prisma
enum SubscriptionStatus {
  trial         // First 14 days, free
  active        // Paid, current
  paused        // Temporarily paused
  overdue       // Payment failed, waiting for retry
  cancelled     // Intentionally stopped
  expired       // Period ended, not renewed
  suspended     // Admin action (non-payment)
}

enum BillingCycle {
  monthly
  annual
  lifetime
  trial
}

enum InvoiceStatus {
  draft
  issued
  paid
  partial
  failed
  refunded
}
```

---

## Phase 3: Frontend Architecture (Apple-Style)

### Page Structure (Tenant View)

```
/dashboard/[subdomain]/billing/subscriptions
├── Header Section
│   ├── Current Plan Badge (e.g., "Standard Monthly")
│   ├── Status Indicator (Active · Renews Dec 4, 2024)
│   └── Quick Actions (Upgrade | Manage | Cancel)
│
├── Hero Card: Current Subscription
│   ├── Plan Name + Description
│   ├── Price (₱1,999/month)
│   ├── Renewal Date (Dec 4, 2024)
│   ├── Days Remaining (Countdown for trials)
│   ├── Auto-Renewal Toggle
│   └── "You'll be charged ₱1,999 on Dec 4"
│
├── Three-Tab Interface
│   │
│   ├── TAB 1: OVERVIEW (Default)
│   │   ├── Feature Usage Section
│   │   │   ├── Metric Cards (60% of 100 Orders Used)
│   │   │   ├── Progress Bars (visual % fill)
│   │   │   └── "Upgrade to get unlimited orders"
│   │   │
│   │   ├── Billing Summary
│   │   │   ├── Next Charge
│   │   │   │   ├── Amount: ₱1,999
│   │   │   │   ├── Date: Dec 4, 2024
│   │   │   │   └── Card: Visa ending in 4242
│   │   │   │
│   │   │   └── Billing Method
│   │   │       ├── Visa •••• 4242 (Exp 12/26)
│   │   │       ├── [Change Payment Method]
│   │   │       └── [Add another card]
│   │   │
│   │   └── Actions Sidebar
│   │       ├── Upgrade Plan
│   │       ├── Change Billing Cycle
│   │       ├── Pause Subscription (3 months max)
│   │       ├── Download Invoice
│   │       └── Contact Support
│   │
│   ├── TAB 2: BILLING HISTORY
│   │   ├── Invoice Timeline
│   │   │   ├── [Status Badge] Nov 4, 2024 · ₱1,999
│   │   │   │   └── [PDF Download] [View Details]
│   │   │   │
│   │   │   ├── [Status Badge] Oct 4, 2024 · ₱1,999
│   │   │   │   └── [PDF Download] [View Details]
│   │   │   │
│   │   │   └── Show 20 per page + pagination
│   │   │
│   │   └── Filters: Status (All | Paid | Unpaid | Overdue)
│   │
│   ├── TAB 3: MANAGE PLAN
│   │   ├── Current Plan Details
│   │   │   ├── Billing Cycle Option
│   │   │   │   ├── [Monthly] (₱1,999) - SELECTED
│   │   │   │   └── [Annual] (₱19,999 → Save ₱3,989) [UPGRADE CTA]
│   │   │   │
│   │   │   └── Renewal Preferences
│   │   │       ├── Auto-renew enabled [Toggle]
│   │   │       ├── Remind me 7 days before
│   │   │       └── Enable auto-upgrade if I exceed limits
│   │   │
│   │   ├── Plan Comparison Table
│   │   │   ├── Feature columns: Current | Premium | Enterprise
│   │   │   ├── Each row: Metric with checkmarks/X/amounts
│   │   │   └── [Upgrade] [Learn More] CTAs per plan
│   │   │
│   │   └── Change or Cancel
│   │       ├── [Upgrade to Premium]
│   │       ├── [Downgrade to Trial] (with consequence info)
│   │       └── [Cancel Subscription]
│   │
└── Footer
    └── Billing Support + FAQ
```

### Component Breakdown

```typescript
// Core Components
├── SubscriptionHero
│   └── Shows current plan, price, renewal date, status
│
├── FeatureUsageCard
│   ├── Metric name + current/limit
│   ├── Animated progress bar (0-100%)
│   ├── "Upgrade to increase limit" link
│   └── Color coding: Green (safe) → Yellow (80%+) → Red (>100%)
│
├── BillingMethodCard
│   ├── Card details (masked)
│   ├── Expiry warning if <3 months
│   ├── Change/Remove buttons
│   └── Apple Pay / Google Pay logos if available
│
├── UpgradeFlowModal
│   ├── Before: "You have X orders left this cycle"
│   ├── After upgrade: "You'll have unlimited"
│   ├── Price comparison (prorated charge if mid-cycle)
│   ├── Confirmation + card charging
│   └── Success message with usage reset
│
├── DowngradeWarningModal
│   ├── Feature loss warning
│   ├── Credit explanation (prorated refund)
│   ├── "Your credit: ₱1,200 → applies to next invoice"
│   ├── Confirmation
│   └── Effective date info
│
├── CancellationFlow
│   ├── "We'd love to keep you" messaging
│   ├── Pause option (3 months, free)
│   ├── Feedback form (why leaving?)
│   ├── "Last chance" upgrade discount code
│   ├── Confirmation with refund/credit info
│   └── Unsubscribe confirmation
│
├── InvoiceListTable
│   ├── Status badges (Paid, Pending, Failed, Refunded)
│   ├── Amount, Date, Download PDF
│   ├── Sortable + Filterable
│   └── Expandable rows for line item details
│
└── PlanComparisonTable
    ├── Side-by-side feature matrix
    ├── Highlight current plan
    ├── Show pricing differences
    └── [Upgrade to X] buttons
```

---

## Phase 4: API Design (Backend Routes)

### Endpoints Needed

```
GET  /api/tenant/subscriptions/current
     Response: Current subscription + related data
     {
       id, tenantId, planId, status, billingCycle,
       currentPeriodStart, currentPeriodEnd, renewalDate,
       nextPaymentAmount, nextPaymentDate, autoRenew,
       usage: [ { metric, value, limit, percentage }, ... ],
       billingMethod: { cardBrand, cardLastFour, cardExpiry },
       plan: { name, price, features },
       tenant: { name, email, ... }
     }

GET  /api/tenant/subscriptions/invoices
     Query: ?page=1&limit=20&status=paid
     Response: Paginated list of invoices with line items

GET  /api/tenant/subscriptions/invoices/:id
     Response: Full invoice details + payment history

GET  /api/tenant/subscriptions/usage
     Response: [ { metric, value, limit, percentage }, ... ]

GET  /api/tenant/subscriptions/plans-available
     Response: List of upgradeable plans with pricing comparison

POST /api/tenant/subscriptions/upgrade
     Body: { planId, billingCycle?, effectiveDate? }
     Handles: charge card, proration calculation, email confirmation
     Response: Updated subscription + invoice

POST /api/tenant/subscriptions/downgrade
     Body: { planId, effectiveDate? }
     Handles: credit calculation, feature warning, downgrade date
     Response: Updated subscription + confirmation

POST /api/tenant/subscriptions/change-billing-cycle
     Body: { billingCycle, effectiveDate? }
     Handles: Proration, price difference calculation
     Response: Updated subscription + adjusted charge

POST /api/tenant/subscriptions/pause
     Body: { months: 1-3, reason? }
     Conditions: Only if status='active', max 3 months per year
     Response: Updated subscription with pause details

POST /api/tenant/subscriptions/resume
     Response: Updated subscription, charges resumed

POST /api/tenant/subscriptions/cancel
     Body: { reason?, feedbackComment?, scheduledFor? }
     Options: Immediate or at end of billing period
     Response: Cancellation confirmation + refund calculation

POST /api/tenant/subscriptions/auto-renew-toggle
     Body: { autoRenew: boolean }
     Response: Updated subscription

PUT  /api/tenant/billing/preferences
     Body: { 
       notifyBeforeRenewal, notificationDaysBefore,
       billingEmail, autoRenew, ...
     }
     Response: Updated preferences

POST /api/tenant/billing/payment-methods
     Body: { stripeTokenId, makeDefault? }
     Response: Added payment method (masked)

PUT  /api/tenant/billing/payment-methods/:id
     Body: { makeDefault? }

DELETE /api/tenant/billing/payment-methods/:id
     Conditions: Can't delete if it's the only method or last payment pending
     Response: Confirmation

// Admin APIs (for support/override)
POST /api/admin/subscriptions/:tenantId/refund
     Body: { amount, reason, notes }
     Response: Refund transaction

POST /api/admin/subscriptions/:tenantId/force-renewal
     Response: Manual renewal + invoice created

GET  /api/admin/subscriptions/:tenantId/payment-history
     Response: All payments with retry history, failed reasons
```

---

## Phase 5: UX Flows (Apple's Principles)

### 1. **Upgrade Flow** (The Happy Path)
```
User clicks [Upgrade] button
  ↓
UpgradeModal opens
  ├─ "Upgrade to Premium"
  ├─ Shows: Current price vs. new price
  ├─ Prorated charge calculation (if mid-cycle)
  │   "Your next charge will be ₱19,999 instead of ₱1,999"
  │   (for upgrade from Monthly to Yearly)
  │   "Unused balance from current plan: ₱500"
  ├─ Billing method confirmation
  ├─ "Charge Visa ending 4242"
  ├─ [Cancel] [Upgrade Now]
  ↓
Charge card (Stripe/PayMongo)
  ├─ On success:
  │   ├─ Real-time subscription update
  │   ├─ Feature access enabled immediately
  │   ├─ Email receipt sent
  │   ├─ Confetti animation ✨
  │   └─ "You're now on BizCore Yearly! New features available:"
  │       - Unlimited orders
  │       - Unlimited employees
  │       - Advanced analytics
  │       - Priority support (24h response)
  └─ On failure:
      ├─ Clear error message
      ├─ "Card declined. Try another card?"
      ├─ Retry button
      └─ Contact support link
```

### 2. **Downgrade Flow** (Manage Expectations)
```
User clicks [Change Plan] → [Downgrade to Standard]
  ↓
DowngradeWarning shows
  ├─ "Downgrading removes:"
  │   ├─ ✓ Advanced analytics
  │   ├─ ✓ Priority support
  │   └─ ✓ API access
  ├─ "What you keep:"
  │   ├─ ✓ All order history
  │   └─ ✓ Team access
  ├─ Credit calculation:
  │   "Unused balance from current plan: ₱1,200"
  │   "This credits your next bill"
  │   "Effective: End of current billing cycle (Jan 4, 2025)"
  ├─ [Keep Premium] [Proceed with Downgrade]
  ↓
Confirmation
  ├─ Success message
  ├─ "Downgrade effective Jan 4"
  ├─ "See your credit applied in next invoice"
  └─ Email sent to tenant
```

### 3. **Pause Flow** (Retention Strategy)
```
User clicks [Pause Subscription]
  ↓
PauseModal shows
  ├─ "Pause your subscription for a moment"
  ├─ "Up to 3 months free. No charges."
  ├─ Duration selector: [1 month] [2 months] [3 months]
  ├─ "Resume anytime. All your data stays."
  ├─ Optional: Feedback form
  │   "What would make you stay?"
  │   (Discount code offer)
  ├─ [Cancel Pause] [Pause Subscription]
  ↓
Confirmation
  ├─ "Your subscription is paused until Jan 4, 2025"
  ├─ "Features disabled • Data preserved • No charges"
  ├─ "Resume anytime with [Resume] button"
  ├─ Email: "We'll miss you! Come back anytime."
  └─ Calendar reminder: 2 weeks before pause ends
```

### 4. **Cancellation Flow** (Last-Chance Messaging)
```
User clicks [Cancel Subscription]
  ↓
CancellationAre YouSure modal
  ├─ Large warning icon
  ├─ "Are you sure? Here's what happens:"
  ├─ Feature loss + refund calculation
  │   "Unused balance: ₱2,500 → Credits next bill"
  │   OR "Immediate refund: ₱2,500"
  ├─ "Maybe you'd prefer to pause instead?"
  │   [Pause 1 month for free]
  ├─ "Got feedback for us?"
  │   [Optional comment box]
  │   Offer: "Get 30% off if you stay"
  ├─ Timing: [Immediate] [End of billing period (Jan 4)]
  ├─ [Keep Subscription] [Cancel]
  ↓
Final confirmation
  ├─ "Your subscription ends Jan 4, 2025"
  ├─ "You'll have access until then"
  ├─ "Support team standing by if you change your mind"
  ├─ Email: "Your cancellation confirmed. Come back anytime."
  └─ Special: Send win-back email in 30 days with discount
```

### 5. **Failed Payment Recovery** (Dunning Management)
```
Payment fails (card declined)
  ↓
Immediate email to user
  ├─ Subject: "We couldn't process your payment"
  ├─ Body:
  │   "Your subscription payment failed. Reason: Card expired"
  │   "Update your payment method: [Click here]"
  │   "We'll retry in 3 days"
  │   "Questions? Contact us: [link]"
  ↓
In-app notification
  ├─ Red banner: "Payment failed. Update your card."
  │   [Fix now] button
  ↓
3-5 days after: Auto-retry payment
  ├─ If success:
  │   ├─ Email confirmation
  │   └─ Subscription continues
  └─ If failed again:
      ├─ Send second notice
      ├─ Subscription status → "Overdue"
      ├─ Feature degradation: Read-only access
      └─ After 30 days overdue: Auto-cancel + refund
```

---

## Phase 6: Data Models for Features Usage Display

### Example Usage Metrics (Based on Subscription Plan)

```
BizCore One (14-Day Free Trial - ₱0)
├── Orders per month: Limited
├── Employees: 1
├── Storage: 1 GB
└── Support: Community

BizCore Monthly (₱1,999/month)
├── Orders per month: Unlimited
├── Employees: 3
├── Storage: 10 GB
├── API calls/month: 1,000
└── Support: Email

BizCore Yearly (₱19,999/year = ₱1,666/month)
├── Orders per month: Unlimited
├── Employees: Unlimited
├── Storage: 100 GB
├── API calls/month: 100,000
├── Advanced analytics: Yes
├── Priority support: 24h response
└── Locked pricing for 12 months
```

### Usage Card Examples

```
Current Plan: BizCore Monthly (₱1,999/month)
Next Renewal: Dec 4, 2024 (15 days)

┌─────────────────────────────────┐
│ Orders Created This Month       │
│ 75 / Unlimited                  │
│ ▓▓▓▓▓▓▓▓░░░░ 75%               │
│ You can create unlimited orders │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Team Members                    │
│ 3 of 3                          │
│ ▓▓▓▓▓▓▓▓▓▓▓▓ 100%               │
│ [Upgrade to Yearly for unlimit] │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Storage Used                    │
│ 7.2 GB of 10 GB                │
│ ▓▓▓▓▓▓▓░░░░░ 72%                │
│ Plenty of space available       │
└─────────────────────────────────┘
```

---

## Phase 7: Implementation Roadmap

### Sprint 1: Backend Foundation (Week 1-2)
- [ ] Create new Prisma schema (Subscription, Invoice, Payment, UsageRecord, BillingPreference)
- [ ] Create database migrations
- [ ] Seed with sample data
- [ ] Implement API routes (GET /current, GET /invoices, GET /usage)

### Sprint 2: Core Flows (Week 3-4)
- [ ] Implement upgrade POST endpoint + prorated calculations
- [ ] Implement downgrade POST endpoint + credit calculations
- [ ] Implement cancel POST endpoint
- [ ] Add payment method management APIs
- [ ] Payment processing integration (Stripe/PayMongo)

### Sprint 3: Frontend Hero Card (Week 5)
- [ ] Build SubscriptionHero component
- [ ] Build FeatureUsageCard component
- [ ] Display current plan + renewal date
- [ ] Feature usage progress bars

### Sprint 4: Frontend Tabs (Week 6-7)
- [ ] Overview tab (usage, billing summary, actions)
- [ ] Billing History tab (invoice table, filters, PDF download)
- [ ] Manage Plan tab (comparison table, billing cycle toggle)

### Sprint 5: Flows & Modals (Week 8)
- [ ] UpgradeFlowModal
- [ ] DowngradeWarningModal
- [ ] CancellationFlow
- [ ] PauseFlowModal

### Sprint 6: Polish & Notifications (Week 9)
- [ ] Email notifications (renewal reminders, payment receipts, cancellation)
- [ ] Error handling + edge cases
- [ ] Analytics integration (track upgrade/downgrade)
- [ ] A/B testing setup

### Sprint 7: Admin Tools (Week 10)
- [ ] Admin override API routes
- [ ] Support dashboard (refunds, manual renewal, retry payments)
- [ ] Refund processing UI

---

## Phase 8: Design Language (Apple Principles)

### Visual Hierarchy
```
LARGE:   Plan name, Price, Next charge amount (₱1,999)
MEDIUM:  Status, Renewal date, Billing cycle
SMALL:   Card ending, Tax info, Legal text
```

### Colors
```
Success:       Green (#10B981)  → Active, Paid, All good
Attention:     Amber (#F59E0B)  → 80%+ usage, Expiring soon
Warning:       Red (#EF4444)    → Payment failed, Overdue
Neutral:       Gray (#6B7280)   → Cancelled, Paused
Highlight:     Blue (#3B82F6)   → Current plan, Action buttons
```

### Animations
```
Page load:          Staggered cards fade in (Framer Motion)
Progress bars:      Animated from 0% to target % (2s ease-in-out)
Success state:      Brief confetti + success toast
Error state:        Red shake animation
Hover:              Subtle lift (translateY -2px)
Modal entrance:     Fade + scale from center (spring physics)
```

### Typography
```
H1:                 "Subscriptions" (4xl bold)
H2:                 "Standard Monthly" (2xl bold)
H3:                 "Billing Summary", "Feature Usage" (xl medium)
Body:               Slate-700 14px
Label:              Slate-600 12px
Caption:            Slate-500 12px
```

### Spacing & Layout
```
Page:               8px padding (p-8), max-w-7xl
Cards:              6px padding (p-6), 0.5px border, rounded-xl
Sections:           24px gap (mb-6, gap-6)
Compact:            4px gap for inline elements (gap-2)
```

---

## Phase 9: Key Differentiators (vs. Stripe/Square)

### What Apple Does Better
| Feature | Apple | Stripe | Our Implementation |
|---------|-------|--------|-------------------|
| **Clarity** | One sentence explains everything | Complex tables | Hero card says it all |
| **Emotion** | Positive (upgrade) vs. Gentle (pause) | Neutral/transactional | Match Apple's tone |
| **Defaults** | Auto-renew ON, pause available | Auto-renew ON, hard to cancel | Pause option prominent |
| **Refunds** | "Credit" not "refund" (feels better) | Direct refund terminology | Use "credit" language |
| **Errors** | Specific + helpful | Generic error codes | "Card expired on 12/25. Update it." |
| **Retention** | Pause > cancel mindset | Cancel is default option | Pause shown before cancel |
| **Design** | Minimalist, white space | Dense tables | Generous spacing, one thing per view |

---

## Phase 10: Success Metrics

### Business KPIs
```
✓ Upgrade Conversion Rate (current to higher tier)
✓ Churn Rate (cancellations per month)
✓ Expansion Revenue (upgrades + annual commits)
✓ Pause Usage (% using pause instead of cancel)
✓ Payment Success Rate (on first attempt)
✓ Time to resolve overdue (failed payments)
```

### User Experience KPIs
```
✓ Time to upgrade (clicks from "Upgrade" button to confirmation)
✓ Invoice download rate
✓ Support tickets (goal: reduce by clarity)
✓ User task completion rate (e.g., "change payment method")
✓ Error recovery rate (e.g., failed payment → updated card)
```

### Technical KPIs
```
✓ API response time (< 200ms)
✓ Payment processing time (< 5s)
✓ Uptime (99.9%)
✓ Zero data loss on transactions
✓ PCI compliance maintained
```

---

## Conclusion: Why This Matters

**Current state:** Users see a confusing table of subscription details.

**Apple way:** Users see one clear message:
> "You're on BizCore Monthly (₱1,999/month). Your next charge is Dec 4, 2024. Upgrade to Yearly to save ₱3,989/year. [Upgrade to Yearly] [Manage]"

**Result:**
- Users understand their subscription instantly
- They feel in control (pause, cancel, upgrade visible)
- Friction for upgrades drops (2-click process vs. digging through settings)
- Support tickets decrease (everything is self-evident)
- Revenue increases (easier to upgrade, pause keeps relationship alive)

---

**Next Steps:**
1. Review this plan
2. Prioritize which phases to implement first
3. Assign backend / frontend team members
4. Create Jira tickets from the roadmap

This will transform your subscription experience from **transactional** → **delightful**. ✨
