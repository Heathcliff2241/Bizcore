# BizCore Data Dictionary

The BizCore system's data dictionary provides a detailed description of all database tables, their attributes, data types, key constraints, and relationships across seven business subsystems. Each table represents a distinct entity used in the multi-tenant SaaS platform for product management, order processing, employee operations, storefront design, and subscription billing. Key attributes include primary keys to uniquely identify records, foreign keys to establish relationships between entities, and timestamps for tracking creation and updates. The data dictionary ensures clarity in the database design and serves as a reference for system development, maintenance, and future enhancements. All business entities include a `tenantId` field to maintain strict multi-tenant data isolation.

---

## SUBSYSTEM 1: Core Authentication & Tenancy

| Table Name | Ord | Key | Column Name | Data Type | Nullable |
|---|---|---|---|---|---|
| users | 1 | PK | id | bigint(20) | NOT NULL |
| users | 2 | | name | varchar(255) | NOT NULL |
| users | 3 | UK | email | varchar(255) | NOT NULL |
| users | 4 | | emailVerifiedAt | timestamp(4) | NULL |
| users | 5 | | password | varchar(255) | NOT NULL |
| users | 6 | | createdAt | timestamp(4) | NOT NULL |
| users | 7 | | updatedAt | timestamp(4) | NOT NULL |
| tenants | 1 | PK | id | bigint(20) | NOT NULL |
| tenants | 2 | UK | subdomain | varchar(255) | NOT NULL |
| tenants | 3 | | name | varchar(255) | NOT NULL |
| tenants | 4 | | logo | varchar(255) | NULL |
| tenants | 5 | | primaryColor | varchar(7) | NULL |
| tenants | 6 | | secondaryColor | varchar(7) | NULL |
| tenants | 7 | | settings | json | NULL |
| tenants | 8 | | isActive | tinyint(1) | NOT NULL |
| tenants | 9 | | createdAt | timestamp(4) | NOT NULL |
| tenants | 10 | | updatedAt | timestamp(4) | NOT NULL |
| tenant_users | 1 | PK | id | bigint(20) | NOT NULL |
| tenant_users | 2 | FK | userId | bigint(20) | NOT NULL |
| tenant_users | 3 | FK | tenantId | bigint(20) | NOT NULL |
| tenant_users | 4 | | role | enum(4) | NOT NULL |
| tenant_users | 5 | | permissions | json | NULL |
| tenant_users | 6 | UK | userId, tenantId | composite | NOT NULL |
| tenant_users | 7 | | createdAt | timestamp(4) | NOT NULL |
| tenant_users | 8 | | updatedAt | timestamp(4) | NOT NULL |
| activity_logs | 1 | PK | id | bigint(20) | NOT NULL |
| activity_logs | 2 | FK | tenantId | bigint(20) | NOT NULL |
| activity_logs | 3 | FK | userId | bigint(20) | NULL |
| activity_logs | 4 | | action | varchar(255) | NOT NULL |
| activity_logs | 5 | | resourceType | varchar(255) | NOT NULL |
| activity_logs | 6 | | resourceId | bigint(20) | NULL |
| activity_logs | 7 | | changes | json | NULL |
| activity_logs | 8 | | createdAt | timestamp(4) | NOT NULL |
| notifications | 1 | PK | id | bigint(20) | NOT NULL |
| notifications | 2 | FK | userId | bigint(20) | NOT NULL |
| notifications | 3 | | title | varchar(255) | NOT NULL |
| notifications | 4 | | message | text(65535) | NOT NULL |
| notifications | 5 | | type | varchar(50) | NULL |
| notifications | 6 | | isRead | tinyint(1) | NOT NULL |
| notifications | 7 | | readAt | timestamp(4) | NULL |
| notifications | 8 | | createdAt | timestamp(4) | NOT NULL |
| tenant_registrations | 1 | PK | id | bigint(20) | NOT NULL |
| tenant_registrations | 2 | FK | tenantId | bigint(20) | NOT NULL |
| tenant_registrations | 3 | | status | enum(4) | NOT NULL |
| tenant_registrations | 4 | | emailVerified | tinyint(1) | NOT NULL |
| tenant_registrations | 5 | | verificationCode | varchar(255) | NULL |
| tenant_registrations | 6 | | createdAt | timestamp(4) | NOT NULL |
| tenant_registrations | 7 | | updatedAt | timestamp(4) | NOT NULL |
| admin_notifications | 1 | PK | id | bigint(20) | NOT NULL |
| admin_notifications | 2 | | title | varchar(255) | NOT NULL |
| admin_notifications | 3 | | message | text(65535) | NOT NULL |
| admin_notifications | 4 | | severity | enum(3) | NOT NULL |
| admin_notifications | 5 | | isRead | tinyint(1) | NOT NULL |
| admin_notifications | 6 | | createdAt | timestamp(4) | NOT NULL |
| otps | 1 | PK | id | bigint(20) | NOT NULL |
| otps | 2 | FK | userId | bigint(20) | NOT NULL |
| otps | 3 | | code | varchar(6) | NOT NULL |
| otps | 4 | | type | enum(3) | NOT NULL |
| otps | 5 | | expiresAt | timestamp(4) | NOT NULL |
| otps | 6 | | usedAt | timestamp(4) | NULL |
| otps | 7 | | createdAt | timestamp(4) | NOT NULL |

---

## SUBSYSTEM 2: Products & Catalog

| Table Name | Ord | Key | Column Name | Data Type | Nullable |
|---|---|---|---|---|---|
| categories | 1 | PK | id | bigint(20) | NOT NULL |
| categories | 2 | FK | tenantId | bigint(20) | NOT NULL |
| categories | 3 | FK | parentId | bigint(20) | NULL |
| categories | 4 | | name | varchar(255) | NOT NULL |
| categories | 5 | | description | text(65535) | NULL |
| categories | 6 | | image | varchar(255) | NULL |
| categories | 7 | | displayOrder | int(10) | NOT NULL |
| categories | 8 | | isActive | tinyint(1) | NOT NULL |
| categories | 9 | | createdAt | timestamp(4) | NOT NULL |
| categories | 10 | | updatedAt | timestamp(4) | NOT NULL |
| products | 1 | PK | id | bigint(20) | NOT NULL |
| products | 2 | FK | tenantId | bigint(20) | NOT NULL |
| products | 3 | FK | categoryId | bigint(20) | NOT NULL |
| products | 4 | UK | sku | varchar(255) | NOT NULL |
| products | 5 | | name | varchar(255) | NOT NULL |
| products | 6 | | description | text(65535) | NULL |
| products | 7 | | basePrice | decimal(10,2) | NOT NULL |
| products | 8 | | image | varchar(255) | NULL |
| products | 9 | | isActive | tinyint(1) | NOT NULL |
| products | 10 | | createdAt | timestamp(4) | NOT NULL |
| products | 11 | | updatedAt | timestamp(4) | NOT NULL |
| product_variants | 1 | PK | id | bigint(20) | NOT NULL |
| product_variants | 2 | FK | tenantId | bigint(20) | NOT NULL |
| product_variants | 3 | FK | productId | bigint(20) | NOT NULL |
| product_variants | 4 | | name | varchar(255) | NOT NULL |
| product_variants | 5 | | sku | varchar(255) | NULL |
| product_variants | 6 | | price | decimal(10,2) | NOT NULL |
| product_variants | 7 | | cost | decimal(10,2) | NULL |
| product_variants | 8 | | stock | int(10) | NOT NULL |
| product_variants | 9 | | reorderLevel | int(10) | NULL |
| product_variants | 10 | | isActive | tinyint(1) | NOT NULL |
| product_variants | 11 | | createdAt | timestamp(4) | NOT NULL |
| product_variants | 12 | | updatedAt | timestamp(4) | NOT NULL |
| ingredients | 1 | PK | id | bigint(20) | NOT NULL |
| ingredients | 2 | FK | tenantId | bigint(20) | NOT NULL |
| ingredients | 3 | | name | varchar(255) | NOT NULL |
| ingredients | 4 | | unit | varchar(50) | NOT NULL |
| ingredients | 5 | | costPerUnit | decimal(10,4) | NULL |
| ingredients | 6 | | supplier | varchar(255) | NULL |
| ingredients | 7 | | createdAt | timestamp(4) | NOT NULL |
| ingredients | 8 | | updatedAt | timestamp(4) | NOT NULL |
| product_ingredients | 1 | PK | id | bigint(20) | NOT NULL |
| product_ingredients | 2 | FK | tenantId | bigint(20) | NOT NULL |
| product_ingredients | 3 | FK | productId | bigint(20) | NOT NULL |
| product_ingredients | 4 | FK | ingredientId | bigint(20) | NOT NULL |
| product_ingredients | 5 | | quantity | decimal(10,4) | NOT NULL |
| product_ingredients | 6 | UK | productId, ingredientId | composite | NOT NULL |
| product_ingredients | 7 | | createdAt | timestamp(4) | NOT NULL |
| product_ingredients | 8 | | updatedAt | timestamp(4) | NOT NULL |
| variant_ingredients | 1 | PK | id | bigint(20) | NOT NULL |
| variant_ingredients | 2 | FK | tenantId | bigint(20) | NOT NULL |
| variant_ingredients | 3 | FK | variantId | bigint(20) | NOT NULL |
| variant_ingredients | 4 | FK | ingredientId | bigint(20) | NOT NULL |
| variant_ingredients | 5 | | quantity | decimal(10,4) | NOT NULL |
| variant_ingredients | 6 | UK | variantId, ingredientId | composite | NOT NULL |
| variant_ingredients | 7 | | createdAt | timestamp(4) | NOT NULL |
| variant_ingredients | 8 | | updatedAt | timestamp(4) | NOT NULL |

---

## SUBSYSTEM 3: Orders & Transactions

| Table Name | Ord | Key | Column Name | Data Type | Nullable |
|---|---|---|---|---|---|
| customers | 1 | PK | id | bigint(20) | NOT NULL |
| customers | 2 | FK | tenantId | bigint(20) | NOT NULL |
| customers | 3 | | name | varchar(255) | NOT NULL |
| customers | 4 | UK | email | varchar(255) | NOT NULL |
| customers | 5 | | phone | varchar(20) | NULL |
| customers | 6 | | address | text(65535) | NULL |
| customers | 7 | | city | varchar(100) | NULL |
| customers | 8 | | postalCode | varchar(10) | NULL |
| customers | 9 | | createdAt | timestamp(4) | NOT NULL |
| customers | 10 | | updatedAt | timestamp(4) | NOT NULL |
| orders | 1 | PK | id | bigint(20) | NOT NULL |
| orders | 2 | FK | tenantId | bigint(20) | NOT NULL |
| orders | 3 | FK | customerId | bigint(20) | NOT NULL |
| orders | 4 | FK | userId | bigint(20) | NULL |
| orders | 5 | | orderNumber | varchar(50) | NOT NULL |
| orders | 6 | | subtotal | decimal(12,2) | NOT NULL |
| orders | 7 | | tax | decimal(12,2) | NOT NULL |
| orders | 8 | | shipping | decimal(12,2) | NOT NULL |
| orders | 9 | | discount | decimal(12,2) | NOT NULL |
| orders | 10 | | total | decimal(12,2) | NOT NULL |
| orders | 11 | | orderStatus | enum(7) | NOT NULL |
| orders | 12 | | paymentStatus | enum(4) | NOT NULL |
| orders | 13 | | notes | text(65535) | NULL |
| orders | 14 | | createdAt | timestamp(4) | NOT NULL |
| orders | 15 | | updatedAt | timestamp(4) | NOT NULL |
| order_items | 1 | PK | id | bigint(20) | NOT NULL |
| order_items | 2 | FK | tenantId | bigint(20) | NOT NULL |
| order_items | 3 | FK | orderId | bigint(20) | NOT NULL |
| order_items | 4 | FK | productId | bigint(20) | NOT NULL |
| order_items | 5 | FK | variantId | bigint(20) | NULL |
| order_items | 6 | | quantity | int(10) | NOT NULL |
| order_items | 7 | | unitPrice | decimal(10,2) | NOT NULL |
| order_items | 8 | | subtotal | decimal(12,2) | NOT NULL |
| order_items | 9 | | createdAt | timestamp(4) | NOT NULL |
| order_items | 10 | | updatedAt | timestamp(4) | NOT NULL |
| order_status_history | 1 | PK | id | bigint(20) | NOT NULL |
| order_status_history | 2 | FK | tenantId | bigint(20) | NOT NULL |
| order_status_history | 3 | FK | orderId | bigint(20) | NOT NULL |
| order_status_history | 4 | | oldStatus | enum(7) | NULL |
| order_status_history | 5 | | newStatus | enum(7) | NOT NULL |
| order_status_history | 6 | | notes | text(65535) | NULL |
| order_status_history | 7 | | changedAt | timestamp(4) | NOT NULL |
| media | 1 | PK | id | bigint(20) | NOT NULL |
| media | 2 | FK | tenantId | bigint(20) | NOT NULL |
| media | 3 | FK | orderId | bigint(20) | NULL |
| media | 4 | | filename | varchar(255) | NOT NULL |
| media | 5 | | filepath | varchar(255) | NOT NULL |
| media | 6 | | mimeType | varchar(100) | NOT NULL |
| media | 7 | | fileSize | bigint(20) | NOT NULL |
| media | 8 | | documentType | varchar(50) | NULL |
| media | 9 | | createdAt | timestamp(4) | NOT NULL |

---

## SUBSYSTEM 4: Inventory Management

| Table Name | Ord | Key | Column Name | Data Type | Nullable |
|---|---|---|---|---|---|
| inventory_transactions | 1 | PK | id | bigint(20) | NOT NULL |
| inventory_transactions | 2 | FK | tenantId | bigint(20) | NOT NULL |
| inventory_transactions | 3 | FK | ingredientId | bigint(20) | NOT NULL |
| inventory_transactions | 4 | | type | enum(5) | NOT NULL |
| inventory_transactions | 5 | | quantity | decimal(10,4) | NOT NULL |
| inventory_transactions | 6 | | cost | decimal(10,4) | NULL |
| inventory_transactions | 7 | | referenceDocument | varchar(255) | NULL |
| inventory_transactions | 8 | | notes | text(65535) | NULL |
| inventory_transactions | 9 | | transactionDate | timestamp(4) | NOT NULL |
| inventory_transactions | 10 | | createdAt | timestamp(4) | NOT NULL |

---

## SUBSYSTEM 5: Employee & POS Operations

| Table Name | Ord | Key | Column Name | Data Type | Nullable |
|---|---|---|---|---|---|
| employees | 1 | PK | id | bigint(20) | NOT NULL |
| employees | 2 | FK | tenantId | bigint(20) | NOT NULL |
| employees | 3 | FK | userId | bigint(20) | NOT NULL |
| employees | 4 | | name | varchar(255) | NOT NULL |
| employees | 5 | | phone | varchar(20) | NULL |
| employees | 6 | | role | enum(4) | NOT NULL |
| employees | 7 | | isActive | tinyint(1) | NOT NULL |
| employees | 8 | | hireDate | date | NULL |
| employees | 9 | | createdAt | timestamp(4) | NOT NULL |
| employees | 10 | | updatedAt | timestamp(4) | NOT NULL |
| pos_sessions | 1 | PK | id | bigint(20) | NOT NULL |
| pos_sessions | 2 | FK | tenantId | bigint(20) | NOT NULL |
| pos_sessions | 3 | FK | employeeId | bigint(20) | NOT NULL |
| pos_sessions | 4 | | terminalId | varchar(50) | NOT NULL |
| pos_sessions | 5 | | loginTime | timestamp(4) | NOT NULL |
| pos_sessions | 6 | | logoutTime | timestamp(4) | NULL |
| pos_sessions | 7 | | totalSales | decimal(12,2) | NOT NULL |
| pos_sessions | 8 | | totalTransactions | int(10) | NOT NULL |
| pos_sessions | 9 | | createdAt | timestamp(4) | NOT NULL |

---

## SUBSYSTEM 6: Storefront & Page Design

| Table Name | Ord | Key | Column Name | Data Type | Nullable |
|---|---|---|---|---|---|
| pages | 1 | PK | id | bigint(20) | NOT NULL |
| pages | 2 | FK | tenantId | bigint(20) | NOT NULL |
| pages | 3 | FK | createdBy | bigint(20) | NOT NULL |
| pages | 4 | UK | slug | varchar(255) | NOT NULL |
| pages | 5 | | title | varchar(255) | NOT NULL |
| pages | 6 | | description | text(65535) | NULL |
| pages | 7 | | isPublished | tinyint(1) | NOT NULL |
| pages | 8 | | publishedAt | timestamp(4) | NULL |
| pages | 9 | | createdAt | timestamp(4) | NOT NULL |
| pages | 10 | | updatedAt | timestamp(4) | NOT NULL |
| page_revisions | 1 | PK | id | bigint(20) | NOT NULL |
| page_revisions | 2 | FK | tenantId | bigint(20) | NOT NULL |
| page_revisions | 3 | FK | pageId | bigint(20) | NOT NULL |
| page_revisions | 4 | | content | longtext(4294967295) | NULL |
| page_revisions | 5 | | revisionNumber | int(10) | NOT NULL |
| page_revisions | 6 | | createdAt | timestamp(4) | NOT NULL |
| page_designs | 1 | PK | id | bigint(20) | NOT NULL |
| page_designs | 2 | FK | tenantId | bigint(20) | NOT NULL |
| page_designs | 3 | FK | pageId | bigint(20) | NOT NULL |
| page_designs | 4 | | layout | json | NOT NULL |
| page_designs | 5 | | metadata | json | NULL |
| page_designs | 6 | | createdAt | timestamp(4) | NOT NULL |
| page_designs | 7 | | updatedAt | timestamp(4) | NOT NULL |
| page_components | 1 | PK | id | bigint(20) | NOT NULL |
| page_components | 2 | FK | tenantId | bigint(20) | NOT NULL |
| page_components | 3 | FK | pageId | bigint(20) | NOT NULL |
| page_components | 4 | | componentType | varchar(100) | NOT NULL |
| page_components | 5 | | content | json | NOT NULL |
| page_components | 6 | | position | int(10) | NOT NULL |
| page_components | 7 | | createdAt | timestamp(4) | NOT NULL |
| page_components | 8 | | updatedAt | timestamp(4) | NOT NULL |
| page_design_revisions | 1 | PK | id | bigint(20) | NOT NULL |
| page_design_revisions | 2 | FK | tenantId | bigint(20) | NOT NULL |
| page_design_revisions | 3 | FK | pageDesignId | bigint(20) | NOT NULL |
| page_design_revisions | 4 | | layout | json | NOT NULL |
| page_design_revisions | 5 | | revisionNumber | int(10) | NOT NULL |
| page_design_revisions | 6 | | createdAt | timestamp(4) | NOT NULL |
| seo_settings | 1 | PK | id | bigint(20) | NOT NULL |
| seo_settings | 2 | FK | tenantId | bigint(20) | NOT NULL |
| seo_settings | 3 | FK | pageId | bigint(20) | NOT NULL |
| seo_settings | 4 | | metaTitle | varchar(255) | NULL |
| seo_settings | 5 | | metaDescription | varchar(255) | NULL |
| seo_settings | 6 | | keywords | text(65535) | NULL |
| seo_settings | 7 | | ogImage | varchar(255) | NULL |
| seo_settings | 8 | | structuredData | json | NULL |
| seo_settings | 9 | | createdAt | timestamp(4) | NOT NULL |
| seo_settings | 10 | | updatedAt | timestamp(4) | NOT NULL |
| storefront_settings | 1 | PK | id | bigint(20) | NOT NULL |
| storefront_settings | 2 | FK | tenantId | bigint(20) | NOT NULL |
| storefront_settings | 3 | | logo | varchar(255) | NULL |
| storefront_settings | 4 | | headerColor | varchar(7) | NULL |
| storefront_settings | 5 | | footerColor | varchar(7) | NULL |
| storefront_settings | 6 | | domain | varchar(255) | NULL |
| storefront_settings | 7 | | googleAnalytics | varchar(255) | NULL |
| storefront_settings | 8 | | facebookPixel | varchar(255) | NULL |
| storefront_settings | 9 | | createdAt | timestamp(4) | NOT NULL |
| storefront_settings | 10 | | updatedAt | timestamp(4) | NOT NULL |
| projects | 1 | PK | id | bigint(20) | NOT NULL |
| projects | 2 | FK | tenantId | bigint(20) | NOT NULL |
| projects | 3 | | name | varchar(255) | NOT NULL |
| projects | 4 | | description | text(65535) | NULL |
| projects | 5 | | createdAt | timestamp(4) | NOT NULL |
| projects | 6 | | updatedAt | timestamp(4) | NOT NULL |
| canvas | 1 | PK | id | bigint(20) | NOT NULL |
| canvas | 2 | FK | tenantId | bigint(20) | NOT NULL |
| canvas | 3 | FK | projectId | bigint(20) | NOT NULL |
| canvas | 4 | | name | varchar(255) | NOT NULL |
| canvas | 5 | | width | int(10) | NOT NULL |
| canvas | 6 | | height | int(10) | NOT NULL |
| canvas | 7 | | backgroundColor | varchar(7) | NULL |
| canvas | 8 | | createdAt | timestamp(4) | NOT NULL |
| canvas | 9 | | updatedAt | timestamp(4) | NOT NULL |

---

## SUBSYSTEM 7: Billing & Subscriptions

| Table Name | Ord | Key | Column Name | Data Type | Nullable |
|---|---|---|---|---|---|
| plans | 1 | PK | id | bigint(20) | NOT NULL |
| plans | 2 | UK | name | varchar(255) | NOT NULL |
| plans | 3 | | description | text(65535) | NULL |
| plans | 4 | | price | decimal(10,2) | NOT NULL |
| plans | 5 | | billingCycle | enum(4) | NOT NULL |
| plans | 6 | | features | json | NULL |
| plans | 7 | | isActive | tinyint(1) | NOT NULL |
| plans | 8 | | displayOrder | int(10) | NOT NULL |
| plans | 9 | | createdAt | timestamp(4) | NOT NULL |
| plans | 10 | | updatedAt | timestamp(4) | NOT NULL |
| subscriptions | 1 | PK | id | bigint(20) | NOT NULL |
| subscriptions | 2 | FK | tenantId | bigint(20) | NOT NULL |
| subscriptions | 3 | FK | planId | bigint(20) | NOT NULL |
| subscriptions | 4 | | status | enum(7) | NOT NULL |
| subscriptions | 5 | | billingCycle | enum(4) | NOT NULL |
| subscriptions | 6 | | periods | int(10) | NOT NULL |
| subscriptions | 7 | | renewalDate | timestamp(4) | NULL |
| subscriptions | 8 | | autoRenew | tinyint(1) | NOT NULL |
| subscriptions | 9 | | unusedBalance | decimal(12,2) | NOT NULL |
| subscriptions | 10 | | pendingUpgradeId | bigint(20) | NULL |
| subscriptions | 11 | | cancellationDate | timestamp(4) | NULL |
| subscriptions | 12 | UK | tenantId, planId | composite | NOT NULL |
| subscriptions | 13 | | createdAt | timestamp(4) | NOT NULL |
| subscriptions | 14 | | updatedAt | timestamp(4) | NOT NULL |
| invoices | 1 | PK | id | bigint(20) | NOT NULL |
| invoices | 2 | FK | subscriptionId | bigint(20) | NOT NULL |
| invoices | 3 | | invoiceNumber | varchar(50) | NOT NULL |
| invoices | 4 | | status | enum(6) | NOT NULL |
| invoices | 5 | | subtotal | decimal(12,2) | NOT NULL |
| invoices | 6 | | tax | decimal(12,2) | NOT NULL |
| invoices | 7 | | discount | decimal(12,2) | NOT NULL |
| invoices | 8 | | total | decimal(12,2) | NOT NULL |
| invoices | 9 | | dueDate | timestamp(4) | NULL |
| invoices | 10 | | paidAt | timestamp(4) | NULL |
| invoices | 11 | | lineItems | json | NULL |
| invoices | 12 | UK | subscriptionId, invoiceNumber | composite | NOT NULL |
| invoices | 13 | | createdAt | timestamp(4) | NOT NULL |
| invoices | 14 | | updatedAt | timestamp(4) | NOT NULL |
| payments | 1 | PK | id | bigint(20) | NOT NULL |
| payments | 2 | FK | subscriptionId | bigint(20) | NOT NULL |
| payments | 3 | FK | invoiceId | bigint(20) | NULL |
| payments | 4 | | status | enum(4) | NOT NULL |
| payments | 5 | | amount | decimal(12,2) | NOT NULL |
| payments | 6 | | currency | varchar(3) | NOT NULL |
| payments | 7 | | paymentMethod | varchar(100) | NULL |
| payments | 8 | | cardBrand | varchar(50) | NULL |
| payments | 9 | | cardLastFour | varchar(4) | NULL |
| payments | 10 | | gatewayId | varchar(255) | NULL |
| payments | 11 | | gatewayResponse | json | NULL |
| payments | 12 | | retryCount | int(10) | NOT NULL |
| payments | 13 | | failureReason | text(65535) | NULL |
| payments | 14 | | idempotencyKey | varchar(255) | NULL |
| payments | 15 | | expiresAt | timestamp(4) | NULL |
| payments | 16 | | verifiedAt | timestamp(4) | NULL |
| payments | 17 | | metadata | json | NULL |
| payments | 18 | | createdAt | timestamp(4) | NOT NULL |
| payments | 19 | | updatedAt | timestamp(4) | NOT NULL |
| usage_records | 1 | PK | id | bigint(20) | NOT NULL |
| usage_records | 2 | FK | subscriptionId | bigint(20) | NOT NULL |
| usage_records | 3 | | metric | varchar(255) | NOT NULL |
| usage_records | 4 | | value | decimal(12,4) | NOT NULL |
| usage_records | 5 | | limit | decimal(12,4) | NULL |
| usage_records | 6 | | percentageUsed | decimal(5,2) | NULL |
| usage_records | 7 | | recordedAt | timestamp(4) | NOT NULL |
| billing_preferences | 1 | PK | id | bigint(20) | NOT NULL |
| billing_preferences | 2 | FK | tenantId | bigint(20) | NOT NULL |
| billing_preferences | 3 | | notifyBeforeRenewal | tinyint(1) | NOT NULL |
| billing_preferences | 4 | | billingEmail | varchar(255) | NULL |
| billing_preferences | 5 | | billingAddress | json | NULL |
| billing_preferences | 6 | | taxId | varchar(50) | NULL |
| billing_preferences | 7 | | autoRenew | tinyint(1) | NOT NULL |
| billing_preferences | 8 | | gcashPhoneNumber | varchar(20) | NULL |
| billing_preferences | 9 | | gcashQrCodeUrl | varchar(255) | NULL |
| billing_preferences | 10 | UK | tenantId | unique | NOT NULL |
| billing_preferences | 11 | | createdAt | timestamp(4) | NOT NULL |
| billing_preferences | 12 | | updatedAt | timestamp(4) | NOT NULL |
| plan_upgrade_requests | 1 | PK | id | bigint(20) | NOT NULL |
| plan_upgrade_requests | 2 | FK | tenantId | bigint(20) | NOT NULL |
| plan_upgrade_requests | 3 | FK | subscriptionId | bigint(20) | NOT NULL |
| plan_upgrade_requests | 4 | FK | paymentId | bigint(20) | NULL |
| plan_upgrade_requests | 5 | | currentPlanId | bigint(20) | NULL |
| plan_upgrade_requests | 6 | | newPlanId | bigint(20) | NULL |
| plan_upgrade_requests | 7 | | status | enum(6) | NOT NULL |
| plan_upgrade_requests | 8 | | amountDue | decimal(12,2) | NOT NULL |
| plan_upgrade_requests | 9 | | prorationDetails | json | NULL |
| plan_upgrade_requests | 10 | | paymentLink | varchar(255) | NULL |
| plan_upgrade_requests | 11 | | approvalNotes | text(65535) | NULL |
| plan_upgrade_requests | 12 | | expiresAt | timestamp(4) | NULL |
| plan_upgrade_requests | 13 | | appliedAt | timestamp(4) | NULL |
| plan_upgrade_requests | 14 | UK | subscriptionId | unique | NOT NULL |
| plan_upgrade_requests | 15 | | requestedAt | timestamp(4) | NOT NULL |
| admin_settings | 1 | PK | id | bigint(20) | NOT NULL |
| admin_settings | 2 | | adminGcashPhoneNumber | varchar(20) | NULL |
| admin_settings | 3 | | adminGcashAccountName | varchar(255) | NULL |
| admin_settings | 4 | | adminGcashQrCodeUrl | varchar(255) | NULL |
| admin_settings | 5 | | createdAt | timestamp(4) | NOT NULL |
| admin_settings | 6 | | updatedAt | timestamp(4) | NOT NULL |

---

## Key Constraints Summary

### Primary Keys (PK)
- Every entity has a `id` field as the primary key (bigint(20))
- Composite primary keys exist for join tables and unique constraints

### Foreign Keys (FK)
- `tenantId` appears on all business entities (Subsystems 2-7) to enforce multi-tenant isolation
- Cross-subsystem relationships: Orders reference Products, Customers; Employees reference Users; Pages reference Users
- All FK relationships use ON DELETE CASCADE for dependent records

### Unique Keys (UK)
- `users.email` - ensures unique email addresses per user
- `tenants.subdomain` - ensures unique subdomain per tenant
- `products.sku` - ensures unique SKU per tenant
- `customers.email` - ensures unique customer email per tenant
- `pages.slug` - ensures unique page slug per tenant
- Composite unique keys on join tables prevent duplicate relationships

### Nullable Fields
- Most timestamp fields are nullable for optional tracking
- Reference fields (FK) can be NULL for soft-delete patterns
- Optional metadata and configuration fields are nullable
- Required business fields (names, prices, quantities) are NOT NULL

---

## Data Type Mapping

| Prisma Type | SQL Type | Usage |
|---|---|---|
| Int | int(10) | Counters, order numbers, small quantities |
| BigInt | bigint(20) | IDs, large numbers, financial amounts (when precision not required) |
| String | varchar(255) | Names, emails, short text |
| String (long) | text(65535) | Descriptions, notes, long content |
| String (very long) | longtext(4294967295) | JSON data, large documents |
| Decimal | decimal(10,2) or decimal(12,2) | Prices, totals, financial calculations |
| Decimal (precise) | decimal(10,4) | Ingredient quantities, usage tracking |
| DateTime | timestamp(4) | Created/updated tracking, event timestamps |
| Date | date | Hire dates, specific date values |
| Boolean | tinyint(1) | Flags (0=false, 1=true) |
| Enum | enum(n) | Status values, roles, types |
| JSON | json | Flexible data (settings, permissions, metadata) |

---

## Multi-Tenancy Implementation

All business entities (Subsystems 2-7) include a `tenantId` foreign key field to:
- Ensure complete data isolation between customers
- Prevent cross-tenant data leakage in queries
- Support row-level security at the database level
- Enable efficient tenant-specific reporting and analytics

Every SQL query against business tables must include a `WHERE tenantId = ?` condition for security.

---

## Audit & Compliance

All tables include timestamp fields for audit purposes:
- `createdAt` - Records when the entity was created
- `updatedAt` - Records when the entity was last modified
- `ActivityLog` - Maintains detailed audit trail of all changes per tenant
- `OrderStatusHistory` - Tracks order state transitions with timestamps
- `PageRevisions` & `PageDesignRevisions` - Version control for page and design changes

This structured design ensures that the BizCore system maintains data consistency, prevents multi-tenant conflicts, enforces business rules through constraints, and provides administrators and developers complete auditability of all system operations.
