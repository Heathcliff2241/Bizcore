# OTP Verification Flow Documentation

## Overview
BizCore implements a secure email-based OTP (One-Time Password) verification system for user onboarding. The flow ensures users verify their email addresses before completing tenant registration.

---

## Complete Flow Diagram

```
User starts onboarding
         ↓
[Step 0: Email Verification]
         ↓
Enter Email + Business Name
         ↓
POST /api/onboarding/request-otp
         ↓
OTP generated & sent via email
         ↓
User receives email with 6-digit OTP
         ↓
User enters OTP in form
         ↓
10-minute countdown timer starts
         ↓
POST /api/onboarding/verify-otp
         ↓
OTP validated & verification token generated
         ↓
[Step 1: Welcome → Step 7: Completion]
         ↓
User fills out remaining onboarding steps
         ↓
POST /api/onboarding/apply
         ↓
Tenant created, user marked as verified
         ↓
Email: Onboarding complete + Admin notification
         ↓
User redirected to /dashboard/{subdomain}
```

---

## Phase 1: Request OTP

### Endpoint
**POST** `/api/onboarding/request-otp`

### Request Body
```json
{
  "email": "user@example.com",
  "businessName": "My Business"
}
```

### What Happens
1. **Email Validation** - Validates email format using regex
2. **Rate Limiting** - Enforces 3 OTP requests per email per hour
   - Returns 429 if limit exceeded with retry-after timestamp
3. **User Lookup/Creation** - Checks if user exists, creates if needed
4. **OTP Generation** - Generates random 6-digit code
   - Stored as: `User.emailVerificationOtp`
   - Expiry set to: `User.emailVerificationOtpExpires` (10 minutes from now)
   - Attempts counter reset: `User.emailVerificationAttempts = 0`
5. **Email Sending** - Sends OTP via Nodemailer
   - Template: `sendOtpEmail()`
   - Includes: 6-digit OTP, 10-minute countdown, resend link
   - Uses Ethereal (dev) or SMTP (production)
6. **Response** - Returns masked email (e.g., `u***@example.com`) and expiry time

### Response (200)
```json
{
  "success": true,
  "message": "OTP sent to email",
  "maskedEmail": "u***@example.com",
  "expiryTime": "2025-12-01T14:35:00Z"
}
```

### Error Responses
- **400**: Invalid email format
- **429**: Rate limit exceeded (3 per hour per email)
- **500**: Server error (SMTP failure, etc.)

---

## Phase 2: Verify OTP

### Endpoint
**POST** `/api/onboarding/verify-otp`

### Request Body
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### What Happens
1. **Email Validation** - Validates email format
2. **User Lookup** - Finds user by email
   - Returns 404 if user not found
3. **Rate Limiting** - Enforces 5 OTP attempts per 15 minutes
   - Checks: `User.emailVerificationAttempts`
   - Returns 429 if > 5 attempts (locks account for 15 minutes)
4. **OTP Format Validation** - Checks OTP is 6 digits
   - Returns 400 if invalid format
5. **OTP Expiry Check** - Verifies OTP hasn't expired
   - Compares current time with `User.emailVerificationOtpExpires`
   - Returns 400 if expired
6. **OTP Match Check** - Compares submitted OTP with stored OTP
   - Increments `User.emailVerificationAttempts` if wrong
   - Returns 401 if doesn't match
7. **Clear OTP** - If valid:
   - Clears: `User.emailVerificationOtp = null`
   - Clears: `User.emailVerificationOtpExpires = null`
   - Resets: `User.emailVerificationAttempts = 0`
8. **Generate Verification Token** - Creates JWT token
   - Token payload: `{ email, userId, verified: true }`
   - Expiry: 30 minutes (can be configured via `ONBOARDING_TOKEN_EXPIRY_SECONDS`)
   - Secret: Uses `NEXTAUTH_SECRET`
9. **Generate Session Token** - Creates JWT for temporary session
   - Token payload: `{ email, userId }`
   - Expiry: 7 days
10. **Response** - Returns both tokens

### Response (200)
```json
{
  "success": true,
  "message": "Email verified successfully",
  "verificationToken": "eyJhbGc...",
  "sessionToken": "eyJhbGc...",
  "userId": "user-id-123"
}
```

### Error Responses
- **400**: Invalid email, OTP format, or expired OTP
- **401**: OTP doesn't match
- **404**: User not found
- **429**: Too many attempts (account locked 15 min)
- **500**: Server error

---

## Phase 3: Frontend - Email Verification Component

### Component
`/components/onboarding/EmailVerificationStep.tsx`

### Two-Step Flow

#### Step 1: Email Entry
```tsx
<EmailVerificationStep onSuccess={(email, token, businessName) => {
  // Move to next step
}} />
```

**User Input:**
- Email address
- Business name (optional, for UI display)

**Actions:**
1. POST to `/api/onboarding/request-otp`
2. Show loading spinner while awaiting response
3. Display masked email (e.g., `u***@example.com`)
4. Start 10-minute countdown timer
5. Show resend button (cooldown prevents spam)

**Validation:**
- Email required and must be valid format
- Business name sanitized (XSS prevention)

#### Step 2: OTP Entry
```tsx
<OtpInput onChange={(value) => setOtp(value)} />
```

**User Input:**
- 6 individual digit fields
- Supports: typing, backspace, arrow keys, paste (extracts 6 digits)

**Actions:**
1. Auto-focus between fields as user types
2. Display remaining attempts counter
3. Show countdown timer (MM:SS format)
4. POST to `/api/onboarding/verify-otp` when all 6 digits entered
5. Handle validation errors with red styling

**Auto-Submit:**
- When 6th digit entered, automatically submits OTP
- User sees loading state until response

**Resend OTP:**
- Button disabled while countdown active
- When countdown reaches 0, enables resend
- POST to `/api/onboarding/request-otp` again

**Error Handling:**
- Invalid OTP: Show "Invalid code" message
- Expired OTP: Show "Code expired, request new one"
- Too many attempts: Show "Too many attempts. Try again in 15 minutes"
- Network error: Show "Network error, please try again"

**Success:**
- Calls: `onSuccess(email, verificationToken, businessName)`
- Moves wizard to Step 1 (Welcome screen)

---

## Phase 4: Resume Onboarding

### Component
`/app/onboarding/page.tsx`

### Step Flow (8 Total Steps)

```
Step 0: Email Verification (EmailVerificationStep)
         ↓ onSuccess callback captures: email, verificationToken, businessName
Step 1: Welcome
Step 2: Business Profile (includes subdomain field)
Step 3: Branch Setup (branch name, address, hours)
Step 4: Products (optional product entry)
Step 5: Inventory/Staff (future features)
Step 6: Preferences (tax, settings)
Step 7: Completion (review summary)
         ↓
Final Submit: applyOnboarding()
```

### Data Structure
```typescript
interface BusinessInfo {
  // From EmailVerificationStep
  email: string
  verificationToken: string
  businessName: string

  // From subsequent steps
  industry: string
  description: string
  subdomain: string
  branchName: string
  branchAddress: string
  openingTime: string
  closingTime: string
  taxPercent: number
  products: Array<{
    name: string
    description?: string
    price: number
    cost?: number
  }>
}
```

### State Management
```typescript
const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
  email: '',
  verificationToken: '',
  businessName: '',
  industry: '',
  description: '',
  subdomain: '',
  branchName: '',
  branchAddress: '',
  openingTime: '',
  closingTime: '',
  taxPercent: 0,
  products: []
})
```

### Step Validation
```typescript
// Step 0 (Email Verification)
if (currentStep === 0) {
  return businessInfo.email && businessInfo.verificationToken
}

// Step 2 (Business Profile - with subdomain)
if (currentStep === 2) {
  return businessInfo.businessName && businessInfo.subdomain && validateSubdomain(businessInfo.subdomain)
}

// Other steps require their specific fields
```

---

## Phase 5: Apply Onboarding (Final Submission)

### Endpoint
**POST** `/api/onboarding/apply`

### Request Body
```json
{
  "email": "user@example.com",
  "verificationToken": "eyJhbGc...",
  "businessName": "My Business",
  "industry": "Retail",
  "description": "A great business",
  "subdomain": "my-business",
  "branchName": "Main Branch",
  "branchAddress": "123 Main St",
  "openingTime": "09:00",
  "closingTime": "18:00",
  "taxPercent": 10,
  "products": [
    {
      "name": "Product 1",
      "price": 100,
      "cost": 50
    }
  ]
}
```

### What Happens
1. **Validation**
   - Email format validation
   - Verification token validation (checks it's valid JWT)
   - Required fields check
   - Subdomain format validation (3-30 chars, alphanumeric + hyphens)
   - Subdomain reserved words check (admin, api, www, etc.)

2. **Rate Limiting**
   - 1 submission per IP per 5 minutes
   - Returns 429 if exceeded

3. **Token Verification**
   - Verifies JWT signature using `NEXTAUTH_SECRET`
   - Ensures token hasn't expired
   - Extracts email from token payload

4. **Database Transaction** (Atomic Operation)
   - If any step fails, entire transaction rolls back
   
   **Step 1: Update User**
   ```
   - Mark emailVerified = true
   - Clear OTP fields (all set to null)
   - Reset OTP attempts to 0
   - Set firstName/lastName from business name
   - Set role = 'tenant_owner'
   ```
   
   **Step 2: Create Tenant**
   ```
   - Create Tenant record with:
     - name, subdomain, description, industry
     - ownerId (from user)
     - primaryColor, secondaryColor
     - isActive: true
     - isPremium: false
     - subscriptionPlan: 'free'
   ```
   
   **Step 3: Create Default Category**
   ```
   - Create Category record:
     - name: 'General'
     - description: 'Default product category'
   ```
   
   **Step 4: Create Products** (if provided)
   ```
   - For each product in array:
     - Create Product record with:
       - tenantId, categoryId
       - name, description, price, cost
       - isActive: true
   ```
   
   **Step 5: Create TenantUser Relationship**
   ```
   - Create TenantUser record:
     - tenantId, userId
     - role: 'owner'
   ```
   
   **Step 6: Store Branch Settings**
   ```
   - Update Tenant.settings (JSON):
     {
       "branches": [{
         "name": "Main Branch",
         "address": "123 Main St",
         "openingTime": "09:00",
         "closingTime": "18:00",
         "isDefault": true
       }],
       "tax": {
         "defaultTaxPercent": 10
       }
     }
   ```

5. **Send Emails**
   - **User Email**: "Onboarding Complete"
     - Welcome message
     - Link to dashboard: `/dashboard/{subdomain}`
   - **Admin Email**: "New Registration"
     - Tenant name, industry, subdomain
     - Owner email
     - Link to admin tenant page

6. **Create Admin Notification**
   ```typescript
   AdminNotification.create({
     type: 'new_registration',
     tenantId: tenant.id,
     title: `New Registration: ${businessName}`,
     message: `Details...`,
     actionUrl: `/admin/tenants/${tenant.id}`,
     isRead: false
   })
   ```

7. **Generate JWT Session Token**
   ```typescript
   jwt.sign({
     userId: user.id,
     email: user.email,
     role: 'tenant_owner',
     tenantId: tenant.id,
     subdomain: tenant.subdomain
   }, NEXTAUTH_SECRET, { expiresIn: '7d' })
   ```

8. **Response** (201 Created)
   ```json
   {
     "success": true,
     "message": "Onboarding completed successfully",
     "user": {
       "id": "user-id",
       "email": "user@example.com",
       "firstName": "My",
       "lastName": "Business"
     },
     "tenant": {
       "id": "tenant-id",
       "name": "My Business",
       "subdomain": "my-business"
     },
     "sessionToken": "eyJhbGc...",
     "redirectUrl": "/dashboard/my-business"
   }
   ```

### Frontend: applyOnboarding()
```typescript
const applyOnboarding = async () => {
  // 1. Validate all required fields
  if (!businessInfo.email || !businessInfo.verificationToken) {
    alert('Email verification required')
    return
  }

  // 2. POST to /api/onboarding/apply
  const response = await fetch('/api/onboarding/apply', {
    method: 'POST',
    body: JSON.stringify(businessInfo)
  })

  // 3. Handle response
  if (response.ok) {
    const data = await response.json()
    
    // 4. Store session token
    localStorage.setItem('auth_token', data.sessionToken)
    localStorage.setItem('tenant', JSON.stringify(data.tenant))
    
    // 5. Redirect to dashboard
    router.push(data.redirectUrl)
  } else {
    const error = await response.json()
    alert(error.error) // Show user-friendly error
  }
}
```

### Error Responses
- **400**: Invalid input (email, subdomain, token, etc.)
- **429**: Rate limit exceeded
- **409**: Subdomain already in use
- **500**: Server error (transaction failed)

---

## Key Security Features

### 1. OTP Generation
- Uses Node.js `crypto` module for secure random 6-digit generation
- Not predictable or guessable

### 2. Attempt Limiting
- Max 5 failed OTP attempts per 15 minutes
- Account locks after 5 attempts
- Prevents brute force attacks

### 3. Time-Based Expiry
- OTP expires after 10 minutes
- Timestamp verified on backend (no client-side trust)

### 4. Rate Limiting
- OTP request: 3 per email per hour
- OTP verify: 5 attempts per 15 minutes
- Onboarding apply: 1 per IP per 5 minutes
- Prevents spam and DoS attacks

### 5. Token Validation
- Verification token is JWT signed with `NEXTAUTH_SECRET`
- Signature verified on apply endpoint
- Token expiry enforced (30 minutes)

### 6. Email Confirmation
- User must verify email before account fully created
- Prevents typos and invalid emails from blocking registrations

### 7. Input Validation & Sanitization
- Email format validated with regex
- Business name sanitized (XSS prevention)
- Description sanitized
- Subdomain alphanumeric validation
- Reserved words blocked (admin, api, www, etc.)

### 8. Database Constraints
- Email must be unique across users
- Subdomain must be unique across tenants
- `tenantId` for all data (multi-tenant isolation)

### 9. Transaction Safety
- All or nothing: Tenant creation rolls back if any step fails
- No partial data left behind

---

## Environment Variables Required

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email Configuration
SMTP_PROVIDER=ethereal|smtp  # 'ethereal' for dev, 'smtp' for production
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-email
SMTP_PASS=your-ethereal-password
ADMIN_EMAIL=admin@bizcore.app

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
ONBOARDING_TOKEN_EXPIRY_SECONDS=1800

# Onboarding Configuration
SUBDOMAIN_RESERVED_WORDS=admin,api,www,mail,smtp,imap,pop,ftp,www2,localhost,webmail,api-dev,staging
```

---

## Database Schema

### User Model (OTP Fields)
```prisma
model User {
  // ... existing fields
  emailVerificationOtp          String?       @db.VarChar(6)
  emailVerificationOtpExpires   DateTime?
  emailVerificationAttempts     Int           @default(0)
  emailVerificationToken        String?       @unique
  // ... rest of fields
}
```

### AdminNotification Model
```prisma
model AdminNotification {
  id          String   @id @default(cuid())
  type        String   // 'new_registration', 'payment_received', etc.
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title       String
  message     String   @db.Text
  actionUrl   String?
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Testing Checklist

- [ ] Request OTP with valid email
- [ ] Request OTP with invalid email format → 400
- [ ] Request OTP 4 times in 1 hour → Rate limited on 4th attempt
- [ ] Receive OTP email with correct format
- [ ] Verify OTP with correct code → Success
- [ ] Verify OTP with wrong code → Show error, increment attempts
- [ ] Verify OTP after 10 minutes → Expired error
- [ ] Try OTP verify 6+ times → Account locked, 429 response
- [ ] Complete all onboarding steps
- [ ] Submit with invalid subdomain format → 400
- [ ] Submit with reserved subdomain (admin, api) → 400
- [ ] Submit with duplicate subdomain → 400
- [ ] Submit valid application → Tenant created, user verified, emails sent
- [ ] Check admin notifications page → New registration appears
- [ ] Check user email → Onboarding complete email received
- [ ] Check admin email → New registration notification received
- [ ] Redirect to dashboard → User logged in and can access tenant

---

## Summary

The OTP flow is a **7-phase verification and onboarding system**:

1. **Request OTP** → User requests 6-digit code
2. **Send Email** → Code sent via email (10-min expiry)
3. **Verify OTP** → User enters code, validation occurs
4. **Generate Token** → JWT verification token issued
5. **Resume Wizard** → User completes remaining steps
6. **Apply Onboarding** → Final submission with transaction
7. **Complete Setup** → Tenant created, emails sent, user redirected

All data is validated, rate-limited, and secured with industry-standard practices.
