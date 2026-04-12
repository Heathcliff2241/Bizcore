# Tenant Dashboard Navigation Consolidation Plan

## Current State Analysis

### Sidebar Navigation Links (11 items)
1. **Overview** - `/dashboard/[subdomain]`
2. **Orders** - `/dashboard/[subdomain]/orders`
3. **Inventory** - `/dashboard/[subdomain]/inventory`
4. **Products** - `/dashboard/[subdomain]/products`
5. **Categories** - `/dashboard/[subdomain]/categories`
6. **Customers** - `/dashboard/[subdomain]/customers`
7. **Employees** - `/dashboard/[subdomain]/employees`
8. **Analytics** - `/dashboard/[subdomain]/analytics`
9. **Brand Studio** - External link (new tab)
10. **Billing & Subscriptions** - `/dashboard/[subdomain]/billing/subscriptions`
11. **Settings** - `/dashboard/[subdomain]/settings`

**Issue**: Too many top-level links in sidebar, makes navigation cluttered and hard to scan.

---

## Consolidation Strategy

### Group 1: Inventory Management (3 pages → 1 page with 3 tabs)
**Consolidate**: Products, Inventory, Categories
**Reason**: All deal with product/stock data management
**New Page**: `/dashboard/[subdomain]/catalog`
**Tab Structure**:
- **Products Tab** - View/edit all products
- **Inventory Tab** - Track stock levels
- **Categories Tab** - Manage product categories

**Benefits**:
- Reduces sidebar items from 11 to 9
- Logical grouping (all product data in one place)
- Users naturally flow between these features
- Cleaner mental model

---

### Group 2: Business Operations (2 pages → 1 page with 2 tabs)
**Consolidate**: Customers, Employees
**Reason**: Both manage people/teams (external vs internal)
**New Page**: `/dashboard/[subdomain]/people`
**Tab Structure**:
- **Customers Tab** - View customer list, details, purchase history
- **Team Tab** - Manage employees, roles, permissions

**Benefits**:
- Reduces sidebar items from 9 to 8
- Logical grouping (people management)
- Clear separation: external (customers) vs internal (team)
- Potential for shared components (search, filtering, details modal)

---

### Group 3: Business Intelligence (1 page → Keep separate)
**Keep**: Analytics
**Reason**: Dashboard already shows overview; analytics is specialized view
**Status**: Leave as is (already lean)

---

### Group 4: Store/Branding (Keep separate)
**Keep**: Brand Studio, Settings, Billing
**Reason**: 
- Brand Studio is external tool (opens in new tab) - can't be tabbed
- Settings is for general config (store info, appearance, etc.)
- Billing is for subscription management
- These are distinct concerns

---

## Final Navigation Structure

### Proposed Sidebar (8 items)
```
1. Overview         (dashboard overview with key metrics)
2. Orders          (orders management)
3. Catalog         (NEW CONSOLIDATED)
   └─ Tab 1: Products
   └─ Tab 2: Inventory
   └─ Tab 3: Categories
4. People          (NEW CONSOLIDATED)
   └─ Tab 1: Customers
   └─ Tab 2: Team
5. Analytics       (advanced analytics & reports)
6. Brand Studio    (storefront design - external)
7. Billing & Subscriptions (subscription & invoicing)
8. Settings        (store configuration)
```

**Improvement**: 11 items → 8 items (27% reduction in sidebar clutter)

---

## Implementation Details

### Phase 1: Create Consolidated Pages

#### 1a. Catalog Page (`/app/dashboard/[subdomain]/catalog/page.tsx`)
```typescript
// Wraps three tabs with tab switching logic
// Imports ProductsManager, InventoryManager, CategoryManager
// URL params: ?tab=products|inventory|categories (defaults to products)
```

**Components to reuse**:
- `ProductsManager` (products list)
- `InventoryManager` (inventory tracking)
- `CategoryManager` (category management)

#### 1b. People Page (`/app/dashboard/[subdomain]/people/page.tsx`)
```typescript
// Wraps two tabs with tab switching logic
// Imports CustomersPage logic, EmployeeManager
// URL params: ?tab=customers|team (defaults to customers)
```

**Components to reuse**:
- Customer list/detail logic from CustomersPage
- `EmployeeManager` (employee management)

### Phase 2: Update Navigation Links

**File**: `/app/dashboard/[subdomain]/layout.tsx`

**Before**:
```typescript
const links = [
  { name: 'Overview', pattern: '/dashboard/[subdomain]' },
  { name: 'Orders', pattern: '/dashboard/[subdomain]/orders' },
  { name: 'Inventory', pattern: '/dashboard/[subdomain]/inventory' },
  { name: 'Products', pattern: '/dashboard/[subdomain]/products' },
  { name: 'Categories', pattern: '/dashboard/[subdomain]/categories' },
  { name: 'Customers', pattern: '/dashboard/[subdomain]/customers' },
  { name: 'Employees', pattern: '/dashboard/[subdomain]/employees' },
  { name: 'Analytics', pattern: '/dashboard/[subdomain]/analytics' },
  { name: 'Brand Studio', path: '/brandstudio', external: true },
  { name: 'Billing & Subscriptions', pattern: '/dashboard/[subdomain]/billing/subscriptions' },
  { name: 'Settings', pattern: '/dashboard/[subdomain]/settings' }
]
```

**After**:
```typescript
const links = [
  { name: 'Overview', pattern: '/dashboard/[subdomain]' },
  { name: 'Orders', pattern: '/dashboard/[subdomain]/orders' },
  { name: 'Catalog', pattern: '/dashboard/[subdomain]/catalog', hasSubItems: true },
  { name: 'People', pattern: '/dashboard/[subdomain]/people', hasSubItems: true },
  { name: 'Analytics', pattern: '/dashboard/[subdomain]/analytics' },
  { name: 'Brand Studio', path: '/brandstudio', external: true },
  { name: 'Billing & Subscriptions', pattern: '/dashboard/[subdomain]/billing/subscriptions' },
  { name: 'Settings', pattern: '/dashboard/[subdomain]/settings' }
]
```

### Phase 3: Remove Old Pages

**Delete**:
- `/app/dashboard/[subdomain]/products/page.tsx`
- `/app/dashboard/[subdomain]/inventory/page.tsx`
- `/app/dashboard/[subdomain]/categories/page.tsx`
- `/app/dashboard/[subdomain]/customers/page.tsx`
- `/app/dashboard/[subdomain]/employees/page.tsx`

**Redirect** (optional, for backward compatibility):
- Old paths can redirect to new consolidated pages with appropriate tab param

---

## Tab Implementation Details

### Tab Component Structure
```typescript
interface TabProps {
  tabs: Array<{
    id: string
    label: string
    icon?: React.ComponentType
    component: React.ComponentType<any>
  }>
  defaultTab?: string
  onTabChange?: (tabId: string) => void
}

// Usage
<TabbedLayout
  tabs={[
    { id: 'products', label: 'Products', icon: Package, component: ProductsManager },
    { id: 'inventory', label: 'Inventory', icon: Boxes, component: InventoryManager },
    { id: 'categories', label: 'Categories', icon: Tag, component: CategoryManager }
  ]}
  defaultTab="products"
/>
```

### URL State Management
- Use URL search params to persist tab selection
- URL: `/dashboard/[subdomain]/catalog?tab=inventory`
- Benefits: Bookmarkable, shareable, browser back button works

---

## Expected User Impact

### Positive
✅ Less visual clutter in sidebar
✅ Clearer information architecture
✅ Faster navigation (fewer items to scan)
✅ Better mental model (related features grouped)
✅ Consistent experience across groups

### Potential Concerns
⚠️ Users familiar with old structure need reorientation
⚠️ Bookmarks to old URLs will break (mitigate with redirects)
⚠️ Need clear tab labels and icons to distinguish sections

---

## Implementation Order

1. **Create TabbedLayout component** (reusable tab UI)
2. **Create Catalog page with tabs** (Products, Inventory, Categories)
3. **Create People page with tabs** (Customers, Team)
4. **Update layout.tsx navigation**
5. **Test routing and tab switching**
6. **Remove old pages**
7. **Add redirects for old URLs** (optional)
8. **QA & documentation**

---

## Estimated Effort

- **TabbedLayout Component**: 2-3 hours
- **Catalog Page**: 2 hours (mostly reusing existing components)
- **People Page**: 2 hours (mostly reusing existing components)
- **Layout Updates**: 1 hour
- **Testing & QA**: 2 hours
- **Documentation**: 1 hour

**Total**: ~10-11 hours

---

## Rollback Plan

If users resist or issues arise:
1. Keep old pages in parallel for 1 week
2. Redirect sidebar to new consolidated pages
3. Show "legacy view available" option
4. Gather feedback
5. Remove old pages after feedback period

---

## Success Metrics

✅ Sidebar items reduced from 11 to 8
✅ Navigation load time same or faster
✅ User testing shows clearer mental model
✅ No increase in support tickets related to navigation
✅ Tab switching feels native and responsive

---

**Status**: Ready for implementation approval
**Created**: December 6, 2025
