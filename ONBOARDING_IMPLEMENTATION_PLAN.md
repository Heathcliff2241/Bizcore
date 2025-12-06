# Onboarding Implementation Plan - BizCore

## Objective
Make the onboarding wizard fully functional with:
1. Database persistence for business info, products, and categories
2. Email verification with OTP (One-Time Password)
3. Admin notifications for new tenant registrations
4. Integration with existing Prisma models

---

## Phase 1: Email Verification with OTP

### 1.1 Database Schema Updates
**Files to modify**: `prisma/schema.prisma`

Add new fields to `User` model:
```prisma
emailVerificationOtp     String?      // 6-digit OTP
emailVerificationOtpExpires DateTime? // OTP expiration (10 minutes)
emailVerificationAttempts Int @default(0) // Track failed attempts
```

Add new model for tracking registrations:
```prisma
model TenantRegistration {
  id                Int      @id @default(autoincrement())
  userId            Int
  user              User     @relation(fields: [userId], references: [id])
  email             String
  businessName      String
  industry          String?
  description       String?
  verificationToken String   @unique
  isVerified        Boolean  @default(false)
  createdAt         DateTime @default(now())
  expiresAt         DateTime // 24-hour expiration for registration
  
  @@index([userId])
  @@index([email])
  @@map("tenant_registrations")
}
```

### 1.2 Email Service Setup
**Create new file**: `lib/email.ts`

Features:
- Nodemailer configuration (already in package.json)
- Functions:
  - `sendOtpEmail(email, otp)` - Send 6-digit OTP via Gmail/SMTP
  - `sendAdminNotification(tenantData)` - Notify admin of new registration
  - `sendVerificationSuccess(email, tenantName)` - Confirmation email
  - `sendOnboardingComplete(email, tenantName, dashboard)` - Welcome email

Configuration:
- Use environment variables: `SMTP_USER`, `SMTP_PASS`, `ADMIN_EMAIL`
- Add to `.env.local`: Gmail SMTP or SendGrid credentials
- Email templates using plain HTML with inline CSS

### 1.3 API Route: Request OTP
**Create new file**: `app/api/onboarding/request-otp/route.ts`

Endpoint: `POST /api/onboarding/request-otp`

Request body:
```json
{
  "email": "owner@example.com",
  "businessName": "The Coffee House",
  "industry": "Food & Beverage"
}
```

Logic:
1. Validate email format
2. Check if email already registered
3. Generate 6-digit OTP
4. Store OTP in User model (or create temp record) with 10-min expiry
5. Send OTP via email
6. Return success with masked email ("o***r@example.com")
7. Rate limiting: Max 3 OTP requests per email per hour

Response:
```json
{
  "success": true,
  "message": "OTP sent to o***r@example.com",
  "expiresIn": 600,
  "email": "owner@example.com"
}
```

---

## Phase 2: OTP Verification & Registration

### 2.1 API Route: Verify OTP
**Create new file**: `app/api/onboarding/verify-otp/route.ts`

Endpoint: `POST /api/onboarding/verify-otp`

Request body:
```json
{
  "email": "owner@example.com",
  "otp": "123456",
  "businessName": "The Coffee House"
}
```

Logic:
1. Validate OTP matches stored OTP
2. Check OTP not expired
3. Prevent brute force: Max 5 attempts per OTP
4. Lock account after 5 failed attempts (15-min cooldown)
5. Create temporary session token valid for 30 minutes
6. Store in Redis or JWT for onboarding wizard

Response:
```json
{
  "success": true,
  "token": "eyJ...",
  "expiresIn": 1800,
  "userId": null,
  "email": "owner@example.com"
}
```

### 2.2 Frontend: Add OTP Verification Step
**Modify**: `app/onboarding/page.tsx`

New step before existing flow:
1. Email input with business name
2. Button: "Send OTP"
3. OTP verification UI with 6 digit inputs
4. Resend OTP button (after 60 sec)
5. Countdown timer (10 minutes)

---

## Phase 3: Onboarding Data Persistence

### 3.1 API Route: Apply Onboarding
**Create new file**: `app/api/onboarding/apply/route.ts`

Endpoint: `POST /api/onboarding/apply`

Request body:
```json
{
  "email": "owner@example.com",
  "verificationToken": "token...",
  "businessName": "The Coffee House",
  "industry": "Food & Beverage",
  "description": "Premium coffee shop...",
  "subdomain": "coffeehouse",
  "branchName": "Main Branch",
  "branchAddress": "123 Main St",
  "openingTime": "09:00",
  "closingTime": "18:00",
  "products": [
    { "name": "Espresso", "price": 3.50 },
    { "name": "Cappuccino", "price": 4.50 }
  ],
  "taxPercent": 10
}
```

Logic (Transaction):
1. Validate verification token
2. Create User:
   - Email from token
   - Generate temp password
   - Set emailVerified = true
   - Clear OTP fields
3. Create Tenant:
   - Link to new User (ownerId)
   - Set name, subdomain, description, industry
   - Set primary colors (blue theme)
4. Create Categories:
   - Default category: "General" or from products
5. Create Products:
   - From onboarding data
   - Link to category
6. Create default Branch:
   - Store opening/closing times
7. Create TenantUser:
   - Link User to Tenant with "owner" role
8. Trigger admin notification email
9. Generate auth session token
10. Return auth token + redirect to dashboard

Response:
```json
{
  "success": true,
  "user": { "id": 1, "email": "owner@example.com" },
  "tenant": { "id": 1, "subdomain": "coffeehouse", "name": "The Coffee House" },
  "sessionToken": "...",
  "redirectUrl": "/dashboard/coffeehouse"
}
```

### 3.2 Data Models to Create

**Categories**: 
- Auto-create "General" category if products provided
- One category per onboarding type (optional)

**Products**:
- From onboarding wizard products/services list
- Link to category
- Price field (if provided)
- Active by default

**Branch** (implied, not explicit model yet):
- Store in Tenant.settings JSON or create Branch model
- Operating hours (openingTime, closingTime)
- Address (branchAddress)

---

## Phase 4: Admin Notifications

### 4.1 Admin Dashboard Notification System
**Create new file**: `app/api/admin/notifications/route.ts`

Features:
- GET endpoint: Fetch notifications for admin
- Notification model:
  ```prisma
  model AdminNotification {
    id        Int      @id @default(autoincrement())
    type      String   @default("new_registration") // "new_registration", "verification_failed", "activity"
    tenantId  Int?
    tenant    Tenant?  @relation(fields: [tenantId], references: [id])
    title     String
    message   String
    actionUrl String?
    isRead    Boolean  @default(false)
    createdAt DateTime @default(now())
    
    @@map("admin_notifications")
  }
  ```

### 4.2 Real-time Admin Alerts
**Email notification** (immediate):
- Recipient: ADMIN_EMAIL env var
- Subject: "🎉 New Tenant Registration: [Business Name]"
- Content:
  - Business name, industry, subdomain
  - Owner email and registration time
  - Link to view tenant in admin dashboard
  - Link to contact owner

**Dashboard notification** (persistent):
- Create notification record in database
- Display in admin dashboard top bar
- Badge count of unread notifications
- Click through to registration details

### 4.3 Email Template for Admin
**Create**: `lib/email-templates.ts`

Template structure:
```html
<h2>New Tenant Registration</h2>
<p><strong>Business Name:</strong> {businessName}</p>
<p><strong>Industry:</strong> {industry}</p>
<p><strong>Subdomain:</strong> {subdomain}</p>
<p><strong>Owner Email:</strong> {email}</p>
<p><strong>Registration Time:</strong> {timestamp}</p>
<a href="{dashboardLink}">View in Admin Dashboard</a>
```

---

## Phase 5: Frontend Integration

### 5.1 Onboarding Flow Changes
**Modify**: `app/onboarding/page.tsx`

New step structure:
```
Step 0: Email Verification (NEW)
  - Email input + business name
  - OTP verification with countdown

Step 1: Welcome (EXISTING)
Step 2: Business Profile (EXISTING)
Step 3: Branch Setup (EXISTING)
Step 4: Products & Categories (EXISTING - enhanced)
Step 5: Inventory & Staff (EXISTING)
Step 6: Preferences (EXISTING - add more)
Step 7: Completion (EXISTING)
```

### 5.2 OTP Input Component
**Create**: `components/onboarding/OtpInput.tsx`

Features:
- 6 input fields (one per digit)
- Auto-focus next field on digit entry
- Delete key removes digit
- Paste support (parse 6 digits)
- Resend button (disabled until 60 sec)
- Countdown timer (10 minutes)
- Error state for invalid OTP

### 5.3 Loading States & Error Handling
- Loading spinners during API calls
- Error messages with retry buttons
- Success animations
- Rate limit messages ("Too many attempts, try again in 15 min")

---

## Phase 6: Security & Validation

### 6.1 Rate Limiting
**Create**: `lib/rate-limit.ts` (enhance if exists)

Rules:
- OTP request: 3 per email per hour
- OTP verify: 5 attempts per OTP
- Account lock: 15 minutes after 5 failed attempts
- Onboarding submit: 1 per IP per 5 minutes

### 6.2 Subdomain Validation
- Allowed: alphanumeric, hyphens, 3-30 chars
- Reserved: "admin", "api", "www", "mail", etc.
- Unique check against existing tenants

### 6.3 Email Validation
- Standard regex + DNS check (optional)
- Block disposable emails (optional)
- Normalize: lowercase, trim whitespace

### 6.4 Data Sanitization
- Sanitize business name, description (XSS prevention)
- HTML encode in email templates
- SQL injection prevention (Prisma handles)

---

## Phase 7: Environment Setup

### 7.1 Add to `.env.local`
```
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@example.com

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6

# Onboarding Configuration
ONBOARDING_TOKEN_EXPIRY_SECONDS=1800
SUBDOMAIN_RESERVED_WORDS=admin,api,www,mail,support
```

### 7.2 Gmail App Password Setup
- Use App Passwords (not main password)
- 2FA required on Gmail account
- Generate app-specific password

---

## Implementation Checklist

### Database Layer
- [ ] Add OTP fields to User model
- [ ] Create TenantRegistration model
- [ ] Create AdminNotification model
- [ ] Run migration: `npm run db:migrate`

### Email Service
- [ ] Create `lib/email.ts` with Nodemailer setup
- [ ] Create email templates in `lib/email-templates.ts`
- [ ] Test email sending locally
- [ ] Configure SMTP env vars

### API Routes
- [ ] Create `/api/onboarding/request-otp` route
- [ ] Create `/api/onboarding/verify-otp` route
- [ ] Modify `/api/onboarding/apply` route
- [ ] Create `/api/admin/notifications` route
- [ ] Add rate limiting middleware

### Frontend
- [ ] Create `OtpInput.tsx` component
- [ ] Update onboarding wizard steps
- [ ] Add email verification step
- [ ] Update form validation
- [ ] Add error handling UI

### Testing
- [ ] Unit tests for OTP generation/validation
- [ ] Integration tests for onboarding flow
- [ ] Email delivery tests
- [ ] Rate limiting tests
- [ ] Admin notification tests

### Admin Dashboard
- [ ] Create notification display component
- [ ] Create registration details page
- [ ] Add filters for notifications
- [ ] Add "mark as read" functionality

---

## Database Migration Order

```sql
-- Step 1: Add OTP fields to users
ALTER TABLE users ADD COLUMN emailVerificationOtp VARCHAR(6);
ALTER TABLE users ADD COLUMN emailVerificationOtpExpires TIMESTAMP;
ALTER TABLE users ADD COLUMN emailVerificationAttempts INT DEFAULT 0;

-- Step 2: Create tenant_registrations table
CREATE TABLE tenant_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  businessName VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  description TEXT,
  verificationToken VARCHAR(255) UNIQUE NOT NULL,
  isVerified BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX (userId),
  INDEX (email)
);

-- Step 3: Create admin_notifications table
CREATE TABLE admin_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50) DEFAULT 'new_registration',
  tenantId INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  actionUrl VARCHAR(500),
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenantId) REFERENCES tenants(id),
  INDEX (tenantId)
);
```

---

## Summary

**Total API Endpoints**: 4
- `POST /api/onboarding/request-otp`
- `POST /api/onboarding/verify-otp`
- `POST /api/onboarding/apply` (modified)
- `GET /api/admin/notifications`

**New Database Models**: 2
- `TenantRegistration`
- `AdminNotification`

**New Components**: 1-2
- `OtpInput.tsx`
- Optional: `AdminNotificationCenter.tsx`

**New Utilities**: 2
- `lib/email.ts`
- `lib/email-templates.ts`

**Estimated Development Time**: 8-12 hours (implementation + testing)

