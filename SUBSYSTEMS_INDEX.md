# BizCore Database Subsystems Index

Complete guide to all 7 subsystems in the BizCore multi-tenant SaaS platform. Each subsystem file is self-contained and can be copied directly into the [Prisma Schema Visualizer](https://prisma-schema-visualizer.vercel.app/) for ERD screenshots.

---

## SUBSYSTEM 1: Core Authentication & Tenancy
**File:** `SUBSYSTEM_1_CORE_AUTH.prisma`

**Purpose:** Foundation of the entire system. Manages user identity, tenant isolation, and authentication state across the platform.

### Entity Descriptions

1. **Users:** Stores platform-wide user credentials, email, and authentication state. Each user can be assigned to multiple tenants via TenantUser join table.

2. **Tenants:** Represents SaaS customer organizations with unique subdomains for multi-tenant isolation. Stores branding settings, configuration, and serves as the root entity for all business data.

3. **TenantUsers:** Manages the assignment of users to tenants with role-based access control (owner, admin, editor, viewer). Includes JSON-based permissions field for granular feature access.

4. **ActivityLogs:** Maintains an audit trail of all tenant actions including resource creation, updates, and deletions. Preserves who did what and when for compliance and troubleshooting.

5. **Notifications:** Stores in-app notifications for individual users with read/unread status. Supports notification types (email, in-app) and delivery tracking.

6. **TenantRegistrations:** Tracks signup requests and onboarding progress during new tenant creation. Records email verification status and invite codes for team members.

7. **AdminNotifications:** System-level notifications for super-admin users. Alerts admins about system health, user escalations, and billing issues.

8. **OTPs:** One-time passwords for two-factor authentication and password reset flows. Includes expiration time and usage tracking for security.

**Dependencies:** None (foundation module)

---

## SUBSYSTEM 2: Products & Catalog
**File:** `SUBSYSTEM_2_PRODUCTS.prisma`
 Products & Catalog
**Purpose:** Product inventory, categorization, and variant management for storefronts. Handles bill-of-materials tracking for ingredient-based products.

### Entity Descriptions

1. **Categories:** Stores product categories with names, descriptions, and image URLs. Supports nested hierarchy via parentId for organizing products into subcategories.

2. **Products:** Represents catalog items with pricing, descriptions, SKU, and status. Associated with categories and contains multiple variants for different product options.

3. **ProductVariants:** Defines product options such as size, color, or flavor with individual pricing and stock information. Each variant can have different ingredient compositions and cost structures.

4. **Ingredients:** Stores raw materials or components used in products. Includes unit measurements, cost per unit, and supplier information for inventory planning.

5. **ProductIngredients:** Maps products to their required ingredients with quantity specifications. Represents the bill-of-materials linking products to base ingredients.

6. **VariantIngredients:** Tracks ingredient usage for specific product variants. Allows variants to have different ingredient compositions and quantities than the base product.

7. **Tenant (dependency):** Provides multi-tenant isolation ensuring each tenant's product catalog, categories, and ingredients are completely separate and secure.

**Dependencies:** 
- Subsystem 1 (Tenant)

---

## SUBSYSTEM 3: Orders & Transactions
**File:** `SUBSYSTEM_3_ORDERS.prisma`

**Purpose:** Order lifecycle, customer transactions, and payment/shipping tracking. Maintains complete audit trail of order state changes and fulfillment.

### Entity Descriptions

1. **Customers:** Stores customer profiles with contact information, address, and preferences. Linked to multiple orders for order history and customer analytics.

2. **Orders:** Represents main order records with customer info, total amounts, payment status, and fulfillment status. Connected to line items and order status history for complete transaction tracking.

3. **OrderItems:** Stores line items within each order including product/variant references, quantities ordered, unit prices, and totals. Preserves pricing snapshot at order time.

4. **OrderStatusHistory:** Maintains an audit trail of order status changes (pending → confirmed → processing → shipped → delivered) with timestamps and notes. Enables visibility into order progression and troubleshooting.

5. **Media:** Stores file references for order documentation such as receipts, invoices, packing slips, and proof of delivery. Links uploaded files to specific orders.

6. **User (dependency):** Tracks order ownership and which employee/system user created or modified the order. Enables accountability and employee performance tracking.

7. **Tenant (dependency):** Provides multi-tenant isolation ensuring each tenant's customers and orders are completely separate and secure.

8. **Product & ProductVariant (dependencies):** Referenced by OrderItems to identify what was ordered. Preserves relationship to catalog for inventory and analytics.

**Dependencies:**
- Subsystem 1 (User, Tenant)
- Subsystem 2 (Product, ProductVariant)

---

## SUBSYSTEM 4: Inventory Management
**File:** `SUBSYSTEM_4_INVENTORY.prisma`

**Purpose:** Track ingredient/product stock levels and movement history. Maintains complete audit trail of all inventory transactions.

### Entity Descriptions

1. **InventoryTransactions:** Records every stock movement event including purchases, usage, waste, and adjustments. Tracks transaction type, quantity, cost, reference document, and timestamp for complete inventory accountability.

2. **Ingredient (dependency):** Raw materials or components being tracked in inventory. Referenced by transactions to maintain stock levels and usage history.

3. **Tenant (dependency):** Provides multi-tenant isolation ensuring each tenant's inventory is completely separate and secure. Inventory tracking is tenant-specific.

**Dependencies:**
- Subsystem 1 (Tenant)
- Subsystem 2 (Ingredient concept)

---

## SUBSYSTEM 5: Employee & POS Operations
**File:** `SUBSYSTEM_5_EMPLOYEES.prisma`

**Purpose:** Staff management, point-of-sale sessions, and employee-specific order handling. Tracks employee access and POS transaction sessions.

### Entity Descriptions

1. **Employees:** Stores staff profiles including name, contact info, role (manager, cashier, kitchen_staff, delivery_staff), and access level. Each employee is linked to a User account for authentication.

2. **POSSessions:** Records point-of-sale terminal sessions including login/logout times, terminal ID, and transaction totals. Tracks which employee operated the terminal and when.

3. **User (dependency):** Provides authentication credentials for employees to access the system and POS terminals. Links employee profiles to platform accounts.

4. **Order (dependency):** Orders created during a POS session are linked to the session for transaction history and employee accountability tracking.

**Dependencies:**
- Subsystem 1 (User, Tenant)
- Subsystem 3 (Order, OrderStatus)

---

## SUBSYSTEM 6: Storefront & Page Design
**File:** `SUBSYSTEM_6_STOREFRONT.prisma`

**Purpose:** Website pages, visual design system, and storefront configuration. Integrates with BrandStudio for drag-and-drop page design.

### Entity Descriptions

1. **Pages:** Represents storefront web pages with title, slug, publish status, and metadata. Each page can be published to customers or kept as draft for editing.

2. **PageRevisions:** Maintains version history of pages with content snapshots and timestamps. Enables rollback to previous versions if needed.

3. **PageDesign:** Stores the visual design canvas definition for a page including layout configuration. Acts as the blueprint for how a page looks.

4. **PageComponents:** Individual visual components placed on pages (text, images, buttons, forms). Stores component type, properties, and positioning data from Konva canvas design.

5. **PageDesignRevisions:** Maintains version history of design changes with snapshots. Tracks all design iterations and enables reverting to previous designs.

6. **SeoSettings:** Stores SEO metadata for each page including meta title, description, keywords, and structured data (JSON-LD). Improves search engine visibility and social sharing.

7. **StorefrontSettings:** Stores global storefront configuration including branding colors, logo, domain settings, and general appearance preferences.

8. **Projects:** Organizational container for grouping related pages and design work. Helps manage multiple storefront designs and campaigns.

9. **Canvas:** Represents a design canvas workspace where users visually edit page layouts. Syncs with BrandStudio for real-time collaborative editing.

10. **User (dependency):** Tracks which user created or last edited each page, revision, and design. Enables accountability and collaboration features.

11. **Tenant (dependency):** Provides multi-tenant isolation ensuring each tenant's pages and design are completely separate and secure.

**Dependencies:**
- Subsystem 1 (User, Tenant)

---

## SUBSYSTEM 7: Billing & Subscriptions
**File:** `SUBSYSTEM_7_BILLING.prisma`

**Purpose:** SaaS subscription management, payment processing, and usage-based billing. Manages complete subscription lifecycle from trial to cancellation.

### Entity Descriptions

1. **Plans:** Defines subscription tier options with pricing, features list (JSON), billing cycle (monthly/annual/lifetime), and availability status. Represents the products available for purchase.

2. **Subscriptions:** Represents a tenant's current subscription state including plan, billing cycle, renewal date, and status (trial→active→overdue→cancelled). Tracks subscription lifecycle and auto-renewal preferences.

3. **Invoices:** Billing documents generated for subscription renewals or one-time charges. Stores subtotal, tax, discount, total amount, due date, and payment status.

4. **Payments:** Records payment transactions including amount, status (unpaid/partial/paid/refunded), payment method details, and gateway response. Supports retry logic for failed payments.

5. **UsageRecords:** Tracks metered usage metrics for usage-based billing features. Stores metric name, value, limit, and percentage used for overage calculations.

6. **BillingPreferences:** Stores tenant's payment method preferences, billing email, address, tax ID, and notification settings. Supports multiple payment methods including GCash for Philippines market.

7. **PlanUpgradeRequests:** Manages the upgrade workflow when tenants want to change plans. Tracks current/new plan, proration amount, payment status, and approval state.

8. **AdminSettings:** System-wide billing configuration for the super-admin. Stores payment processor credentials (GCash phone number, QR codes) for processing payments.

9. **Tenant (dependency):** The subscription owner. Each tenant has one active subscription for their service access.

**Dependencies:**
- Subsystem 1 (Tenant)

---

## Quick Reference: Dependency Tree

```
SUBSYSTEM 1: Core Auth & Tenancy (Foundation)
    ↓
    ├→ SUBSYSTEM 2: Products & Catalog (uses Tenant)
    │       ↓
    │   SUBSYSTEM 3: Orders (uses User, Tenant, Product, ProductVariant)
    │       ↓
    │   SUBSYSTEM 4: Inventory (uses Tenant, Ingredient concept)
    │
    ├→ SUBSYSTEM 5: Employees & POS (uses User, Tenant, Order)
    │
    ├→ SUBSYSTEM 6: Storefront & Design (uses User, Tenant)
    │
    └→ SUBSYSTEM 7: Billing & Subscriptions (uses Tenant)
```

**To understand dependencies:**
- Always start with **SUBSYSTEM 1** (foundation)
- SUBSYSTEM 2 extends into SUBSYSTEM 3 and 4 (products → orders → inventory)
- SUBSYSTEM 5 overlaps with SUBSYSTEM 1 and 3 (employees handle orders)
- SUBSYSTEM 6 is independent after SUBSYSTEM 1 (storefront design)
- SUBSYSTEM 7 is independent after SUBSYSTEM 1 (billing per tenant)

---

## How to Use These Files

### For Screenshots/Documentation:
1. Open [Prisma Schema Visualizer](https://prisma-schema-visualizer.vercel.app/)
2. Copy the entire content of `SUBSYSTEM_X_*.prisma`
3. Paste into the visualizer
4. Screenshot the generated ERD
5. Repeat for each subsystem

### For Implementation:
1. All files are valid, standalone Prisma schemas
2. Can be validated individually: `prisma validate --schema SUBSYSTEM_1_CORE_AUTH.prisma`
3. Use the complete `SCHEMA_CLEAN.prisma` for actual database schema (includes all models merged)

### For Understanding:
- Read this document to understand purpose and relationships
- Look at the diagram for each subsystem to visualize the data model
- Check the Prisma schema file for field-level details and constraints

---

## Key Patterns Across All Subsystems

**Multi-Tenancy:**
- Every business entity has `tenantId` field
- Ensures complete data isolation between customers
- Combined with user role checks for security

**Audit Trails:**
- ActivityLog (Subsystem 1)
- *StatusHistory models (OrderStatusHistory, PageRevisionHistory, etc.)
- createdAt/updatedAt timestamps on all records

**Soft Deletes:**
- Use `isActive` boolean instead of hard deletion
- Preserves referential integrity and audit history
- More common than DELETE CASCADE in multi-tenant systems

**JSON Fields:**
- lineItems, features, permissions, metadata
- Store flexible/dynamic data without schema migration
- Validated at application layer

**Enumerations:**
- Define valid states (OrderStatus, UserRole, SubscriptionStatus, etc.)
- Database-enforced via ENUM types
- Prevents invalid state transitions

---

## Total System Overview

**Total Models:** 38  
**Total Enumerations:** 12  
**Total Business Subsystems:** 7  
**Primary Database:** PostgreSQL  
**ORM:** Prisma  
**Multi-Tenancy:** Complete isolation via tenantId + role-based access  
**Authentication:** NextAuth with JWT  

The system is designed to scale from single-tenant features (early development) to full multi-tenant SaaS operations (production deployment) with automatic tenant isolation at the database level.
