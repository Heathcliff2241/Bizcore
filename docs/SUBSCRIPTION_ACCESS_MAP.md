# 🎯 Subscription Feature Access Map

## Quick Navigation Guide

### 🏢 For Tenants (Business Owners)

#### Access Point
**Sidebar Menu → "Billing & Subscriptions"**  
**URL**: `https://bizcore.local/dashboard/[business-name]/billing/subscriptions`

#### What You Can Do
```
┌─────────────────────────────────────────────────────────┐
│  BILLING & SUBSCRIPTIONS PAGE                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 TAB 1: OVERVIEW (Default)                           │
│  ├─ Current Plan Display (e.g., "BizCore Monthly")     │
│  ├─ Next Renewal Date (e.g., "Dec 4, 2024")           │
│  ├─ Feature Usage Cards                                │
│  │  ├─ Orders Created: 75/100 (75% used)              │
│  │  ├─ Team Members: 3/3 (100% - UPGRADE to add more) │
│  │  ├─ Storage Used: 7.2GB/10GB (72% used)            │
│  │  └─ API Calls: 850/1000/month (85% used)           │
│  ├─ Next Charge Summary                                │
│  │  ├─ Amount: ₱1,999                                 │
│  │  ├─ Date: Dec 4, 2024                              │
│  │  └─ Payment Method: Visa ending in 4242             │
│  └─ Quick Actions                                       │
│     ├─ [Upgrade Plan]                                  │
│     ├─ [Change Billing Cycle]                          │
│     ├─ [Pause Subscription]                            │
│     └─ [Cancel Subscription]                           │
│                                                         │
│  📋 TAB 2: BILLING HISTORY                              │
│  ├─ Invoice List (most recent first)                   │
│  │  ├─ Nov 4, 2024 · ₱1,999 [Paid] [Download PDF]     │
│  │  ├─ Oct 4, 2024 · ₱1,999 [Paid] [Download PDF]     │
│  │  ├─ Sep 4, 2024 · ₱1,999 [Paid] [Download PDF]     │
│  │  └─ [Show More...]                                  │
│  └─ Filter Options: All | Paid | Unpaid | Overdue      │
│                                                         │
│  ⚙️  TAB 3: MANAGE PLAN                                  │
│  ├─ Current Plan: Monthly (₱1,999/month)              │
│  ├─ Available Billing Cycles                           │
│  │  ├─ [Monthly] ₱1,999 (selected)                    │
│  │  └─ [Annual] ₱19,999/year → Save ₱3,989!           │
│  ├─ Plan Comparison                                     │
│  │  ├─ Feature Matrix (Free vs Basic vs Premium)       │
│  │  ├─ Show what you get with each                     │
│  │  └─ [Upgrade to Premium]  [Upgrade to Enterprise]   │
│  ├─ Renewal Preferences                                │
│  │  ├─ Auto-renew: [ON] [OFF]                          │
│  │  ├─ Remind me 7 days before renewal                 │
│  │  └─ Auto-upgrade if I exceed limits                 │
│  └─ Danger Zone                                         │
│     ├─ [Pause Subscription (3 mo max)]                 │
│     └─ [Cancel Subscription]                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Modals (Action Pop-ups)

**1. Upgrade Flow Modal**
```
Step 1: Select Plan
  ├─ Current: BizCore Monthly (₱1,999/month)
  ├─ New: BizCore Yearly (₱19,999/year)
  ├─ Savings: ₱3,989/year (2 months free!)
  └─ [Confirm Upgrade]

Step 2: Review & Pay
  ├─ Plan: BizCore Yearly
  ├─ Billing Cycle: 12 months
  ├─ Price: ₱19,999
  ├─ Proration: -₱1,200 (credit from monthly)
  ├─ Total Charge: ₱18,799
  └─ [Pay with GCash]

Step 3: Verifying...
  ├─ Reference #: [waiting for admin approval]
  ├─ Status: Pending verification (polling...)
  └─ [Cancel Upgrade]

Step 4: Success! ✓
  ├─ Your subscription upgraded!
  ├─ New features unlocked:
  │  ├─ ✓ Unlimited orders
  │  ├─ ✓ Priority support
  │  └─ ✓ Advanced analytics
  └─ [View Subscription]
```

**2. Downgrade Flow Modal**
```
Step 1: Warning
  ├─ "You'll lose these features:"
  │  ├─ ✗ Advanced Analytics
  │  ├─ ✗ Priority Support
  │  └─ ✗ API Access
  ├─ "You'll keep:"
  │  ├─ ✓ All order history
  │  └─ ✓ Team access
  ├─ "Credit: ₱1,200 → applied to next invoice"
  └─ [Continue Downgrade]

Step 2: Confirm
  ├─ Effective: End of billing cycle (Jan 4, 2025)
  ├─ New plan: BizCore Monthly (₱1,999/month)
  └─ [Confirm Downgrade]

Step 3: Done!
  ├─ Downgrade scheduled for Jan 4, 2025
  ├─ Email confirmation sent
  └─ [Back to Subscriptions]
```

**3. Cancellation Flow Modal**
```
Step 1: Offer Alternatives
  ├─ "We'd love to keep you! 💙"
  ├─ Want to pause instead? [Pause 1 Month Free]
  ├─ Or [Downgrade to a lower plan]
  └─ [Continue to Cancel]

Step 2: Feedback
  ├─ "What brought you here?"
  ├─ [Radio] Too expensive
  ├─ [Radio] Missing features
  ├─ [Radio] Using competitor
  ├─ [Radio] Other
  └─ [Optional Comment Box]

Step 3: Review
  ├─ "Here's what happens:"
  ├─ Effective: Immediate | End of cycle
  ├─ Unused balance: ₱2,500
  ├─ Refund: Credited to account
  └─ [Confirm Cancellation]

Step 4: Goodbye
  ├─ ✓ Cancellation confirmed
  ├─ Access until: Jan 4, 2025
  ├─ "We'll be here if you change your mind!"
  └─ [Back to Dashboard]
```

**4. Pause Flow Modal**
```
Step 1: Select Duration
  ├─ "Pause for free (no charges)"
  ├─ [1 Month] [2 Months] [3 Months]
  ├─ "Resume anytime - all data kept"
  └─ [Confirm Pause]

Step 2: Done!
  ├─ ✓ Subscription paused until Jan 4, 2025
  ├─ Features: Disabled
  ├─ Data: Safe and backed up
  ├─ Charges: Stopped
  └─ [Resume Now] or wait until end date
```

---

## 👨‍💼 For Admins (Super Admins)

### 1️⃣ Subscriptions Manager
**Sidebar Menu → "Subscriptions"**  
**URL**: `https://bizcore.local/admin/subscriptions`

#### What You Can Do
```
┌─────────────────────────────────────────────────────────┐
│  SUBSCRIPTION PLANS MANAGEMENT                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📋 Available Plans                                      │
│  ├─ BizCore One (Trial)                                │
│  │  ├─ Price: Free (14-day trial)                      │
│  │  ├─ Active: [Toggle]                                │
│  │  ├─ Tenants Using: 0                                │
│  │  ├─ [Edit] [Delete]                                │
│  │  └─ Features:                                        │
│  │     ├─ 1 team member                                │
│  │     ├─ 1GB storage                                  │
│  │     └─ Community support                            │
│  │                                                     │
│  ├─ BizCore Monthly                                     │
│  │  ├─ Price: ₱1,999/month                             │
│  │  ├─ Active: [Toggle]                                │
│  │  ├─ Tenants Using: 12                               │
│  │  ├─ [Edit] [Delete]                                │
│  │  └─ Features:                                        │
│  │     ├─ Unlimited orders                             │
│  │     ├─ 3 team members                               │
│  │     ├─ 10GB storage                                 │
│  │     └─ Email support                                │
│  │                                                     │
│  ├─ BizCore Yearly                                      │
│  │  ├─ Price: ₱19,999/year (Save ₱3,989!)             │
│  │  ├─ Active: [Toggle]                                │
│  │  ├─ Tenants Using: 5                                │
│  │  ├─ [Edit] [Delete]                                │
│  │  └─ Features:                                        │
│  │     ├─ Unlimited everything                         │
│  │     ├─ Priority support (24h)                       │
│  │     ├─ Advanced analytics                           │
│  │     └─ API access                                   │
│  │                                                     │
│  └─ [+ New Plan]                                        │
│                                                         │
│  📊 Plan Comparison                                      │
│  ├─ Feature Matrix View                                 │
│  ├─ Show feature differences                            │
│  └─ Edit plan features                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 2️⃣ Payment Verification
**Sidebar Menu → "Payments"**  
**URL**: `https://bizcore.local/admin/payments`

#### What You Can Do
```
┌─────────────────────────────────────────────────────────┐
│  PAYMENT VERIFICATION DASHBOARD                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⏳ PENDING PAYMENTS (Awaiting Your Approval)           │
│  ├────────────────────────────────────────────────────┤
│  │ Tenant: Coffee Corner Shop                         │
│  │ Amount: ₱19,999                                    │
│  │ Plan: BizCore Yearly                               │
│  │ GCash Ref: GC-2024-1234567-89                       │
│  │ Submitted: Dec 4, 2024 at 2:45 PM                  │
│  │ Status: 🟡 PENDING                                 │
│  │                                                     │
│  │ [✓ Approve Payment] [✗ Reject Payment]             │
│  │                                                     │
│  ├─ (If Approve clicked)                               │
│  │  ├─ Email sent: "Payment Verified" to tenant       │
│  │  ├─ Subscription activated immediately             │
│  │  ├─ Next renewal date set                          │
│  │  └─ Status changes to 🟢 VERIFIED                  │
│  │                                                     │
│  ├─ (If Reject clicked)                                │
│  │  ├─ Modal: "Reason for rejection?"                 │
│  │  │  ├─ [Card appears invalid]                      │
│  │  │  ├─ [Duplicate payment]                         │
│  │  │  ├─ [Suspicious activity]                       │
│  │  │  └─ [Other reason...]                           │
│  │  ├─ Email sent: "Payment Rejected" to tenant       │
│  │  └─ Status changes to 🔴 REJECTED                  │
│  │                                                     │
│  ├────────────────────────────────────────────────────┤
│  │ Tenant: Tech Startups Inc                          │
│  │ Amount: ₱1,999                                     │
│  │ Plan: BizCore Monthly                              │
│  │ GCash Ref: GC-2024-9876543-21                       │
│  │ Submitted: Dec 3, 2024 at 10:15 AM                 │
│  │ Status: 🟡 PENDING (1 day old)                     │
│  │                                                     │
│  │ [✓ Approve Payment] [✗ Reject Payment]             │
│  │                                                     │
│  ├────────────────────────────────────────────────────┤
│  │ [Show more pending payments...]                     │
│  │                                                     │
│  └────────────────────────────────────────────────────┘
│                                                         │
│  ✅ VERIFIED PAYMENTS (Approved)                        │
│  ├─ Coffee Corner Shop - ₱19,999 - Dec 4, 2024       │
│  ├─ Tech Hub Co - ₱1,999 - Dec 2, 2024               │
│  ├─ Fashion Forward Ltd - ₱9,999 - Dec 1, 2024       │
│  └─ [Show more verified payments...]                   │
│                                                         │
│  🔴 FAILED PAYMENTS (Rejected)                          │
│  ├─ Small Store - ₱1,999 - Reason: Duplicate        │
│  ├─ Beauty Bar - ₱1,999 - Reason: Card Invalid       │
│  └─ [Show more failed payments...]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data You Can Access

### Admin Dashboard Stats
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│    Active Subs      │  Monthly Revenue    │  Pending Payments   │
│                     │                     │                     │
│         24          │     ₱87,995         │        3            │
│      (tenants)      │      (this month)    │   (awaiting review) │
└─────────────────────┴─────────────────────┴─────────────────────┘

└─────────────────────┬─────────────────────┐
│  Expiring Soon      │  Failed Payments    │
│                     │                     │
│         2           │         1           │
│   (next 7 days)     │   (in last 7 days)  │
└─────────────────────┴─────────────────────┘
```

---

## 🔌 Behind the Scenes (Developer Info)

### API Endpoints Summary

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/api/tenant/subscriptions/current` | GET | Get tenant's current subscription | Tenant |
| `/api/tenant/subscriptions/invoices` | GET | Fetch billing history | Tenant |
| `/api/tenant/subscriptions/usage` | GET | Get feature usage metrics | Tenant |
| `/api/tenant/subscriptions/payment/submit` | POST | Submit GCash payment | Tenant |
| `/api/tenant/subscriptions/payment/status` | GET | Poll payment verification | Tenant |
| `/api/admin/subscriptions` | GET | List all subscriptions | Admin |
| `/api/admin/payments` | GET | List all payments | Admin |
| `/api/admin/subscriptions/payment/verify` | POST | Approve/reject payment | Admin |
| `/api/cron/payments/expiry-check` | GET | Auto-check expired payments | Cron |

### Email Flow

```
Tenant Action          → Email Sent                → Admin Action
────────────────────────────────────────────────────────────────
GCash Payment         → Confirmation Email        → Reviews at /admin/payments
Submitted             → "Your payment is         
                        pending review"           

                                                  ↓ Clicks [Approve]
                                                  
Admin Approves        → Verified Email           → Subscription Activated
                      → "Payment confirmed!      → Tenant gets access
                      →  Your plan is active"    → Next renewal set

                      OR

                      ↓ Clicks [Reject]

Admin Rejects         → Rejected Email           → Payment marked failed
                      → "Sorry, we couldn't      → Tenant can resubmit
                      →  process your payment"

7 Days Later          → Expiry Alert Email       → Payment auto-expired
(No approval)         → "Your payment window     → System sends alert
                      →  closes in 24 hours"     → Admin notified
```

---

## 🚀 Getting Started

### For Tenants:
1. **Log in** to `/dashboard/[your-business-name]`
2. **Click** "Billing & Subscriptions" in sidebar (new link!)
3. **View** your current plan and usage
4. **Click** "Upgrade Plan" or "Manage Plan" to make changes

### For Admins:
1. **Log in** as admin to `/admin`
2. **View** payment stats in admin dashboard
3. **Go to** "Payments" sidebar link (new link!)
4. **Review** pending payments and approve/reject
5. **Go to** "Subscriptions" to manage available plans

---

## 📱 Mobile Responsive
All pages are fully responsive and work on:
- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (320px - 767px)

---

## ⚡ Features Rolled Out
- ✅ GCash payment integration
- ✅ Real-time payment polling
- ✅ Admin payment approval/rejection
- ✅ Email notifications (4 templates)
- ✅ Feature usage tracking
- ✅ Invoice history
- ✅ Plan comparison
- ✅ Auto-expiry checks (cron-ready)
- ✅ Full TypeScript support
- ✅ Responsive design

---

**Status**: 🟢 **LIVE AND ACCESSIBLE**  
**Last Updated**: December 4, 2025

