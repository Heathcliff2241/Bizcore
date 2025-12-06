# Changes Summary - Authentication Consolidation & Storefront Fixes

## Overview
Consolidated the customer authentication logic into the main NextAuth configuration to resolve login issues and fix type errors across the storefront.

## 1. Authentication System
*   **Consolidated Auth Logic**: Merged `lib/customerAuth.ts` logic into `lib/auth.ts`.
    *   Added `customer-credentials` provider to `authOptions`.
    *   Updated `jwt` and `session` callbacks to handle customer roles, tenant IDs, and subdomains.
*   **Providers**: Updated `lib/providers.tsx` to use the standard auth session provider without a custom base path for customers.
*   **Cleanup**: Removed `app/api/customer-auth` directory as it is no longer needed.

## 2. Database & Schema
*   **Product Model**: Added `slug` field to the `Product` model in `prisma/schema.prisma` to support SEO-friendly URLs.
*   **Prisma Client**: Regenerated Prisma client (`npx prisma generate`).

## 3. Storefront Pages (Next.js 15 Compatibility)
Updated several pages to handle `params` as a `Promise`, which is required in newer Next.js versions.

*   `app/storefront/[subdomain]/layout.tsx`
*   `app/storefront/[subdomain]/page.tsx`
*   `app/storefront/[subdomain]/products/[slug]/page.tsx`
*   `app/storefront/[subdomain]/account/addresses/page.tsx`

## 4. Component Fixes
*   **FooterSection**: Added `companyName` prop and fixed JSX structure errors.
*   **AccountContent**: Fixed prop passing to child components (`ProfileContent`, `OrdersContent`, `AddressesContent`).
*   **AddressesContent**: Updated to accept `customer` prop.
*   **MenuWithCategories**: Fixed syntax errors (extra closing tags).
*   **Component Registry**: Fixed duplicate keys in `components/storefront/index.ts`.

## 5. API Route Fixes
*   **Orders API** (`app/api/orders/[id]/route.ts`): Removed invalid reference to `stockQuantity` on the Product model.
*   **POS Orders API** (`app/api/pos/orders/route.ts`): Fixed TypeScript errors related to Zod error handling and array typing.

## 6. Account & Addresses
*   **Account Page**: Updated to use `getServerSession(authOptions)` instead of the separate customer auth options.
*   **Addresses Page**: Fixed logic to read address from the `Customer` model's JSON `address` field instead of a non-existent `Address` table.
