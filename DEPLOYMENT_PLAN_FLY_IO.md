# BizCore Fly.io Deployment Plan

**Status**: Deferred - Complete after full system implementation  
**Target Platform**: Fly.io  
**Date Created**: December 4, 2025

## Overview
Payment notification system requires automated cron job scheduler. This plan documents setup steps to be executed during final deployment phase.

## Components to Deploy

### 1. Email Service
- **File**: `lib/email/paymentEmails.ts`
- **Setup**: Gmail SMTP via Nodemailer
- **Environment Variables Required**:
  ```
  SMTP_USER=cesaresmero2@gmail.com
  SMTP_PASS=jwptvzjbyigydwgz
  ADMIN_EMAIL=cesaresmero2@gmail.com
  ```
- **Status**: ✅ Configured in `.env.local`

### 2. Payment APIs
- **Submit**: `/api/tenant/subscriptions/payment/submit` - Sends confirmation email
- **Status Check**: `/api/tenant/subscriptions/payment/status` - Polls verification
- **Admin Verify**: `/api/admin/subscriptions/payment/verify` - Approves/rejects with email
- **Admin Dashboard**: `/api/admin/payments` - Enhanced with email on approve/reject
- **Expiry Check**: `/api/cron/payments/expiry-check` - Automated expiry + alerts

### 3. Database Schema
- **Migration Applied**: `20251204133317_add_payment_verification_fields`
- **Fields Added to Payment**:
  - `verifiedAt` (DateTime, nullable)
  - `expiresAt` (DateTime, nullable)
  - `failureReason` (String, nullable)
- **Fields Modified in Subscription**:
  - `nextPaymentDate` (DateTime, nullable) - used instead of nextBillingDate

## Cron Job Setup (Choose One Option)

### Option A: EasyCron (Recommended - Simplest)

**Setup Steps:**
1. Go to https://www.easycron.com/
2. Sign up for free account
3. Click "Add a new Cron Job"
4. Fill in details:
   - **URL**: `https://yourdomain.fly.dev/api/cron/payments/expiry-check`
   - **Method**: GET
   - **HTTP Headers**: Add custom header
     - Name: `Authorization`
     - Value: `Bearer {CRON_SECRET}`
   - **Timeout**: 30 seconds
5. Set schedule: `0 * * * *` (Every hour at minute 0)
6. Enable notifications if desired
7. Save and test

**Cost**: Free tier includes 100 cron jobs per month

### Option B: cron-job.org (Alternative)

**Setup Steps:**
1. Go to https://cron-job.org/en/
2. Register account
3. Click "Create Cronjob"
4. Fill in:
   - **Execution time**: `0 * * * *` (Every hour)
   - **URL**: `https://yourdomain.fly.dev/api/cron/payments/expiry-check`
   - **HTTP Method**: GET
   - **HTTP Headers**: 
     ```
     Authorization: Bearer {CRON_SECRET}
     ```
5. Save and test

**Cost**: Free for up to 100 jobs/month

### Option C: Fly.io Native (Advanced)

If you want cron native to Fly.io:

**1. Create `fly.toml` cron process:**
```toml
[[processes]]
cron = "curl -s -H 'Authorization: Bearer $CRON_SECRET' https://yourdomain.fly.dev/api/cron/payments/expiry-check"

[[cron_checks]]
processes = ["cron"]
entrypoints = []
cmd = "curl -X GET -H 'Authorization: Bearer $CRON_SECRET' http://localhost:3000/api/cron/payments/expiry-check"
schedule = "0 * * * *"
timeout = "30s"
```

**2. Deploy and set environment:**
```bash
fly secrets set CRON_SECRET=your_secret_here
fly deploy
```

## Environment Variables Required

Add to Fly.io secrets before deployment:

```bash
fly secrets set SMTP_USER="cesaresmero2@gmail.com"
fly secrets set SMTP_PASS="jwptvzjbyigydwgz"
fly secrets set ADMIN_EMAIL="cesaresmero2@gmail.com"
fly secrets set CRON_SECRET="generate-random-secret-here"
```

**Generate CRON_SECRET:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows PowerShell:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString())) 
```

## Testing Checklist

Before marking as complete:

- [ ] Deploy to Fly.io
- [ ] Set all environment variables
- [ ] Configure cron job service
- [ ] Test cron endpoint manually: `curl -H "Authorization: Bearer {CRON_SECRET}" https://yourdomain.fly.dev/api/cron/payments/expiry-check`
- [ ] Verify response: `{ "success": true, "message": "...", "alertsSent": X }`
- [ ] Create test payment with GCash
- [ ] Verify confirmation email sent
- [ ] Wait for cron to run (check logs)
- [ ] Verify expiry alert email sent (if within 24h of expiry)
- [ ] Approve payment in admin dashboard
- [ ] Verify verification email sent
- [ ] Check subscription status changed to active

## Monitoring & Logs

**View Fly.io logs:**
```bash
fly logs
```

**Filter for payment cron:**
```bash
fly logs | grep "cron\|payments\|expiry"
```

**Check cron service (EasyCron/cron-job.org):**
- View execution history
- Check for failures or timeouts
- Adjust schedule if needed

## Rollback Plan

If cron job causes issues:

**Disable EasyCron/cron-job.org:**
1. Go to service dashboard
2. Pause/Delete cronjob
3. Manually trigger expiry checks via admin

**Or disable Fly.io native cron:**
```bash
fly scale count --process cron=0
```

## Timeline

- **Phase 1** (Current): Complete payment system implementation ✅
- **Phase 2** (Next): Full BizCore system completion
- **Phase 3** (Final): Deploy to Fly.io with cron setup

## Notes

- Cron runs every hour on minute 0
- Checks for payments unpaid for 7 days
- Sends alerts 24 hours before expiry
- Auto-marks expired payments
- All timestamps in UTC
- Gmail has rate limit of ~100 emails/hour (sufficient for this use case)

## Related Files

- `lib/email/paymentEmails.ts` - Email service
- `app/api/cron/payments/expiry-check/route.ts` - Cron endpoint
- `app/api/admin/payments/route.ts` - Admin dashboard API
- `app/api/tenant/subscriptions/payment/submit/route.ts` - Payment submission
- `.env.local` - Local environment variables (DO NOT commit)
