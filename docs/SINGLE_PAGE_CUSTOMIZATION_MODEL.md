# Single-Page Tenant Customization Model

## Architecture Change

Tenants can now **only customize their landing page** via BrandStudio. All other routes are fixed system pages.

## Route Structure

### Landing Page (Customizable)
- **Route**: `/storefront/[tenant]`
- **Customizable**: ✅ Yes (via BrandStudio)
- **Purpose**: Brand's complete homepage design
- **Who Controls**: Tenant via BrandStudio page builder
- **Content**: Any components the tenant designs (header, hero, CTA, etc.)

### Fixed System Pages (Non-Customizable)
- **`/storefront/[tenant]/menu`** - Product listing
  - Fixed layout showing all active products
  - Products managed in POS admin
  
- **`/storefront/[tenant]/cart`** - Shopping cart
  - Fixed UI for cart management
  - Managed by system
  
- **`/storefront/[tenant]/checkout`** - Order checkout
  - Fixed checkout flow
  - Managed by system
  
- **`/storefront/[tenant]/account`** - Customer account
  - Profile, orders, addresses
  - Managed by system
  
- **`/storefront/[tenant]/contact`** - Contact form
  - Fixed contact form
  - Managed by system

- **Auth Routes** - Sign in, sign up, forgot password, reset password
  - Fixed auth flows
  - Managed by system

## What Changed

### Removed
- ✅ `/storefront/[tenant]/[slug]` - Dynamic slug routing removed
- ✅ `/storefront/[tenant]/products` - Moved to `/menu`
- ✅ Multiple customizable pages - Only landing page can be customized now

### Added/Updated
- ✅ Simplified home page (`page.tsx`) - Only looks for one published landing page
- ✅ Menu page (`/menu/page.tsx`) - Fixed products listing
- ✅ All component references updated from `/products` to `/menu`

## Benefits

1. **Simpler Model**: Tenants focus on one landing page design
2. **Consistent Navigation**: All storefronts have predictable URLs
3. **Better Control**: System manages transactional pages (cart, checkout, account)
4. **Clearer Intent**: Landing page = brand presence, other pages = functionality
5. **Easier Maintenance**: Fewer customization points to manage

## How It Works

### Tenant Publishing a Landing Page
1. Tenant creates page design in BrandStudio
2. Designs landing page with header, hero, sections, footer
3. Publishes the page
4. Automatically becomes homepage at `/storefront/[tenant]`

### First-Time Visit (No Landing Page Published)
- Shows default welcome message
- Tenant can start designing via BrandStudio

### Customer Journey
```
Tenant's Landing Page (/storefront/[tenant])
    ↓
Menu (/storefront/[tenant]/menu)
    ↓
Cart (/storefront/[tenant]/cart)
    ↓
Checkout (/storefront/[tenant]/checkout)
    ↓
Account (/storefront/[tenant]/account) [if logged in]
```

## For Tenants

### Creating Their Storefront
1. Go to BrandStudio
2. Create a landing page design
3. Add header, hero section, product showcase, CTA
4. Publish the page
5. Their storefront is live!

### Menu/Products
- Products are managed in the POS system
- Automatically shown at `/storefront/[tenant]/menu`
- Customers can browse and add to cart

### Transactional Pages
- Cart, checkout, account pages are system-managed
- Consistent experience across all storefronts
- No customization needed

## Component References Updated

All storefront components now reference `/menu` instead of `/products`:
- ✅ `HeaderSection.tsx` - Menu link
- ✅ `FooterSection.tsx` - Menu link
- ✅ `CartView.tsx` - Continue shopping → /menu
- ✅ `CustomerWelcome.tsx` - View menu → /menu
- ✅ `RecentlyViewedProducts.tsx` - Product links → /menu
- ✅ `ProductGrid.tsx` - Product links → /menu

## Migration Notes

If you had existing multi-page designs:
1. The landing page design is preserved
2. Dynamic pages (`/[slug]`) are no longer accessible
3. Tenants should consolidate their brand story into the landing page
4. Product showcase should happen on the landing page

## Future Enhancements

Potential additions without changing this model:
- Landing page sections for featured products
- Blog page (fixed route `/blog`)
- FAQ page (fixed route `/faq`)
- But only `/storefront/[tenant]` is customizable

This keeps the system simple while giving tenants complete creative control over their brand presence.
