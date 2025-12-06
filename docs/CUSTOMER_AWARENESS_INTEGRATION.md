# Quick Integration Guide: Customer Awareness Features

## How to Use These Components in Your Pages

### 1. On the Home Page
```tsx
// app/storefront/[subdomain]/page.tsx
import { CustomerAwarePageRenderer } from '@/components/storefront/CustomerAwarePageRenderer'

export default async function StorefrontHome({ params }: Props) {
  // ... existing code ...
  
  // When rendering pages, use CustomerAwarePageRenderer instead of PageRenderer:
  return (
    <CustomerAwarePageRenderer
      components={(homePage.publishedContent ?? homePage.content) as ComponentData[]}
      storefront={{...}}
      showCustomerWelcome={true}
      showCustomerStats={true}
    />
  )
}
```

### 2. Track Product Views Automatically
```tsx
// In any product detail page
'use client'

import { useProductViewTracking } from '@/components/storefront/hooks/useProductViewTracking'

export function ProductDetail({ product }: { product: Product }) {
  // This automatically tracks the view
  useProductViewTracking(product.id, product.name, product.slug)
  
  return (
    <div>
      {/* Product content */}
    </div>
  )
}
```

### 3. Show Recently Viewed Products
```tsx
import { RecentlyViewedProducts } from '@/components/storefront/RecentlyViewedProducts'

export function ProductsPage({ storefront }: { storefront: StorefrontContext }) {
  return (
    <div>
      <RecentlyViewedProducts storefront={storefront} limit={5} />
      {/* Other product content */}
    </div>
  )
}
```

### 4. Use Individual Components
```tsx
// Just the welcome banner (top of pages)
import { CustomerWelcome } from '@/components/storefront/CustomerWelcome'

// Just customer stats (sidebar or below welcome)
import { CustomerStats } from '@/components/storefront/CustomerStats'

export function PageWithCustomerAwareness() {
  return (
    <div>
      <CustomerWelcome />
      <CustomerStats />
      {/* Page content */}
    </div>
  )
}
```

### 5. Access Customer Data Directly
```tsx
'use client'

import { useCustomer } from '@/components/storefront/hooks/useCustomer'

export function MyComponent() {
  const { customer, isLoading, error, isLoggedIn } = useCustomer()
  
  if (isLoading) return <div>Loading...</div>
  if (!isLoggedIn) return <div>Please log in</div>
  
  return (
    <div>
      <h2>Welcome {customer?.name}!</h2>
      <p>You've made {customer?.totalOrders} orders totaling ${customer?.totalSpent}</p>
      <p>Your addresses: {customer?.address?.length || 0}</p>
    </div>
  )
}
```

## What's Already Integrated

### ✅ HeaderSection.tsx
- Shows customer name in account menu
- Shows customer name instead of "My Account" label
- Hides auth buttons on auth pages (already implemented in previous session)

### ✅ CartView.tsx
- Shows personalized greeting for logged-in customers
- Shows signup incentive for non-logged-in customers
- Encourages users to sign in to save payment methods

### ✅ API Endpoints
- `/api/customers/[id]` now returns:
  - `totalOrders` - how many orders customer has
  - `totalSpent` - total amount spent
  - `lastOrderDate` - most recent order date

## Testing the Features

### 1. Test as New User
- Visit home page (not signed in)
- Should see: "Welcome to our store!" banner with signup button
- Should NOT see customer stats
- Should NOT see recently viewed products

### 2. Test as Returning Customer
- Sign in as customer with order history
- Visit home page
- Should see: "Welcome back, [FirstName]!" 
- Should see customer stats with order count
- Should see recently viewed products section

### 3. Test Product View Tracking
- Sign in as any customer
- Open browser DevTools (F12)
- Go to Application → Local Storage
- Navigate to different products
- Watch `storefront_viewed_products` grow
- Go to products page and see recently viewed section update

### 4. Test Cart Personalization
- Go to cart while logged in
- Should see: "Hi [Name], ready to checkout?"
- Go to cart while not logged in
- Should see: "Save time at checkout" banner with sign in link

### 5. Test Header
- Sign in
- Check header - should show user's first name instead of "My Account"
- Sign out
- Header should show "Sign in" and "Sign up" buttons

## Browser Storage

Product view history is stored in localStorage under:
```
storefront_viewed_products
```

Format: JSON array
```json
[
  {
    "id": 1,
    "name": "Product Name",
    "slug": "product-slug",
    "timestamp": 1700123456789
  }
]
```

To clear this data:
```javascript
// In browser console
localStorage.removeItem('storefront_viewed_products')
```

## Performance Notes

- ✅ Customer data cached in React state
- ✅ Product views stored locally (no API calls)
- ✅ Components lazy load data with loading states
- ✅ Animations are GPU-optimized with Framer Motion
- ✅ No unnecessary re-renders

## Troubleshooting

### Customer data not loading?
- Check if `/api/customers/[id]` is returning correct format
- Check if user is properly authenticated (useSession returns data)
- Check console for fetch errors

### Recently viewed not showing?
- Check browser localStorage is enabled
- Check that useProductViewTracking is being called in product pages
- Clear localStorage and browse some products

### Stats not updating?
- API response should have totalOrders, totalSpent, lastOrderDate
- Check if customer has orders in database
- Try refreshing the page

## Next Steps

To fully leverage customer awareness:
1. Add product views to cart recommendations
2. Show "Customers who bought X also bought Y"
3. Add wishlist feature
4. Show personalized promotions based on purchase history
5. Add loyalty program integration
