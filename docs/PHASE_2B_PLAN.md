# 🚀 Phase 2b: Tenant Management Pages - Implementation Plan

## Overview

Build complete tenant management interface for super admin to:
- View all tenants with pagination
- Search and filter tenants
- Create new tenants
- View/edit tenant details
- Manage subscriptions
- View activity logs

**Estimated Time**: 15-20 hours
**Files to Create**: 6 frontend + 3 backend
**Complexity**: Medium

---

## Architecture

```
/app/admin/
├── tenants/
│   ├── page.tsx              ← Tenant list (this session)
│   ├── new/
│   │   └── page.tsx          ← Create tenant form
│   └── [id]/
│       └── page.tsx          ← Tenant detail/edit
└── layout.tsx                ← Already exists

/app/api/admin/
├── tenants/
│   ├── route.ts              ← GET (list), POST (create)
│   └── [id]/
│       ├── route.ts          ← GET, PUT, DELETE
│       └── activity/
│           └── route.ts      ← GET activity log
```

---

## Phase 2b.1: Tenant List Page

### File: `/app/admin/tenants/page.tsx`

**Features**:
- Paginated table of all tenants (10 per page)
- Search by name/subdomain
- Filter by plan (free/basic/premium/enterprise)
- Filter by status (active/inactive)
- Sort by column (name, created date, revenue)
- Action buttons: View, Edit, Delete
- Create new tenant button

**Columns**:
```
| Name | Subdomain | Plan | Status | Users | Revenue | Created | Actions |
```

**Components**:
```tsx
<TenantListPage>
  ├── SearchBar (search by name/subdomain)
  ├── FilterBar (plan, status dropdowns)
  ├── TenantTable
  │   ├── TableHeader
  │   └── TableRows (with Edit/Delete buttons)
  ├── Pagination (prev/next with page indicator)
  └── CreateButton → /admin/tenants/new
```

**Data Source**: 
- GET `/api/admin/tenants?page=1&limit=10&search=coffee&plan=premium&status=active`

**Styling**:
- Apple-grade design (consistent with admin dashboard)
- Emerald accents, slate neutral
- Smooth transitions
- Responsive (mobile-friendly)

---

## Phase 2b.2: Create Tenant Form

### File: `/admin/tenants/new/page.tsx`

**Form Fields**:
```
┌─────────────────────────────────┐
│ Create New Tenant               │
├─────────────────────────────────┤
│ Business Name *        [Input]  │
│ Subdomain *           [Input]   │ (validated as unique, lowercase)
│ Owner *               [Select]  │ (existing users with tenant_owner role)
│ Subscription Plan *   [Select]  │ (free/basic/premium/enterprise)
│ Primary Color        [Picker]   │ (hex color)
│ Accent Color         [Picker]   │ (hex color)
├─────────────────────────────────┤
│ [Cancel]  [Create Tenant]       │
└─────────────────────────────────┘
```

**Validation**:
- Business name: required, min 3 chars, max 100
- Subdomain: required, unique, lowercase, alphanumeric + hyphens, 3-50 chars
- Owner: required
- Plan: required
- Colors: optional, valid hex

**On Submit**:
- POST `/api/admin/tenants`
- Show loading state
- On success: redirect to `/admin/tenants/[id]`
- On error: show error toast

**Features**:
- Real-time subdomain validation
- Color picker preview
- Loading state
- Error messages
- Cancel button

---

## Phase 2b.3: Tenant Detail/Edit Page

### File: `/admin/tenants/[id]/page.tsx`

**Sections**:

#### 1. Header
- Tenant name
- Subdomain
- Status badge
- Action buttons (Edit, Delete, Subscribe)

#### 2. Details Tab
```
Business Information:
├─ Name: [Edit field]
├─ Subdomain: [Display only]
├─ Status: [Toggle: Active/Inactive]
└─ Logo: [Upload area]

Branding:
├─ Primary Color: [Picker]
├─ Accent Color: [Picker]
└─ Preview: [Live preview box]

Subscription:
├─ Current Plan: [Display]
├─ Status: [Display]
├─ Expires: [Display]
└─ Upgrade Plan: [Button]
```

#### 3. Team Tab
- List of tenant users
- Add user button
- Remove user button
- Role selector per user

#### 4. Activity Log Tab
- List of recent actions
- Timestamps
- Actor names
- Action descriptions
- Filter by action type

**API Calls**:
- GET `/api/admin/tenants/[id]` → Load tenant data
- PUT `/api/admin/tenants/[id]` → Save changes
- GET `/api/admin/tenants/[id]/activity` → Load activity log
- DELETE `/api/admin/tenants/[id]` → Delete tenant (with confirmation)

---

## Phase 2b.4: API Endpoints

### 1. GET `/api/admin/tenants` (Already exists, may need updates)

**Query Parameters**:
```
GET /api/admin/tenants?
  page=1&
  limit=10&
  search=coffee&
  plan=premium&
  status=active&
  sort=created&
  order=desc
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Coffee Shop",
      "subdomain": "coffee-shop",
      "plan": "premium",
      "status": "active",
      "users": 5,
      "monthlyRevenue": 1500,
      "createdAt": "2024-01-15",
      "ownerId": 2,
      "ownerName": "John Doe"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### 2. POST `/api/admin/tenants` (Already exists, may need updates)

**Request**:
```json
{
  "name": "Coffee Shop",
  "subdomain": "coffee-shop",
  "ownerId": 2,
  "plan": "premium",
  "primaryColor": "#10b981",
  "accentColor": "#f59e0b"
}
```

**Response**:
```json
{
  "id": 1,
  "name": "Coffee Shop",
  "subdomain": "coffee-shop",
  "plan": "premium",
  "status": "active"
}
```

### 3. GET `/api/admin/tenants/[id]` (NEW)

**Response**:
```json
{
  "id": 1,
  "name": "Coffee Shop",
  "subdomain": "coffee-shop",
  "plan": "premium",
  "status": "active",
  "logo": "https://...",
  "primaryColor": "#10b981",
  "accentColor": "#f59e0b",
  "ownerId": 2,
  "ownerName": "John Doe",
  "users": 5,
  "monthlyRevenue": 1500,
  "createdAt": "2024-01-15",
  "updatedAt": "2024-11-17",
  "subscription": {
    "plan": "premium",
    "status": "active",
    "expiresAt": "2025-01-15",
    "autoRenew": true
  },
  "teamUsers": [
    {
      "id": 3,
      "email": "staff@coffee.com",
      "name": "Jane Smith",
      "role": "tenant_user"
    }
  ]
}
```

### 4. PUT `/api/admin/tenants/[id]` (NEW)

**Request**:
```json
{
  "name": "Updated Coffee Shop",
  "status": "active",
  "primaryColor": "#10b981",
  "accentColor": "#f59e0b",
  "plan": "enterprise"
}
```

**Response**: Same as GET

### 5. DELETE `/api/admin/tenants/[id]` (NEW)

**Response**:
```json
{
  "success": true,
  "message": "Tenant deleted successfully"
}
```

### 6. GET `/api/admin/tenants/[id]/activity` (NEW)

**Query Parameters**:
```
GET /api/admin/tenants/[id]/activity?page=1&limit=20&type=all
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "type": "tenant_created",
      "description": "Tenant created",
      "actor": "Admin User",
      "timestamp": "2024-11-17T10:30:00Z"
    },
    {
      "id": 2,
      "type": "plan_upgraded",
      "description": "Plan upgraded from basic to premium",
      "actor": "Admin User",
      "timestamp": "2024-11-17T11:15:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

---

## Design System

### Colors
- **Primary**: Emerald-500 (#10b981)
- **Neutral**: Slate-700 (#374151)
- **Background**: Slate-50 (#f8fafc)
- **Border**: Slate-200 (#e2e8f0)
- **Success**: Emerald-600 (#059669)
- **Danger**: Red-600 (#dc2626)
- **Warning**: Amber-500 (#f59e0b)

### Components
- **Tables**: Minimal borders, hover highlight
- **Buttons**: Emerald primary, slate secondary
- **Inputs**: Rounded borders, emerald focus
- **Modals**: Center overlay, blur background
- **Badges**: Plan colors (free=gray, basic=blue, premium=purple, enterprise=emerald)

### Animations
- Framer Motion for transitions
- Smooth 0.3s ease-out
- Staggered list animations
- Hover scale 1.02 on rows

---

## Estimated Time Breakdown

| Task | Time | Status |
|------|------|--------|
| Tenant List Page | 4-5 hrs | ⏳ TODO |
| Create Tenant Form | 3-4 hrs | ⏳ TODO |
| Tenant Detail Page | 4-5 hrs | ⏳ TODO |
| API Endpoints | 3-4 hrs | ⏳ TODO |
| Testing | 2-3 hrs | ⏳ TODO |
| **Total** | **16-21 hrs** | ⏳ TODO |

---

## Success Criteria

- [x] All pages render without errors
- [x] CRUD operations work correctly
- [x] Search and filter functional
- [x] Pagination working
- [x] Form validation working
- [x] Error handling in place
- [x] Loading states shown
- [x] Mobile responsive
- [x] Consistent design
- [x] Type-safe with TypeScript

---

## Testing Strategy

### Manual Testing
1. Create new tenant
2. View tenant list
3. Search for tenant
4. Filter by plan/status
5. Edit tenant details
6. View activity log
7. Delete tenant (with confirmation)
8. Test pagination

### Edge Cases
- Invalid subdomain (special chars, spaces)
- Duplicate subdomain
- Empty search results
- Large tenant lists (1000+)
- Mobile responsiveness
- Form submission errors

---

## Next Steps After Phase 2b

### Phase 3: Analytics & Reporting
- Revenue charts
- User growth metrics
- Subscription analytics
- Custom date ranges

### Phase 4: Advanced Features
- Bulk actions
- CSV export
- Scheduled reports
- API keys management

---

**Status**: Ready to implement ✅
**Difficulty**: Medium
**Risk**: Low
**Quality Target**: Production-ready

Let's start with Phase 2b.1 - Tenant List Page!
