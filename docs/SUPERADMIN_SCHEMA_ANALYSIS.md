# BizCore Super Admin Schema Analysis

## Database Structure Overview

### Multi-Tenant Architecture
BizCore follows a **multi-tenant** architecture with the following key relationships:

```
User (Global) 
  └─ owns many Tenants
  └─ has TenantUsers (permissions-based access)

Tenant (Business Unit)
  ├─ has Employees (POS staff)
  ├─ has Products, Categories, Ingredients
  ├─ has Customers, Orders
  ├─ has Pages, PageDesigns (BrandStudio)
  ├─ has StorefrontSettings
  └─ has TenantUsers (managers/editors)
```

---

## Key Models for Super Admin

### 1. **User Model** (Global)
```prisma
UserRole: admin | tenant_owner | tenant_user | user

Relevant Fields:
- id: Primary key
- firstName, lastName, email
- role: Determines access level
- isActive: Account status
- emailVerified: Email verification status
- lastLogin: Last login timestamp
- createdAt, updatedAt: Timestamps

Relations:
- ownedTenants: List of tenants this user owns
- tenantUsers: Access to other tenants
- activityLogs: User activity tracking
- orders: Customer orders
```

### 2. **Tenant Model** (Business Units)
```prisma
SubscriptionPlan: free | basic | premium | enterprise
PaymentStatus: unpaid | partial | paid | refunded

Core Fields:
- id: Primary key
- name: Tenant business name
- subdomain: Unique subdomain (e.g., mybusiness.bizcore.com)
- domain: Custom domain
- ownerId: Linked to User
- logo, favicon: Branding
- isActive: Business status
- isPremium: Premium tier
- subscriptionPlan: Current plan
- subscriptionExpires: Plan expiration date
- industry: Business type (restaurant, cafe, retail, etc.)
- primaryColor, secondaryColor: Theme colors
- createdAt, updatedAt: Timestamps

Customization:
- customCSS: Custom styling
- googleAnalytics: GA tracking ID
- facebookPixel: Facebook Pixel ID
- settings: JSON metadata

Relations:
- owner: User who owns tenant
- tenantUsers: Team members with access
- employees: POS staff
- products, categories, ingredients: Inventory
- customers, orders: Transaction data
- pages, pageDesigns: BrandStudio content
- activityLogs: Audit trail
```

### 3. **TenantUser Model** (Team Access)
```prisma
TenantUserRole: owner | admin | editor | viewer

Fields:
- id: Primary key
- tenantId, userId: Foreign keys
- role: Permission level
- permissions: JSON for granular control
- createdAt, updatedAt: Timestamps
```

### 4. **ActivityLog Model** (Audit Trail)
```prisma
Fields:
- id: Primary key
- userId, tenantId: References
- action: What was done
- details: JSON metadata
- ipAddress, userAgent: Request info
- createdAt: Timestamp

Indexed on: userId, tenantId, action, createdAt
```

### 5. **Employee Model** (POS Staff)
```prisma
EmployeeRole: cashier | manager | admin

Fields:
- id: Primary key
- tenantId: Linked tenant
- firstName, lastName, email
- pin: 4-6 digit POS PIN
- role: Job title
- isActive: Employment status
- permissions: JSON for granular control
- lastLogin: Last POS session
- createdAt, updatedAt: Timestamps
```

### 6. **Order & OrderItem Models** (Transactions)
```prisma
Order:
- id, tenantId, customerId, employeeId
- orderNumber, status, paymentStatus, orderType
- total, tax, discount, amountPaid
- paymentMethod: cash | card | digital

OrderItem:
- Associates products/variants with orders
- Quantity and price tracking
```

---

## Data Statistics for Super Admin Dashboard

### Metrics to Track
1. **Total Tenants**: Active, inactive, by plan
2. **Revenue**: Monthly recurring revenue (MRR), total collections
3. **User Count**: By role, by tenant, activity levels
4. **Activity**: Orders, transactions, page views, API calls
5. **Subscription Status**: Expiring soon, overdue payments
6. **System Health**: Database size, API response times

### Queries Required
```sql
-- Total tenants by subscription plan
SELECT subscriptionPlan, COUNT(*) FROM tenants GROUP BY subscriptionPlan;

-- Revenue by tenant
SELECT t.name, SUM(o.total) FROM tenants t 
LEFT JOIN orders o ON t.id = o.tenantId GROUP BY t.id;

-- Active users
SELECT COUNT(*) FROM users WHERE isActive = true AND lastLogin > NOW() - INTERVAL 30 DAY;

-- Tenant activity (last 7 days)
SELECT tenantId, COUNT(*) as actions 
FROM activity_log WHERE createdAt > NOW() - INTERVAL 7 DAY 
GROUP BY tenantId;

-- Subscription expiring soon (next 30 days)
SELECT id, name, subscriptionExpires FROM tenants 
WHERE subscriptionExpires > NOW() AND subscriptionExpires < NOW() + INTERVAL 30 DAY;
```

---

## Super Admin Capabilities

### 1. Tenant Management
- ✅ View all tenants with stats
- ✅ Create new tenants
- ✅ Edit tenant settings (name, subdomain, logo, colors, plan)
- ✅ Manage subscription (plan, expiration, payment status)
- ✅ Suspend/activate tenants
- ✅ Delete tenants (with cascade)
- ✅ View tenant activity logs

### 2. User Management
- ✅ View all global users
- ✅ View tenant assignments
- ✅ Manage user roles (admin, tenant_owner, tenant_user)
- ✅ Reset passwords
- ✅ View login activity

### 3. Subscription & Billing
- ✅ View MRR and revenue
- ✅ Manage subscription plans
- ✅ Track payment statuses
- ✅ Handle renewals and cancellations
- ✅ Generate invoices

### 4. Analytics & Reporting
- ✅ System-wide dashboards
- ✅ Per-tenant reports
- ✅ Revenue tracking
- ✅ User activity reports
- ✅ Export data (CSV/JSON)

### 5. System Administration
- ✅ Activity audit logs
- ✅ System settings
- ✅ API key management
- ✅ Email templates
- ✅ Integration settings

---

## Access Control Rules

### Super Admin (Role: admin)
- Can view/edit ALL data across all tenants
- Can manage global users and tenants
- Can view all activity logs
- Cannot be suspended by anyone

### Tenant Owner (Role: tenant_owner)
- Can view/edit only their own tenant data
- Can manage tenant staff (employees)
- Can manage subscription and billing
- Can invite other team members
- Cannot access other tenants' data

### Tenant Admin (Role: admin within TenantUser)
- Can manage tenant's operational data
- Cannot modify subscription or tenant settings
- Limited to assigned permissions

---

## File Structure for Super Admin

```
app/
  ├── admin/                          # Super Admin Section
  │   ├── layout.tsx                  # Admin layout wrapper
  │   ├── page.tsx                    # Admin dashboard
  │   │
  │   ├── tenants/
  │   │   ├── page.tsx               # Tenant list
  │   │   ├── [id]/
  │   │   │   └── page.tsx           # Tenant detail/edit
  │   │   └── new/
  │   │       └── page.tsx           # Create tenant
  │   │
  │   ├── users/
  │   │   ├── page.tsx               # User list
  │   │   └── [id]/
  │   │       └── page.tsx           # User detail
  │   │
  │   ├── analytics/
  │   │   ├── page.tsx               # Analytics dashboard
  │   │   └── reports/
  │   │       └── page.tsx           # Report generation
  │   │
  │   ├── subscriptions/
  │   │   └── page.tsx               # Subscription management
  │   │
  │   └── settings/
  │       └── page.tsx               # System settings
  │
  └── api/
      └── admin/
          ├── tenants/
          │   ├── route.ts           # List/create tenants
          │   └── [id]/route.ts      # Get/update/delete tenant
          ├── users/
          │   └── route.ts           # User management
          ├── analytics/
          │   ├── route.ts           # Dashboard stats
          │   └── reports/route.ts   # Report generation
          └── subscriptions/
              └── route.ts           # Subscription management
```

---

## Authentication & Authorization

### Super Admin Access
1. **URL Guard**: `/admin/*` routes protected
2. **Role Check**: User.role === 'admin'
3. **Session Validation**: Check token/session validity
4. **Activity Logging**: All admin actions logged

### Implementation Points
- `middleware.ts`: Route protection
- `lib/auth.ts`: Role verification
- `app/api/admin/middleware.ts`: API protection

---

## Design Philosophy (Apple Grade)

### Principles
- **Minimalist**: Clean, uncluttered interface
- **Responsive**: Works on desktop, tablet, mobile
- **Performant**: Fast loading, smooth animations
- **Accessible**: Keyboard navigation, screen reader support
- **Consistent**: Same design language as tenant dashboard
- **Professional**: Suitable for enterprise management

### Color Scheme
- **Primary**: Slate/Gray (professional, neutral)
- **Accent**: Emerald (growth, positive actions)
- **Alert**: Red (dangers, critical actions)
- **Background**: White with subtle gradients

### Components
- Data tables with sorting/filtering
- Charts and graphs for analytics
- Modal dialogs for forms
- Toasts for notifications
- Breadcrumb navigation
- Sidebar for navigation

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create admin layout and routes
- [ ] Implement authentication/authorization
- [ ] Create admin dashboard (overview)
- [ ] Implement middleware protection

### Phase 2: Tenant Management
- [ ] Tenant list view with search/filter
- [ ] Tenant detail/edit view
- [ ] Create tenant form
- [ ] Delete tenant with confirmation
- [ ] Activity logs per tenant

### Phase 3: User & Subscription
- [ ] User management interface
- [ ] Subscription/billing management
- [ ] Payment tracking
- [ ] Plan upgrade/downgrade

### Phase 4: Analytics
- [ ] System-wide analytics dashboard
- [ ] Revenue reporting
- [ ] Usage analytics
- [ ] Custom report generation

### Phase 5: System Management
- [ ] System settings
- [ ] Email template management
- [ ] API key management
- [ ] Audit logs viewer

---

## Next Steps

1. Create `/app/admin/layout.tsx` - Admin wrapper with navigation
2. Create `/app/admin/page.tsx` - Dashboard with KPIs
3. Create `/app/api/admin/tenants/route.ts` - API endpoints
4. Create `/app/admin/tenants/page.tsx` - Tenant management
5. Continue with user, subscription, analytics modules
