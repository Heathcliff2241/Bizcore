# BizCore: Final Unified System Flowchart
**Version 2.0** | Last Updated: December 10, 2025

---

## Executive Summary

BizCore is a multi-tenant SaaS platform with four unified user journeys, each flowing from entry → authentication → dashboard → logout.

User types:
1. **Super Admin** – System-wide oversight via `/admin`
2. **Tenant Owner** – Business operator via `/dashboard/{subdomain}`
3. **Employee (POS)** – Point-of-sale staff via `/pos/{subdomain}`
4. **Customer** – Shopper via `/storefront/{subdomain}`

Each user type has a **separate session system**, **distinct API endpoints**, and **role-based dashboard**, but they all follow the same authentication → authorization → action → logout lifecycle.

---

## Table of Contents

1. [Unified User Flow (All Paths)](#unified-user-flow-all-paths)
2. [Overall Architecture](#overall-architecture)
3. [Authentication & Session Management](#authentication--session-management)
4. [Detailed User Flows](#detailed-user-flows)
5. [API Landscape](#api-landscape)
6. [Database Schema Overview](#database-schema-overview)
7. [Security & Rate Limiting](#security--rate-limiting)
8. [Integration Points](#integration-points)

---

## Unified User Flow (All Paths)

### Entry Point: BizCore Home (bizcore.test)

```
                    ┌─────────────────────────┐
                    │  BizCore Entry Point    │
                    │  (bizcore.test home)    │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  Check Existing Session │
                    │  (JWT cookie present?)  │
                    └────┬──────────┬──────┬──┴────┐
                         │          │      │       │
              (No Session)│          │      │       │ (Has Session)
                         ▼          ▼      ▼       ▼
                    ┌────────┐ ┌──────┐ ┌──────┐ ┌──────────┐
                    │ Login  │ │OTP   │ │Admin │ │Dashboard │
                    │ Signin │ │Verify│ │Route │ │Navigation│
                    └────┬───┘ └──┬───┘ └──┬───┘ └─────┬────┘
                         │        │       │            │
          ┌──────────────┼────────┼───────┼────────────┘
          │              │        │       │
          ▼              ▼        ▼       ▼
       ┌─────────┐  ┌──────┐  ┌──────┐  ┌──────┐
       │ Tenant  │  │Emp   │  │Admin │  │Cust  │
       │ Owner   │  │Mgmt  │  │Panel │  │Order │
       │ Signup  │  │Login │  │Login │  │Login │
       └────┬────┘  └──┬───┘  └──┬───┘  └──┬───┘
            │          │         │        │
            ▼          ▼         ▼        ▼
    
    BRANCH 1:      BRANCH 2:   BRANCH 3:   BRANCH 4:
    Tenant Owner   Employee    Super Admin Customer
    Path           Path        Path        Path
```

---

### Branch 1: TENANT OWNER LIFECYCLE

```
START (Tenant Owner, No Account)
    │
    ├─► bizcore.test/auth/onboarding
    │
    ├─► STEP 1: Email Submission (Request OTP)
    │   • POST /api/onboarding/request-otp
    │   • Rate limit: 3 requests/hour per email
    │   • Response: OTP sent to email (6-digit, 10-min expiry)
    │
    ├─► STEP 2: OTP Verification
    │   • POST /api/onboarding/verify-otp
    │   • Rate limit: 5 attempts/15 min
    │   • Response: verification token (UUID, 10-min expiry)
    │
    ├─► STEP 3: Tenant Information Form
    │   • Fill: Tenant Name, Subdomain
    │   • POST /api/onboarding/apply
    │   • Single transaction creates:
    │     - User (email verified, role='user')
    │     - Tenant (subdomain unique, owner=User)
    │     - TenantUser (role='owner')
    │     - Default Category
    │     - Sample Products
    │     - Homepage (Pages, PageDesigns)
    │   • Send welcome email
    │   • Auto-login: NextAuth session created
    │
    ├─► Redirected to /dashboard/{subdomain}
    │
    ├─► Dashboard Features Available:
    │   ├─► Products Manager
    │   ├─► Inventory Management
    │   ├─► Orders History
    │   ├─► Employees Management
    │   ├─► Settings/Branding
    │   ├─► Brand Studio Trigger (iframe)
    │   └─► Storefront Preview
    │
    ├─► Brand Studio Workflow (from Dashboard)
    │   ├─► Click "Brand Studio" → Confirmation Modal
    │   ├─► Opens iframe: /dashboard/{subdomain}/brandstudio
    │   ├─► Iframe handshake via postMessage:
    │   │   - Sends tenant data (id, name, subdomain)
    │   │   - BrandStudio Vite app receives via listener
    │   ├─► Edit page designs (header, sections, footer)
    │   ├─► Components library (Hero, Features, FAQ, etc.)
    │   ├─► Real-time preview with zoom/snap guides
    │   ├─► Auto-save via useAutoSave hook
    │   ├─► API calls: /api/pages/[id], /api/pageDesigns
    │   └─► Return to Dashboard
    │
    ├─► Employee Management
    │   ├─► Create employees: POST /api/employees
    │   ├─► Set password + PIN (both bcrypt hashed)
    │   ├─► Assign role (manager, cashier, chef, etc.)
    │   └─► Employees use POS system (Branch 2)
    │
    ├─► Session active: 30 days (NextAuth default, should be 24h)
    │   • Cookie: next-auth.session-token (HTTP-only, SameSite=lax)
    │   • JWT payload: { id, email, role, tenantId, name, token }
    │
    ├─► While Dashboard is Active
    │   ├─► Update products: PUT /api/products/{id}
    │   ├─► Adjust inventory: POST /api/ingredients (stock management)
    │   ├─► View orders: GET /api/orders (filtered by tenantId)
    │   ├─► Generate reports (if implemented)
    │   └─► Monitor storefront traffic
    │
    ├─► LOGOUT
    │   ├─► Click logout button
    │   ├─► NextAuth session cleared
    │   ├─► POST /api/auth/signout
    │   └─► Redirected to /auth/signin
    │
    └─► END (Session closed)
```

---

### Branch 2: EMPLOYEE (POS SYSTEM) LIFECYCLE

```
START (Employee, Account Created by Tenant Owner)
    │
    ├─► bizcore.test/pos/{subdomain}
    │
    ├─► STEP 1: POS Login Form
    │   ├─► Input: Email + Password OR PIN
    │   ├─► POST /api/pos/auth/login
    │   ├─► Rate limit: NONE (⚠️ GAP: Should be 5/15 min)
    │   ├─► Verify bcrypt password & PIN
    │   ├─► Check isActive flag (created by tenant owner)
    │   ├─► Response: JWT token (12-hour expiry)
    │   ├─► Token payload: { employeeId, tenantId, role, name, email }
    │   └─► Store in HTTP-only cookie
    │
    ├─► Redirected to /pos/{subdomain}/dashboard
    │
    ├─► POS Dashboard Features:
    │   ├─► Product Search / Filter by Category
    │   ├─► Add to Cart (with quantity selection)
    │   ├─► Cart Summary (itemized, totals with tax/discount)
    │   ├─► Customer Selection (optional: create ad-hoc or select existing)
    │   ├─► Order Type: Dine-in, Takeout, Delivery
    │   ├─► Payment Method: Cash, Card, QR Code (PayMaya, GCash)
    │   └─► Finalize Order Button
    │
    ├─► STEP 2: Create Order
    │   ├─► POST /api/pos/orders
    │   ├─► Request payload:
    │   │   ├─► tenantId (from JWT)
    │   │   ├─► employeeId (from JWT)
    │   │   ├─► customerId (optional)
    │   │   ├─► items: [{ productId, quantity }, ...]
    │   │   ├─► orderType: 'dine-in' | 'takeout' | 'delivery'
    │   │   ├─► paymentMethod: 'cash' | 'card' | 'qr'
    │   │   ├─► discount (₱ or %)
    │   │   └─► notes
    │   ├─► Backend Logic:
    │   │   ├─► Verify each product exists & isActive
    │   │   ├─► Look up product ingredients
    │   │   ├─► Check ingredient stock levels
    │   │   ├─► If insufficient stock → Return error
    │   │   ├─► Calculate totals: itemCost + tax - discount
    │   │   ├─► Create Order + OrderItems in transaction
    │   │   ├─► Deduct ingredient stock
    │   │   ├─► Create InventoryTransaction logs
    │   │   ├─► Respond with orderId, orderNumber (UNIQUE)
    │   │   └─► ⚠️ GAP: No order confirmation email sent
    │   │
    │   ├─► Order Status Workflow:
    │   │   ├─► pending (awaiting kitchen)
    │   │   ├─► preparing (in progress)
    │   │   ├─► ready (awaiting pickup/delivery)
    │   │   ├─► completed (delivered or picked up)
    │   │   └─► cancelled
    │   │
    │   ├─► Payment Processing:
    │   │   ├─► Cash: Record amountPaid, auto-complete if >= total
    │   │   ├─► Card: Process via Stripe/PayMaya (⚠️ Not implemented)
    │   │   ├─► QR: Generate QR payment link (⚠️ GCash/PayMaya integration needed)
    │   │   └─► Update paymentStatus: 'pending' → 'completed'
    │
    ├─► POS Session Active: 12 hours
    │   • Cookie: next-auth.session-token (HTTP-only, SameSite=lax)
    │   • JWT payload: { employeeId, tenantId, role, name, email }
    │
    ├─► Throughout Shift
    │   ├─► Process multiple orders
    │   ├─► View order history (today's orders)
    │   ├─► Reprint receipts (from OrderItems)
    │   └─► Monitor stock alerts (low stock notifications)
    │
    ├─► LOGOUT
    │   ├─► Click logout button
    │   ├─► Session cleared
    │   ├─► POST /api/auth/signout
    │   └─► Redirected to /pos/{subdomain} (login screen)
    │
    └─► END (Session expired after 12 hours or manual logout)
```

---

### Branch 3: SUPER ADMIN LIFECYCLE

```
START (Super Admin, Seeded in Database)
    │
    ├─► bizcore.test/auth/signin
    │
    ├─► STEP 1: Admin Login
    │   ├─► Input: Email + Password
    │   ├─► POST /api/auth/callback/credentials
    │   ├─► Rate limit: 5 attempts/15 min per email
    │   ├─► Verify credentials against User table (role='admin')
    │   ├─► Hash comparison via bcryptjs
    │   ├─► NextAuth session created
    │   ├─► JWT token (30-day expiry, should be 24h)
    │   └─► Redirect to /admin
    │
    ├─► Admin Dashboard: /admin
    │
    ├─► Admin Panel Features:
    │   ├─► Tenants Management
    │   │   ├─► List all tenants
    │   │   ├─► View tenant details (subdomain, owner, subscription)
    │   │   ├─► Suspend/deactivate tenant
    │   │   ├─► View tenant's orders/revenue
    │   │   └─► Audit logs
    │   │
    │   ├─► Users Management
    │   │   ├─► List all users
    │   │   ├─► Edit user roles (admin, user, customer)
    │   │   ├─► Reset user passwords
    │   │   ├─► Lock/unlock accounts
    │   │   └─► View user activity logs
    │   │
    │   ├─► System Monitoring
    │   │   ├─► Real-time orders dashboard
    │   │   ├─► Revenue analytics
    │   │   ├─► Popular products/categories
    │   │   ├─► API endpoint logs
    │   │   └─► Rate limit metrics
    │   │
    │   ├─► Configuration
    │   │   ├─► Email templates
    │   │   ├─► OTP settings (expiry, digit count, rate limits)
    │   │   ├─► Password policies (min length, complexity)
    │   │   ├─► Session timeout settings
    │   │   ├─► Payment gateway credentials
    │   │   └─► Subscription plans & pricing
    │   │
    │   ├─► Content Management
    │   │   ├─► Global categories
    │   │   ├─► Default page templates
    │   │   ├─► Email notification templates
    │   │   └─► Help documentation
    │   │
    │   └─► Logs & Audit
    │       ├─► Activity logs (all users, all tenants)
    │       ├─► Error logs (stack traces, timestamps)
    │       ├─► API call logs (endpoint, method, response time)
    │       ├─► Security events (failed logins, rate limit triggers)
    │       └─► Data export (CSV, JSON)
    │
    ├─► Admin Session Active: 30 days (should be 24h)
    │   • Cookie: next-auth.session-token (HTTP-only, SameSite=lax)
    │   • JWT payload: { id, email, role:'admin', tenantId:null, name, token }
    │
    ├─► Monitoring While Logged In
    │   ├─► Real-time dashboards update
    │   ├─► System health checks
    │   ├─► Database query monitoring
    │   ├─► Payment reconciliation
    │   └─► Support ticket queue
    │
    ├─► LOGOUT
    │   ├─► Click logout button
    │   ├─► NextAuth session cleared
    │   ├─► POST /api/auth/signout
    │   └─► Redirected to /auth/signin
    │
    └─► END (Session closed)
```

---

### Branch 4: CUSTOMER (STOREFRONT) LIFECYCLE

```
START (Customer, No Account)
    │
    ├─► Visit: bizcore.test/storefront/{subdomain}
    │
    ├─► STEP 1: Browse Storefront
    │   ├─► GET /api/storefront/{subdomain} (public, no auth required)
    │   ├─► Fetch page designs (header, hero, menu sections, etc.)
    │   ├─► Fetch products by category
    │   ├─► Fetch tenant branding (colors, logo, name)
    │   ├─► Render via React components (Hero, ProductCard, Footer, etc.)
    │   └─► Customer browses products, reads descriptions
    │
    ├─► STEP 2: Create Account OR Login
    │   │
    │   ├─── CREATE ACCOUNT ────────────────────────────┐
    │   │                                                 │
    │   ├─► Visit: /storefront/{subdomain}/signup        │
    │   │                                                 │
    │   ├─► POST /api/customers (CREATE)                 │
    │   │   ├─► Input: email, firstName, lastName,       │
    │   │   │          password (≥6 chars)               │
    │   │   ├─► Rate limit: 5 signups/24h per IP         │
    │   │   ├─► Bcrypt password hashing (cost 10-12)     │
    │   │   ├─► Create Customer record                   │
    │   │   ├─► Set emailVerified=false, loginAttempts=0 │
    │   │   ├─► ⚠️ GAP: No welcome email sent            │
    │   │   └─► Respond: customerId, token               │
    │   │                                                 │
    │   ├─► NextAuth session created                     │
    │   ├─► JWT cookie: next-auth.session-token.customer │
    │   ├─► Token payload: { customerId, tenantId,       │
    │   │                    email, firstName, role }    │
    │   └─── (Proceed to Step 3)                         │
    │       │
    │       └─ OR LOGIN (existing customer) ─────────────┐
    │                                                      │
    │   ├─► Visit: /storefront/{subdomain}/login          │
    │   ├─► Input: email, password                        │
    │   ├─► POST /api/auth/callback/credentials           │
    │   ├─► Rate limit: 5 attempts/15 min per email       │
    │   ├─► Verify Customer credentials                  │
    │   ├─► Check loginAttempts < 5 (lockout mechanism)  │
    │   ├─► Compare password via bcryptjs.compare()      │
    │   ├─► NextAuth session created                     │
    │   ├─► JWT cookie: next-auth.session-token.customer │
    │   └─ (Proceed to Step 3)
    │
    ├─► STEP 3: View Cart / Checkout Page
    │   ├─► User adds products to cart (client-side state)
    │   ├─► Navigate to: /storefront/{subdomain}/checkout
    │   ├─► Cart items persist in session/localStorage
    │   └─► Display 3-phase checkout process:
    │
    │   PHASE 1: Contact Information
    │   ├─► Display: First Name, Last Name, Email, Phone
    │   ├─► Allow edit of customer address
    │   ├─► Store in Customer.address (JSON)
    │   └─► Next button
    │
    │   PHASE 2: Delivery Options
    │   ├─► Order Type Selection:
    │   │   ├─► Pickup (no delivery fee)
    │   │   └─► Delivery (flat ₱50 fee)
    │   ├─► ⚠️ GAP: Documented tiers (Standard/Express/Overnight) not implemented
    │   ├─► Select Delivery Time (if delivery)
    │   └─► Next button
    │
    │   PHASE 3: Payment
    │   ├─► Display order summary:
    │   │   ├─► Items + quantities
    │   │   ├─► Subtotal
    │   │   ├─► Tax (10%)
    │   │   ├─► Delivery fee (if applicable)
    │   │   └─► TOTAL
    │   │
    │   ├─► Payment Method Selection:
    │   │   ├─► Cash (select for pickup/delivery)
    │   │   ├─► Credit/Debit Card (Stripe) ⚠️ Not implemented
    │   │   ├─► QR Payment (PayMaya/GCash) ⚠️ Not implemented
    │   │   └─► E-wallet (⚠️ Not implemented)
    │   │
    │   ├─► ⚠️ GAP: Frontend accepts payment method but backend
    │   │        doesn't call payment gateway; record is created
    │   │        with paymentStatus='pending' indefinitely
    │   │
    │   └─► "Place Order" button
    │
    ├─► STEP 4: Order Creation
    │   ├─► POST /api/orders
    │   ├─► Request Payload:
    │   │   ├─► tenantId (from session)
    │   │   ├─► customerId (from session)
    │   │   ├─► items: [{ productId, quantity }, ...]
    │   │   ├─► orderType: 'pickup' | 'delivery'
    │   │   ├─► deliveryFee: 0 or 50 (₱)
    │   │   ├─► paymentMethod: 'cash' | 'card' | 'qr'
    │   │   ├─► shippingAddress: { street, city, zip } ⚠️ Not in schema
    │   │   └─► notes: special requests
    │   │
    │   ├─► Backend Processing:
    │   │   ├─► Verify each product exists (tenantId match)
    │   │   ├─► Check ingredient stock levels
    │   │   ├─► If insufficient → Return error (out of stock)
    │   │   ├─► Calculate totals:
    │   │   │   ├─► itemSubtotal = Σ(price × quantity)
    │   │   │   ├─► tax = itemSubtotal × 0.10
    │   │   │   ├─► delivery = 0 or 50 (₱)
    │   │   │   └─► total = itemSubtotal + tax + delivery
    │   │   ├─► Create Order record (transactional):
    │   │   │   ├─► orderNumber: UNIQUE identifier
    │   │   │   ├─► status: 'pending'
    │   │   │   ├─► paymentStatus: 'pending'
    │   │   │   ├─► amountPaid: 0
    │   │   │   ├─► ⚠️ GAP: No trackingNumber, estimatedDelivery
    │   │   │   └─► createdAt timestamp
    │   │   ├─► Create OrderItems (itemized breakdown)
    │   │   ├─► Deduct ingredient stock via InventoryTransaction
    │   │   ├─► ⚠️ GAP: No order confirmation email
    │   │   └─► Respond with Order details
    │   │
    │   ├─► Client: Display order confirmation page
    │   │   ├─► Order Number (print-friendly receipt)
    │   │   ├─► Estimated time (if pickup) / Delivery window (if delivery)
    │   │   ├─► Items & prices
    │   │   ├─► Total
    │   │   └─► "Continue Shopping" button
    │   │
    │   └─► Order is now in kitchen workflow (managed by POS employees)
    │
    ├─► STEP 5: Order Tracking (Optional)
    │   ├─► Customer can login to view past orders
    │   ├─► Navigate to: /storefront/{subdomain}/account/orders
    │   ├─► GET /api/customers/{customerId}/orders
    │   ├─► Display list of orders with:
    │   │   ├─► Order Number
    │   │   ├─► Date & time
    │   │   ├─► Status (pending → preparing → ready → completed)
    │   │   ├─► ⚠️ GAP: No trackingNumber or delivery tracking
    │   │   ├─► Total price
    │   │   └─► Items
    │   ├─► Click order to view details
    │   └─► ⚠️ No SMS/Email notifications on status change
    │
    ├─► Customer Session Active: 30 days (NextAuth default)
    │   • Cookie: next-auth.session-token.customer (HTTP-only, SameSite=lax)
    │   • JWT payload: { customerId, tenantId, email, firstName, role:'customer' }
    │
    ├─► While Logged In
    │   ├─► Can view order history
    │   ├─► Can update account info (address, phone)
    │   ├─► Can save favorite products (if implemented)
    │   └─► Can browse different tenant storefronts (each subdomain)
    │
    ├─► LOGOUT
    │   ├─► Click logout button
    │   ├─► NextAuth session cleared
    │   ├─► POST /api/auth/signout
    │   ├─► Customer cookie deleted
    │   └─► Redirected to /storefront/{subdomain}
    │
    └─► END (Session closed, can browse anonymously or login again)
```

---

### Convergence Points & Shared Systems

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SHARED SYSTEMS LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  All 4 branches use these common services:                          │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Authentication & Session Management                         │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ • NextAuth v4 with JWT strategy                             │   │
│  │ • Credentials provider (email + password verification)      │   │
│  │ • Two separate session cookies:                             │   │
│  │   - next-auth.session-token (admin/tenant/employee)        │   │
│  │   - next-auth.session-token.customer (customer)            │   │
│  │ • HTTP-only, SameSite=lax cookies                           │   │
│  │ • JWT default expiry: 30 days (⚠️ should be 24h)            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Rate Limiting (lib/rate-limit.ts)                           │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ • In-memory Map-based rate limiter                          │   │
│  │ • Rate Limit Presets:                                       │   │
│  │   - Login/Signup: 5 attempts / 15 minutes                  │   │
│  │   - OTP Request: 3 requests / 1 hour                       │   │
│  │   - OTP Verify: 5 attempts / 15 minutes                    │   │
│  │   - Onboarding Apply: 1 attempt / 5 minutes               │   │
│  │   - Password Reset: 10 attempts / 15 minutes              │   │
│  │ • ⚠️ POS employee login: NOT rate limited (gap)             │   │
│  │ • Returns: { success, remaining, resetTime }               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Multi-Tenancy & Data Isolation                              │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ • All business data includes tenantId foreign key           │   │
│  │ • Middleware filters queries: WHERE tenantId = current      │   │
│  │ • Tables affected: Product, Ingredient, Inventory, Order,   │   │
│  │                   OrderItem, Employee, Customer, Page, etc. │   │
│  │ • Prevents cross-tenant data leaks                          │   │
│  │ • Tenant lookup via subdomain:                              │   │
│  │   - Request subdomain parsed from URL                       │   │
│  │   - Query Tenant table: UNIQUE(subdomain)                   │   │
│  │   - Attach tenantId to session context                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Email Service (Nodemailer, ⚠️ Not fully implemented)         │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ • Templates (in lib/emails/):                               │   │
│  │   - OTP Verification (6-digit, 10-min expiry)              │   │
│  │   - Welcome Email (tenant onboarding) ✓ Implemented        │   │
│  │   - Order Confirmation ⚠️ Not sent                          │   │
│  │   - Shipping Notification ⚠️ Not sent                       │   │
│  │   - Password Reset ⚠️ Not fully tested                      │   │
│  │ • SMTP credentials in env: SMTP_HOST, SMTP_PORT,            │   │
│  │                            SMTP_USER, SMTP_PASS             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Database (PostgreSQL + Prisma ORM)                          │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ • Connection pooling via PgBouncer (pgadmin visible)        │   │
│  │ • Transaction support (Prisma.$transaction) for consistency │   │
│  │ • Type-safe queries via generated Prisma client            │   │
│  │ • Migrations via `npm run db:migrate`                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Middleware & Request Validation                             │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ • lib/middleware.ts:                                        │   │
│  │   - Parses subdomain from request                          │   │
│  │   - Validates session existence                            │   │
│  │   - Attaches tenantId to request context                   │   │
│  │   - CORS headers for cross-origin requests                 │   │
│  │   - CSRF token validation                                  │   │
│  │ • Route protection:                                         │   │
│  │   - /dashboard/* → Requires authenticated session          │   │
│  │   - /pos/* → Requires employee session                     │   │
│  │   - /admin/* → Requires admin role                         │   │
│  │   - /storefront/* → Public (no auth required)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Overall Architecture

BizCore is a **multi-tenant SaaS platform** serving four distinct user types through a single, unified authentication and data architecture. All users flow through the same core systems:

1. **Entry Point**: bizcore.test (single home page with role-based routing)
2. **Authentication**: NextAuth with two parallel session systems
3. **Databases**: PostgreSQL with tenantId-based multi-tenancy
4. **Dashboards**: Role-specific interfaces (admin, tenant, POS, customer)
5. **Logout**: Unified session termination across all roles

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Next.js App Router (Port 3000)                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  /auth/*     │  │  /admin/*    │  │ /dashboard/* │  │/storefront/* │ │
│  │              │  │              │  │              │  │              │ │
│  │ NextAuth     │  │ Super Admin  │  │ Tenant Owner │  │ Customer     │ │
│  │ Sign In      │  │ Dashboard    │  │ Dashboard    │  │ Storefront   │ │
│  │ Forgot/Reset │  │ Tenants CRUD │  │ Orders, Inv  │  │ Login/Signup │ │
│  │ Onboarding   │  │ Users CRUD   │  │ Products     │  │ Cart/Check   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                   │                  │                 │       │
│         └───────────────────┴──────────────────┴─────────────────┘       │
│                             ↓                                            │
│                    ┌─────────────────────┐                               │
│                    │  NextAuth JWT       │                               │
│                    │  Sessions & Routes  │                               │
│                    │  (Middleware)       │                               │
│                    └─────────────────────┘                               │
└──────────────────────────────────────────────────────────────────────────┘
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ↓                             ↓                             ↓
    ┌─────────┐              ┌──────────────┐           ┌──────────────────┐
    │PostgreSQL           │ Nginx Proxy  │           │ Vite App       │
    │Database             │ (bizcore.test)│           │ BrandStudio    │
    │                     │ • Port 80/443 │           │ (Port 5174)    │
    │ • Users             │ • Route /api  │           │                │
    │ • Tenants           │ • Route /     │           │ Served via     │
    │ • Customers         │   (Next.js)   │           │ /studio on     │
    │ • Employees         │ • Route /studio           │ reverse proxy  │
    │ • Orders            │   (Vite app)  │           └──────────────────┘
    │ • Products          │               │
    │ • Ingredients       └──────────────┘
    │ • Pages
    │ • Designs
    └─────────┘
```

### Technology Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| Frontend | Next.js 15 (App Router) + React | CSR/SSR hybrid, Tailwind CSS, Framer Motion |
| Auth | NextAuth v4 + JWT | Credentials providers, HTTP-only cookies |
| API | Next.js Route Handlers | RESTful endpoints in `/app/api/*` |
| Database | PostgreSQL + Prisma ORM | Multi-tenant schema with `tenantId` foreign key |
| Design Tool | Vite + React | Embedded as `/studio` iframe |
| Reverse Proxy | Nginx | Routes `/`, `/api`, `/studio` to different backends |
| Deployment | Docker Compose | PostgreSQL, Nginx, Node containers |

---

## Authentication & Session Management

### Session Architecture

BizCore uses **two independent session systems**:

#### 1. **Admin/Tenant Owner/Tenant User Sessions** (`authOptions`)
- **Provider**: NextAuth Credentials (email + password)
- **Cookie Name**: `next-auth.session-token`
- **Token Strategy**: JWT
- **Expiry**: 30 days (default NextAuth; should be 24h per spec)
- **File**: `lib/auth.ts`
- **Includes**: `id`, `email`, `role`, `tenantId`, `name`, `token` (UUID)

**Flow**:
```
/auth/signin
   ↓
POST /api/auth/callback/credentials
   ↓
Validate email + password vs User table (bcrypt)
   ↓
Create JWT with user.role and tenant lookup
   ↓
Set HTTP-only cookie
   ↓
Middleware checks role → route accordingly
   ├─ admin → /admin
   ├─ tenant_owner/tenant_user → /dashboard/{subdomain}
   └─ user → /auth/signin (not permitted)
```

#### 2. **Customer Sessions** (`customerAuthOptions`)
- **Provider**: NextAuth Credentials (email + password + subdomain)
- **Cookie Name**: `next-auth.session-token.customer`
- **Token Strategy**: JWT
- **Expiry**: 30 days (default)
- **File**: `lib/customerAuth.ts`
- **Includes**: `id`, `email`, `role`, `tenantId`, `subdomain`

**Flow**:
```
/storefront/{subdomain}/signin
   ↓
POST /api/auth/callback/customer-credentials
   ↓
Look up tenant by subdomain
   ↓
Find customer by email + tenantId (case-insensitive)
   ↓
Validate bcrypt password
   ↓
Create JWT with customer role
   ↓
Set HTTP-only cookie (separate from admin)
   ↓
Redirect to /storefront/{subdomain}/checkout
```

### Session Cookie Details

| Attribute | Value | Notes |
|-----------|-------|-------|
| `httpOnly` | true | Prevents XSS theft |
| `sameSite` | lax | CSRF protection |
| `secure` | depends | HTTP in dev, HTTPS in prod |
| `domain` | `resolveCookieDomain()` | Works on bizcore.test, localhost:3000, etc. |
| `path` | `/` | Accessible app-wide |

---

## Detailed User Flows

The complete end-to-end lifecycles for all four user types are documented in the **[Unified User Flow (All Paths)](#unified-user-flow-all-paths)** section above, which shows:

- **Branch 1**: Tenant Owner path (signup → onboarding → tenant creation → dashboard → BrandStudio → logout)
- **Branch 2**: Employee (POS) path (created by tenant → POS login → order processing → logout)
- **Branch 3**: Super Admin path (login → admin panel → system management → logout)
- **Branch 4**: Customer path (browse → signup/login → checkout → order tracking → logout)

Each branch follows the same authentication → authorization → action → logout pattern, using the shared systems documented in [Convergence Points & Shared Systems](#convergence-points--shared-systems) above.

### Implementation File Reference by Branch

#### Branch 1: Tenant Owner (Onboarding & Dashboard)


**Implementation Files**:
- `app/auth/onboarding/page.tsx` – Multi-step form (email, OTP, tenant details)
- `app/api/onboarding/request-otp/route.ts` – OTP generation & email (6-digit, 10-min)
- `app/api/onboarding/verify-otp/route.ts` – OTP verification (5/15-min rate limit)
- `app/api/onboarding/apply/route.ts` – Tenant creation transaction (creates User, Tenant, TenantUser, default Category, Products)
- `app/dashboard/[subdomain]/page.tsx` – Tenant dashboard with orders, products, employees
- `app/dashboard/[subdomain]/layout.tsx` – Brand Studio trigger modal
- `lib/auth.ts` – NextAuth JWT config
- `lib/rate-limit.ts` – Rate limit presets

---

#### Branch 2: Employee (POS System)

**Implementation Files**:
- `app/api/pos/auth/login/route.ts` – Employee login (email + password OR PIN, 12h JWT)  ⚠️ No rate limiting implemented
- `app/pos/[subdomain]/dashboard/page.tsx` – POS dashboard (search, filter, cart, order creation)
- `app/api/pos/orders/route.ts` – Order creation with stock verification & inventory deduction
- `app/api/employees/route.ts` – Employee CRUD (password + PIN hashing via bcryptjs)
- `prisma/schema.prisma` – Employee model with password and PIN fields

---

#### Branch 3: Super Admin

**Implementation Files**:
- `app/api/auth/callback/credentials/route.ts` – Credential verification for admin role (5/15-min rate limit)
- `app/admin/page.tsx` – Admin dashboard with KPI cards, system alerts, activity logs
- `app/admin/tenants/*` – Tenant CRUD pages (list, create, edit, pause)
- `app/admin/users/*` – User management (list, reset password, lock accounts)
- `lib/auth.ts` – NextAuth admin session config

---

#### Branch 4: Customer (Storefront)

**Implementation Files**:
- `app/storefront/[subdomain]/page.tsx` – Storefront landing page (products by category)
- `app/storefront/[subdomain]/login/page.tsx` – Customer login
- `app/api/customers/route.ts` – Customer signup (password ≥6 chars, 10/24h rate limit) ⚠️ No welcome email
- `app/storefront/[subdomain]/checkout/page.tsx` – 3-phase checkout (Contact → Delivery → Payment)
- `app/api/orders/route.ts` – Order creation with stock verification ⚠️ No order confirmation email
- `lib/customerAuth.ts` – NextAuth customer session config
- `prisma/schema.prisma` – Customer and Order models ⚠️ Order lacks shippingAddress, trackingNumber, estimatedDelivery

---

#### Branch 5: Brand Studio Integration

**Implementation Files**:
- `app/dashboard/[subdomain]/brandstudio/page.tsx` – Iframe container with postMessage handshake
- `brandstudio-vite/src/App.tsx` – BrandStudio SPA entry & session verification
- `brandstudio-vite/src/components/Editor/Canvas.tsx` – Konva canvas for drag/drop/zoom
- `brandstudio-vite/src/services/api.ts` – Axios client with parent origin detection & credential sharing
- `brandstudio-vite/src/store/useDesignStore.ts` – Component state management
- `brandstudio-vite/src/utils/sectionToComponents.ts` – Template to component tree conversion
- `lib/getAppUrl.ts` – Determines iframe URL with tenant context
- `lib/defaultPages.ts` – Default page templates created on tenant onboarding

---

## API Landscape
   │  ├─ Orders
   │  ├─ Inventory
   │  ├─ Products
   │  ├─ Categories
   │  ├─ Customers
   │  ├─ Employees
   │  ├─ Analytics
   │  ├─ Brand Studio ← Opens confirmation → new tab
   │  └─ Settings
   │
   └─ Brand Studio Integration:
      │
      ├─ User clicks "Brand Studio"
      ├─ Modal: "BrandStudio will open in new tab for best experience"
      ├─ Click "Open Editor"
      │
      └─ Handler (openBrandStudio):
         │
         ├─ Get tenant from localStorage
         ├─ Build URL: getBrandStudioIframeUrl({ subdomain, tenantId })
         │  └─ Resolves to: http://bizcore.test/studio?tenantId=123&subdomain=coffee-shop
         ├─ window.open(url, '_blank')
         │
         └─ [In new tab - /studio]:
            │
            ├─ BrandStudio App mounts (brandstudio-vite/src/App.tsx)
            ├─ Tries to verify session via GET /api/auth/session
            │  ├─ If 200 OK: use session user info (tenantId, email)
            │  └─ If 401: wait for postMessage from parent
            ├─ Parent page.tsx fetches /api/tenants/by-subdomain/{subdomain}
            ├─ Parent postMessages: { type: 'TENANT_DATA', tenant: {...} }
            ├─ BrandStudio receives message, updates state
            └─ Axios client resolves to parent origin (/api) for API calls
   ↓
[/dashboard/{subdomain}/page.tsx]:
   │
   ├─ Fetch /api/admin/stats?subdomain={subdomain} → KPIs
   │  ├─ Orders, revenue, customers, products
   │  └─ Charts: trends, top products
   │
   └─ Display:
      ├─ Sales overview (Today's revenue, Orders count)
      ├─ Inventory coverage (avg %, understock items)
      ├─ Recent orders (list)
      ├─ Recent products (list)
      └─ Low stock alerts

Available Actions:
   │
   ├─ Products → ProductsManager
   │  ├─ List, search, filter by category
   │  ├─ Create: name, SKU, price, cost, description, image, category, stock, threshold
   │  ├─ Edit product details
   │  ├─ Delete product
   │  └─ Track ingredients used
   │
   ├─ Orders → OrdersManager
   │  ├─ List, filter by status
   │  ├─ View order details (items, customer, total, payment status)
   │  ├─ Update order status (pending → processing → shipped → completed)
   │  └─ Print receipt/invoice
   │
   ├─ Inventory → InventoryManager
   │  ├─ List ingredients, stock levels
   │  ├─ Set minimum stock thresholds
   │  ├─ Log stock adjustments
   │  └─ Track usage by products
   │
   ├─ Customers → CustomerList
   │  ├─ View all customers
   │  ├─ View order history per customer
   │  └─ Search/filter
   │
   ├─ Employees → EmployeeManager
   │  ├─ List all employees
   │  ├─ Create: first name, last name, email, password, PIN, role
   │  ├─ Edit: update details, password, PIN
   │  ├─ Delete: deactivate employee
   │  └─ View last login
   │
   ├─ Analytics → Charts, trends, exports
   │
   └─ Settings → Store name, contact, payment methods, tax, shipping

Logout:
   ├─ POST /api/auth/clear-session
   ├─ signOut({ callbackUrl: '/auth/signin?logout=true', redirect: true })
   ├─ Clear localStorage (token, user, tenant)
   └─ Redirect to signin
```

**Key Implementation Files**:
- `app/dashboard/[subdomain]/layout.tsx` – Main layout, BrandStudio modal
- `app/dashboard/[subdomain]/page.tsx` – Overview
- `components/dashboard/ProductsManager.tsx` – Products CRUD
- `components/dashboard/EmployeeManager.tsx` – Employees CRUD
- `lib/getAppUrl.ts` – URL resolution for BrandStudio

---

## API Landscape

**Prerequisites**: Tenant owner creates employee in dashboard → sends credentials

```
Employee receives credentials (email, password or PIN)
   ↓
Employee visits /pos/{subdomain}/login
   ↓
[/pos/{subdomain}/login/page.tsx]:
   ├─ Enter email
   ├─ Choose: PIN login (4–6 digits) OR password login
   └─ Click "Login to POS"
   ↓
POST /api/pos/auth/login
   │
   ├─ Find tenant by subdomain
   ├─ Find employee by email + tenantId (case-insensitive)
   ├─ Validate password (bcrypt) OR PIN (bcrypt) against employee record
   ├─ Rate limiting: [NOT CURRENTLY IMPLEMENTED] should be 5/15 min
   ├─ Update employee.lastLogin = now()
   ├─ Generate JWT:
   │  ├─ employeeId, tenantId, role, email
   │  ├─ Signed with NEXTAUTH_SECRET
   │  ├─ Expires: 12 hours
   │  └─ Stored in localStorage as 'pos_token'
   └─ Return: token, employee info, tenant info
   ↓
Redirect to /pos/{subdomain}
   ↓
[/pos/{subdomain}/page.tsx - POS Dashboard]:
   │
   ├─ Fetch /api/pos/products (with Bearer token)
   ├─ Display:
   │  ├─ Header: Tenant name, employee name, role
   │  ├─ Logout button (top right)
   │  ├─ Search products
   │  ├─ Filter by category
   │  └─ Product grid (name, price, stock status)
   │
   └─ Workflow:
      │
      ├─ Search or tap product
      ├─ Add to cart (check stock availability)
      ├─ Adjust quantity
      ├─ Select payment method: cash / card / digital
      ├─ Click "Checkout"
      │
      └─ POST /api/pos/orders (with Bearer token)
         │
         ├─ Validate items (all exist, have tenantId match)
         ├─ Recalculate subtotal server-side
         ├─ Apply 10% tax
         ├─ Verify ingredient stock (from productIngredients)
         ├─ Create Order (status = 'pending')
         ├─ Create OrderItems
         ├─ Deduct ingredient stock via InventoryTransaction
         ├─ Generate receipt (orderNumber)
         └─ Return: orderId, orderNumber
      │
      ↓
   ├─ Show success: "Order {orderNumber} completed"
   ├─ Clear cart from localStorage
   └─ Ready for next order

Logout:
   ├─ Click logout button (PowerIcon)
   ├─ Delete pos_token, pos_employee, pos_tenant from localStorage
   └─ Redirect to /pos/{subdomain}/login
```

**Key Implementation Files**:
- `app/pos/[subdomain]/login/page.tsx` – Login form
- `app/api/pos/auth/login/route.ts` – Auth endpoint
- `app/pos/[subdomain]/page.tsx` – POS dashboard
- `app/api/pos/orders/route.ts` – Order creation
- `app/api/employees/route.ts` – Employee CRUD (by tenant owner)

**⚠️ Known Gaps**:
- No rate limiting on POS login (should be 5/15 min per email)
- No discount/refund UI
- No transaction history or reports
- No quick inventory adjustment UI

---

## API Landscape

### Authentication APIs

#### Phase 1: Browse & Cart

```
Customer visits storefront URL
   ↓
[/storefront/{subdomain}/page.tsx]:
   │
   ├─ Fetch tenant by subdomain
   ├─ Fetch home page design from PageDesign table
   ├─ Render custom components (hero, products, CTA, footer)
   └─ Show "Sign In / Sign Up" links
   ↓
Customer browses:
   ├─ Click product → view details (name, price, description, image, rating)
   ├─ Select variant (size, color, etc.) if available
   ├─ Enter quantity
   └─ Click "Add to Cart"
   ↓
Cart state persists in:
   ├─ React state (useCart hook)
   ├─ localStorage as `cart__{subdomain}`
   └─ Shows in cart icon (item count)
   ↓
Customer proceeds to checkout OR continues shopping
```

#### Phase 2: Checkout - Authentication

```
Click "Proceed to Checkout"
   ↓
[/storefront/{subdomain}/checkout/page.tsx]:
   ├─ CheckoutForm component
   └─ Check customer session (useCustomerSession hook)
   ↓
Is customer logged in?
   │
   ├─ YES → Pre-fill email, name, saved addresses
   │         Proceed to "Shipping Address" phase
   │
   └─ NO → Show login/signup options
      │
      ├─ Option A: Login (existing customer)
      │  │
      │  ├─ Navigate to /storefront/{subdomain}/signin
      │  ├─ Enter email + password
      │  ├─ POST /api/auth/callback/customer-credentials
      │  │  ├─ Find tenant by subdomain (from session or URL)
      │  │  ├─ Find customer by email + tenantId
      │  │  ├─ Validate bcrypt password
      │  │  ├─ Rate limit: 5 attempts/15 min per email
      │  │  ├─ Update customer.lastLogin = now()
      │  │  ├─ Create customer JWT (role='customer')
      │  │  └─ Set next-auth.session-token.customer cookie
      │  │
      │  └─ Redirect back to /storefront/{subdomain}/checkout
      │
      ├─ Option B: Sign up (new customer)
      │  │
      │  ├─ Navigate to /storefront/{subdomain}/signup
      │  ├─ Enter: first name, last name, email, password, confirm
      │  ├─ POST /api/customers (subdomain in body)
      │  │  ├─ Validate inputs (password >= 6 chars)
      │  │  ├─ Check email not already registered for this tenant
      │  │  ├─ Hash password (bcryptjs)
      │  │  ├─ Create Customer record
      │  │  │  ├─ tenantId = tenant.id
      │  │  │  ├─ firstName, lastName, email
      │  │  │  ├─ password = hashed
      │  │  │  └─ isActive = true, emailVerified = false
      │  │  ├─ Rate limit: 10 signup attempts/24 hours per email
      │  │  ├─ [NO EMAIL SENT - gap in implementation]
      │  │  └─ Return: customer record
      │  │
      │  ├─ Manually trigger customer login (POST nextauth signin)
      │  └─ Redirect to checkout
      │
      └─ Option C: Checkout as guest
         └─ No account created; customer info entered during checkout
```

#### Phase 3: Checkout - Shipping & Payment

```
[CheckoutForm]:
   │
   ├─ Contact Information:
   │  ├─ Name (required)
   │  ├─ Email (required)
   │  └─ Phone (optional)
   │
   ├─ Delivery Method:
   │  ├─ Pickup (free)
   │  └─ Delivery (₱50 flat fee)
   │
   ├─ Shipping Address (if delivery):
   │  ├─ Street address (required)
   │  ├─ City, state, postal code (required)
   │  ├─ Country (default: PH)
   │  └─ Save for future? (checkbox)
   │
   ├─ Payment Method:
   │  ├─ Cash
   │  ├─ Card
   │  ├─ GCash / Maya (digital wallets)
   │  └─ [Backend doesn't call Stripe/PayPal - gap]
   │
   └─ Order Summary (sticky):
      ├─ Items × qty
      ├─ Subtotal
      ├─ Tax (12% VAT)
      ├─ Delivery fee
      └─ Total
   ↓
Validate form:
   ├─ Name, email required
   ├─ Address required if delivery selected
   ├─ Cart not empty
   └─ Payment method selected
   ↓
POST /api/orders?subdomain={subdomain}
   │
   ├─ Resolve tenant by subdomain
   ├─ Recalculate totals server-side:
   │  ├─ Subtotal = Σ(product.price × qty)
   │  ├─ Tax = subtotal × 0.12
   │  ├─ DeliveryFee = body.deliveryFee || 0
   │  └─ Total = subtotal + tax - discount + deliveryFee
   │
   ├─ Verify all products exist & belong to tenant
   │
   ├─ Check ingredient stock:
   │  ├─ For each product, sum ingredient usage
   │  ├─ Fetch ingredient stock levels
   │  ├─ Fail if insufficient (return 409)
   │  └─ [No payment gateway integration - gap]
   │
   ├─ START TRANSACTION:
   │  │
   │  ├─ Lookup or create Customer:
   │  │  ├─ If customer.id in session: use existing
   │  │  └─ Else: upsert by email (create if new)
   │  │
   │  ├─ Create Order:
   │  │  ├─ orderNumber = ORD-{timestamp}
   │  │  ├─ tenantId, customerId
   │  │  ├─ status = 'pending'
   │  │  ├─ orderType = deliveryType ('pickup' or 'delivery')
   │  │  ├─ total, tax, discount, paymentMethod
   │  │  ├─ paymentStatus = 'unpaid'
   │  │  └─ [shippingAddress not stored - gap]
   │  │
   │  ├─ Create OrderItems (one per line):
   │  │  ├─ orderId, productId, quantity, price
   │  │  └─ [variant support exists in schema but not used]
   │  │
   │  ├─ Deduct ingredient stock:
   │  │  ├─ For each ingredient used, update Ingredient.currentStock
   │  │  └─ Create InventoryTransaction logs
   │  │
   │  └─ END TRANSACTION
   │
   ├─ Log activity: ORDER_CREATED
   │  └─ tenantId, orderId, total, itemCount, paymentMethod
   │
   ├─ [NO CONFIRMATION EMAIL SENT - gap]
   │
   └─ Return: { orderId, orderNumber }
   ↓
Show success page
   ├─ Order # displayed
   ├─ Items ordered
   ├─ Total amount
   ├─ Delivery address (if applicable)
   ├─ Estimated delivery date [not implemented]
   └─ "Continue Shopping" link
   ↓
Clear cart:
   ├─ clearCart() via useCart hook
   ├─ Remove from localStorage
   └─ Hide cart modal
   ↓
Auto-redirect or manual redirect to /storefront/{subdomain}/orders
```

#### Phase 4: Customer Account

```
Customer clicks "My Account"
   ↓
[/storefront/{subdomain}/account/page.tsx]:
   │
   ├─ Check customer session
   ├─ If not logged in: show login form → LoginForm component
   ├─ If logged in: show account dashboard
   │
   └─ Account Tabs:
      │
      ├─ Profile:
      │  ├─ First name, last name
      │  ├─ Email
      │  ├─ Phone
      │  ├─ Change password
      │  └─ Save changes → PUT /api/customers
      │
      ├─ Orders:
      │  │
      │  ├─ GET /api/customers/orders (customer session required)
      │  ├─ List all orders for this customer:
      │  │  ├─ Order #
      │  │  ├─ Date
      │  │  ├─ Total amount
      │  │  ├─ Status (pending, processing, shipped, completed)
      │  │  ├─ Payment status (unpaid, paid, refunded)
      │  │  └─ "View Details" link → /storefront/{subdomain}/orders/{id}
      │  │
      │  └─ [Order detail view shows items, address, tracking - if implemented]
      │
      └─ Addresses:
         ├─ List saved addresses (from customer.address JSON)
         ├─ Add new address
         ├─ Edit address
         └─ Delete address
```

**Key Implementation Files**:
- `app/storefront/[subdomain]/page.tsx` – Home
- `app/storefront/[subdomain]/checkout/page.tsx` – Checkout page
- `components/storefront/CheckoutForm.tsx` – Checkout form
- `app/api/orders/route.ts` – Order creation (POST)
- `app/storefront/[subdomain]/account/page.tsx` – Account page
- `lib/customerAuth.ts` – Customer NextAuth config
- `app/api/customers/route.ts` – Customer signup/profile
- `app/api/customers/orders/route.ts` – Customer orders list

**⚠️ Known Gaps**:
- No order confirmation email
- No email sent on signup
- No shipping address storage in Order model
- No tracking number or delivery estimate fields
- No payment gateway integration (Stripe/PayPal)
- No coupon/discount code support

---

### Flow 5: BrandStudio (Storefront Design Tool)

**Entry**: Dashboard "Brand Studio" link → new tab

```
Tenant owner clicks "Brand Studio" in dashboard sidebar
   ↓
Modal: "BrandStudio will open in new tab..."
   ├─ Click "Open Editor"
   ↓
Build URL: /studio?tenantId={id}&subdomain={subdomain}
   ├─ Via getBrandStudioIframeUrl({ subdomain, tenantId })
   └─ window.open(url, '_blank')
   ↓
[brandstudio-vite/src/App.tsx]:
   │
   ├─ Check for admin mode: ?admin=true (dev-only)
   │  └─ If admin: setIsAuthenticated=true, skip session check
   │
   ├─ Try to verify session:
   │  ├─ GET /api/auth/session (with credentials: 'include')
   │  ├─ If 200 OK: extract session.user (tenantId, email)
   │  └─ If 401: wait for postMessage
   │
   ├─ Listen for postMessage from parent (security check on origin)
   │  ├─ Accept from: http://localhost:3000, http://bizcore.test, https://bizcore.test
   │  └─ If type === 'TENANT_DATA': setTenantData + setIsAuthenticated
   │
   ├─ Check URL params: ?tenantId=123&subdomain=coffee-shop
   │  └─ If both present: setTenantData (even if session already set)
   │
   └─ Render Editor (if authenticated)
      │
      ├─ Canvas (Konva-based):
      │  ├─ Layers panel (show all components)
      │  ├─ Properties panel (edit selected component)
      │  ├─ Snap guides for alignment
      │  └─ Zoom/pan/select/drag components
      │
      ├─ Actions:
      │  ├─ New page
      │  ├─ Edit existing page
      │  ├─ Add components (sections, text, buttons, etc.)
      │  ├─ Auto-save (useAutoSave hook)
      │  └─ Publish changes
      │
      └─ API Integration:
         │
         ├─ axios client (brandstudio-vite/src/services/api.ts)
         ├─ Resolves API base URL:
         │  ├─ If iframe: use parent origin + /api
         │  ├─ If direct access: use /api
         │  └─ withCredentials: true (send cookies)
         │
         ├─ Endpoints called:
         │  ├─ GET /api/pages (fetch page list)
         │  ├─ POST /api/pages (create new page)
         │  ├─ PUT /api/pages/{id} (update page design)
         │  ├─ GET /api/products (fetch product list for grid)
         │  ├─ GET /api/categories (fetch categories)
         │  └─ PUT /api/pages/{id}/publish (publish page)
         │
         └─ Design saved to PageDesign table
            ├─ JSON structure: { components: [...] }
            ├─ Each component: { id, type, position, size, props, children }
            └─ Auto-save every 30 sec (via useAutoSave)

Parent page.tsx (when BrandStudio opened via iframe):
   ├─ Fetch tenant by subdomain
   ├─ postMessage({ type: 'TENANT_DATA', tenant: {...} })
   │  └─ Sent 500ms after iframe loads
   └─ Receive and process page updates (optional two-way comms)
```

**Key Implementation Files**:
- `app/dashboard/[subdomain]/layout.tsx` – Brand Studio trigger
- `app/dashboard/[subdomain]/brandstudio/page.tsx` – Iframe page
- `brandstudio-vite/src/App.tsx` – BrandStudio app entry
- `brandstudio-vite/src/services/api.ts` – Axios client
- `brandstudio-vite/src/components/Editor/Canvas.tsx` – Canvas
- `lib/getAppUrl.ts` – URL resolution

---

## API Landscape

### Authentication APIs

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/auth/signin` | GET | NextAuth sign-in page | None |
| `/api/auth/callback/credentials` | POST | Credentials provider | None |
| `/api/auth/callback/customer-credentials` | POST | Customer credentials | None |
| `/api/auth/session` | GET | Get current session | Cookie |
| `/api/auth/signout` | POST | Sign out | Cookie |
| `/api/auth/clear-session` | POST | Clear session & token | Cookie |
| `/api/auth/forgot` | POST | Request password reset | None (rate-limited) |
| `/api/auth/reset` | POST | Reset password with token | None |

### Onboarding APIs

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|------------|
| `/api/onboarding/request-otp` | POST | Request OTP | None | 3/hour per email |
| `/api/onboarding/verify-otp` | POST | Verify OTP | None | 5/15 min per email |
| `/api/onboarding/apply` | POST | Create tenant | None | 1/5 min per IP |

### POS APIs

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|------------|
| `/api/pos/auth/login` | POST | Employee login | None | None (gap) |
| `/api/pos/products` | GET | List products | Bearer JWT | None |
| `/api/pos/orders` | POST | Create order | Bearer JWT | None |
| `/api/pos/sessions` | POST | Create POS session | None | None |

### Tenant APIs

| Endpoint | Method | Purpose | Auth | Notes |
|----------|--------|---------|------|-------|
| `/api/tenants` | GET | List owned tenants | Session | Tenant owner only |
| `/api/tenants` | POST | Create tenant | Session | Tenant owner only |
| `/api/tenants/{id}` | GET | Tenant details | Session | Owner or admin |
| `/api/tenants/{id}` | PUT | Update tenant | Session | Owner or admin |
| `/api/tenants/by-subdomain/{subdomain}` | GET | Fetch by subdomain | None | Public (returns basic info) |

### Product APIs

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/products` | GET | List products | Session |
| `/api/products` | POST | Create product | Session |
| `/api/products/{id}` | PUT | Update product | Session |
| `/api/products/{id}` | DELETE | Delete product | Session |

### Order APIs

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/orders` | GET | List orders (tenant) | Session |
| `/api/orders` | POST | Create order (storefront) | None (with data) |
| `/api/customers/orders` | GET | List orders (customer) | Customer Session |

### Employee APIs

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/employees` | GET | List employees | Session (tenant owner) |
| `/api/employees` | POST | Create employee | Session (tenant owner) |
| `/api/employees/{id}` | GET | Get employee | Session |
| `/api/employees/{id}` | PUT | Update employee | Session |
| `/api/employees/{id}` | DELETE | Delete employee | Session |

### Customer APIs

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/customers` | POST | Sign up customer | None (rate-limited) |
| `/api/customers` | PUT | Update profile | Customer Session |
| `/api/customers/orders` | GET | List customer orders | Customer Session |

### Page Design APIs

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/pages` | GET | List pages | Session |
| `/api/pages` | POST | Create page | Session |
| `/api/pages/{id}` | GET | Get page | Session or None (published) |
| `/api/pages/{id}` | PUT | Update page design | Session |

### Admin APIs

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/admin/stats` | GET | Dashboard stats | Admin Session |
| `/api/admin/tenants` | GET | List all tenants | Admin Session |
| `/api/admin/users` | GET | List all users | Admin Session |

---

## Database Schema Overview

### Core Tables

```sql
-- Users (admin, tenant owner, tenant user, etc.)
users
  ├─ id (PK)
  ├─ email (UNIQUE)
  ├─ password (hashed)
  ├─ firstName, lastName
  ├─ role (admin, tenant_owner, tenant_user, user)
  ├─ emailVerified, emailVerificationToken, emailVerificationOtp, emailVerificationOtpExpires
  ├─ passwordResetToken, passwordResetExpires
  └─ timestamps

-- Tenants (businesses)
tenants
  ├─ id (PK)
  ├─ name, subdomain (UNIQUE), domain
  ├─ ownerId (FK → users)
  ├─ subscriptionPlan (free, starter, pro, enterprise)
  ├─ settings (JSON: branches, tax, colors, etc.)
  ├─ primaryColor, secondaryColor
  ├─ isActive, isPremium
  └─ timestamps

-- Tenant membership
tenant_users
  ├─ id (PK)
  ├─ tenantId (FK → tenants)
  ├─ userId (FK → users)
  ├─ role (owner, admin, editor, viewer)
  └─ permissions (JSON)

-- Storefront customers
customers
  ├─ id (PK)
  ├─ tenantId (FK → tenants)
  ├─ email, firstName, lastName, phone
  ├─ password (hashed, optional)
  ├─ address (JSON)
  ├─ emailVerified, emailVerificationToken
  ├─ passwordResetToken, passwordResetExpires
  ├─ loginAttempts, lockUntil
  ├─ lastLogin
  └─ timestamps

-- Employees (POS staff)
employees
  ├─ id (PK)
  ├─ tenantId (FK → tenants)
  ├─ email, firstName, lastName
  ├─ password (hashed)
  ├─ pin (hashed, 4–6 digits)
  ├─ role (cashier, manager, admin)
  ├─ isActive
  ├─ lastLogin
  └─ timestamps

-- Products
products
  ├─ id (PK)
  ├─ tenantId (FK → tenants)
  ├─ categoryId (FK → categories)
  ├─ name, description, price, cost, image
  ├─ isActive, isFeatured, sortOrder
  └─ timestamps

-- Categories
categories
  ├─ id (PK)
  ├─ tenantId (FK → tenants)
  ├─ name, description, image
  ├─ isActive, sortOrder
  └─ timestamps

-- Ingredients (inventory items)
ingredients
  ├─ id (PK)
  ├─ tenantId (FK → tenants)
  ├─ name, unit, currentStock, minStock, costPerUnit
  ├─ isActive
  └─ timestamps

-- Product ↔ Ingredient relationship
product_ingredients
  ├─ id (PK)
  ├─ productId (FK → products)
  ├─ ingredientId (FK → ingredients)
  └─ quantity

-- Orders (from both storefront & POS)
orders
  ├─ id (PK)
  ├─ tenantId (FK → tenants)
  ├─ customerId (FK → customers, nullable)
  ├─ employeeId (FK → employees, nullable for storefront)
  ├─ orderNumber (UNIQUE)
  ├─ status (pending, processing, shipped, completed)
  ├─ orderType (pickup, delivery, dine-in)
  ├─ total, tax, discount
  ├─ paymentMethod (cash, card, gcash, maya)
  ├─ paymentStatus (unpaid, paid, refunded)
  ├─ amountPaid
  └─ timestamps

-- Order items (line items)
order_items
  ├─ id (PK)
  ├─ orderId (FK → orders)
  ├─ productId (FK → products)
  ├─ variantId (FK → product_variants, nullable)
  ├─ quantity, price
  └─ notes

-- Inventory transactions (stock audit trail)
inventory_transactions
  ├─ id (PK)
  ├─ tenantId (FK → tenants)
  ├─ ingredientId (FK → ingredients)
  ├─ type (in, out, adjustment)
  ├─ quantity, reason, cost
  ├─ performedBy (user ID or NULL)
  └─ createdAt

-- Page designs (BrandStudio)
page_designs
  ├─ id (PK)
  ├─ tenantId (FK → tenants)
  ├─ title, slug
  ├─ content (JSON: component tree)
  ├─ isHomePage, isActive
  └─ timestamps

-- Activity logs
activity_log
  ├─ id (PK)
  ├─ tenantId (FK → tenants)
  ├─ userId (FK → users)
  ├─ action (string: ORDER_CREATED, PRODUCT_UPDATED, etc.)
  ├─ details (JSON)
  ├─ ipAddress, userAgent
  └─ createdAt
```

---

## Security & Rate Limiting

### Rate Limit Policies

```
Authentication Login:           5 attempts / 15 minutes per email
Registration Signup:             5 attempts / 15 minutes per email
Onboarding Submit:               1 submission / 5 minutes per IP
Password Reset Request:         10 requests / 15 minutes per email
OTP Request:                     3 requests / hour per email
OTP Verification:                5 attempts / 15 minutes per email
Customer Signup:                10 attempts / 24 hours per email
POS Employee Login:             [NOT IMPLEMENTED - should be 5/15min]
```

### Implementation

**File**: `lib/rate-limit.ts`

```typescript
export const rateLimits = {
  otpRequest: (email) => checkRateLimit(`otp:request:${email}`, 3, 60*60*1000),
  otpVerify: (email) => checkRateLimit(`otp:verify:${email}`, 5, 15*60*1000),
  onboardingSubmit: (ip) => checkRateLimit(`onboarding:submit:${ip}`, 1, 5*60*1000),
  api: (ip) => checkRateLimit(`api:${ip}`, 100, 60*1000),
  login: (email) => checkRateLimit(`login:${email}`, 5, 15*60*1000),
  registration: (ip) => checkRateLimit(`registration:${ip}`, 5, 24*60*60*1000)
}
```

**In-memory storage**: `Map<key, { count, resetTime }>`
- Cleaned up every 5 minutes
- Suitable for single-server deployment
- **For distributed systems**: migrate to Redis

### Password Security

- **Minimum length**: 6 characters (enforced in register & onboarding)
- **Hashing**: bcryptjs with cost factor 10–12
- **Reset flow**: 32-byte hex token, 1-hour expiry

### Session Security

- **HTTP-only cookies**: XSS-resistant
- **SameSite=lax**: CSRF protection
- **Secure flag**: HTTPS in production
- **Cookie domain**: Dynamically resolved to support subdomains

### CSRF & Security Headers

**Middleware** (`middleware.ts`) applies:
- `Strict-Transport-Security` (1 year, includeSubDomains)
- `X-Frame-Options: SAMEORIGIN` (prevent clickjacking)
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (disable camera, microphone, geolocation)

### PostMessage Security

**BrandStudio** (App.tsx) validates origin against whitelist:
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost',
  'http://bizcore.test',
  'https://bizcore.test'
]
if (!allowedOrigins.includes(event.origin)) return; // reject
```

---

## Integration Points

### Nginx Reverse Proxy

```nginx
server {
  listen 80;
  server_name bizcore.test;

  # Route /api to Next.js backend
  location /api/ {
    proxy_pass http://localhost:3000/api/;
  }

  # Route /studio to Vite app
  location /studio {
    proxy_pass http://localhost:5174/;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # Default route to Next.js
  location / {
    proxy_pass http://localhost:3000/;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

### Vite Proxy Configuration

**File**: `brandstudio-vite/vite.config.ts`

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

### Docker Compose Stack

**File**: `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: bizcore
      POSTGRES_USER: bizcore
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  nextjs:
    build: .
    environment:
      DATABASE_URL: postgresql://bizcore:password@postgres:5432/bizcore
      NEXTAUTH_SECRET: [generated]
      NEXTAUTH_URL: http://bizcore.test
    ports:
      - "3000:3000"

  nginx:
    image: nginx:latest
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - nextjs
```

### Email Service

**Library**: Nodemailer
**File**: `lib/email.ts`, `lib/email/paymentEmails.ts`

**Sends**:
- OTP request confirmation (onboarding)
- Onboarding complete confirmation
- Admin notification (new tenant)
- Payment confirmation (subscription)

**Currently missing**:
- Order confirmation (storefront)
- Customer signup welcome (storefront)
- Password reset link
- Employee credentials delivery

---

## Key Differences: Documentation vs. Implementation

| Feature | Documented | Implemented | Status |
|---------|-----------|-------------|--------|
| Password minimum | 6 chars | 6 chars ✓ | ✅ Match |
| Login rate limit | 5/15 min | 5/15 min (via isRateLimited) ✓ | ✅ Match |
| OTP generation | 6 digits | 6 digits ✓ | ✅ Match |
| OTP expiry | 10 min | 10 min ✓ | ✅ Match |
| OTP requests | 3/hour | 3/hour ✓ | ✅ Match |
| OTP verify limit | 5/15 min | 5/15 min ✓ | ✅ Match |
| POS JWT expiry | 12 hours | 12 hours ✓ | ✅ Match |
| Session expiry (default) | 24 hours | 30 days (NextAuth default) | ⚠️ Mismatch |
| Onboarding steps | 7 steps (as listed) | 8 steps (email → welcome → profile → branch → products → staff → prefs → complete) | ⚠️ Reordered |
| POS login rate limit | 5/15 min | NOT IMPLEMENTED | ❌ Missing |
| Customer signup email | Welcome sent | NOT SENT | ❌ Missing |
| Order confirmation email | Sent | NOT SENT | ❌ Missing |
| Checkout shipping tiers | Standard/Express/Overnight | Pickup/Delivery (flat ₱50) | ⚠️ Simplified |
| Payment gateway | Stripe/PayPal | No integration | ❌ Missing |
| Customer order tracking | Tracking # + ETA | No address/tracking fields | ⚠️ Partial |
| POS discounts | Support mentioned | No UI/logic | ❌ Missing |
| POS reports | Day-end reports | No reports feature | ❌ Missing |

---

## Deployment Checklist

### Pre-deployment

- [ ] Set `NEXTAUTH_SECRET` (long random string)
- [ ] Set `NEXTAUTH_URL` to production domain (e.g., `https://bizcore.example.com`)
- [ ] Set `NEXT_PUBLIC_APP_URL` to public URL
- [ ] Set `DATABASE_URL` to production PostgreSQL connection
- [ ] Set `NEXTAUTH_COOKIE_SECURE=true`
- [ ] Configure email service (SMTP credentials for Nodemailer)
- [ ] Update Nginx config with production domain
- [ ] Run `npm run db:migrate` on production
- [ ] Set environment to `NODE_ENV=production`

### Post-deployment

- [ ] Verify HTTPS (Strict-Transport-Security)
- [ ] Test OTP flow end-to-end
- [ ] Test onboarding creation
- [ ] Test POS login
- [ ] Test storefront checkout
- [ ] Test BrandStudio iframe messaging
- [ ] Verify email delivery
- [ ] Monitor error logs

---

## Common Patterns & Best Practices

### 1. **Multi-Tenant Data Isolation**
- Every data-returning query includes `where: { tenantId: tenant.id }`
- Middleware verifies tenant context before allowing access
- Use `resolveTenant(session, subdomain)` helper

### 2. **Session Retrieval**
```typescript
// Admin/Tenant sessions
const session = await getServerSession(authOptions)

// Customer sessions
const session = await getServerSession(customerAuthOptions)

// Fallback: try both
let session = await getServerSession(customerAuthOptions)
if (!session?.user?.id) {
  session = await getServerSession(authOptions)
}
```

### 3. **Subdomain Routing**
- Extract from URL params: `params.subdomain`
- Validate against tenants table
- Pass through queries: `?subdomain={subdomain}`

### 4. **API Client Configuration** (BrandStudio)
```typescript
// Detect iframe and resolve parent origin
const isIframe = window.self !== window.top
const parentOrigin = isIframe ? window.parent.location.origin : window.location.origin
const apiUrl = `${parentOrigin}/api`

// Create axios with credentials
axios.create({ baseURL: apiUrl, withCredentials: true })
```

### 5. **Error Handling**
- Client: Display user-friendly red error messages
- Server: Log full errors, return JSON with error key
- Rate limit exceeded: Include `retryAfter` seconds

---

## Next Steps & Roadmap

### High Priority

1. **Add missing rate limiting**
   - [ ] POS login (5/15 min per employee email)

2. **Implement email notifications**
   - [ ] Order confirmation (storefront)
   - [ ] Customer signup welcome (storefront)
   - [ ] Password reset link (all users)
   - [ ] Employee credentials delivery (POS)

3. **Fix session expiry**
   - [ ] Set `session: { maxAge: 24 * 60 * 60 }` in both `lib/auth.ts` and `lib/customerAuth.ts`

4. **Order tracking**
   - [ ] Add `shippingAddress` to Order model
   - [ ] Add `trackingNumber`, `estimatedDelivery` fields
   - [ ] Implement tracking UI in customer account

### Medium Priority

5. **Payment Gateway Integration**
   - [ ] Stripe checkout (cards, digital wallets)
   - [ ] PayPal integration
   - [ ] GCash/Maya integration

6. **POS Enhancements**
   - [ ] Discount/coupon support
   - [ ] Split/multi-tender payments
   - [ ] Receipt printing
   - [ ] Transaction history & reports
   - [ ] Quick inventory adjustment

7. **Admin Features**
   - [ ] Employee permission matrix
   - [ ] Per-employee activity logs
   - [ ] Tenant suspension/termination

### Low Priority (Nice-to-Have)

8. **BrandStudio Features**
   - [ ] More built-in section templates
   - [ ] Font/color customization
   - [ ] Mobile preview pane
   - [ ] SEO settings per page

9. **Analytics**
   - [ ] Traffic metrics (Google Analytics integration)
   - [ ] Conversion tracking
   - [ ] Custom reports

10. **Performance**
    - [ ] Image optimization (next/image)
    - [ ] Code splitting & lazy loading
    - [ ] Database query optimization

---

## Conclusion

BizCore is a well-structured multi-tenant SaaS with **solid auth foundations** and **clear tenant isolation**. The three user surfaces (admin, tenant owner, customer) function independently with separate session systems.

**Main strengths**:
- ✅ NextAuth JWT architecture
- ✅ Rate limiting on critical endpoints
- ✅ Multi-tenant design with subdomain routing
- ✅ Transaction-based data consistency
- ✅ BrandStudio iframe integration

**Main gaps**:
- ❌ Missing email notifications (orders, signups, resets)
- ❌ No payment gateway integration
- ❌ Session default expiry (should be 24h, is 30d)
- ❌ POS login not rate-limited
- ❌ Order tracking fields not in schema
- ❌ Limited POS feature set (no discounts, reports)

**Recommendation**: Prioritize email notifications and payment integration for production readiness.

