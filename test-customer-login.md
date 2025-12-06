# Customer Login Test Guide

## Issue Analysis
The customer login should now work with the consolidated authentication system. The changes made:

1. **Merged Auth Logic**: Combined `customer-credentials` provider into main `lib/auth.ts`
2. **Updated Session Provider**: Removed custom `basePath` for customer sessions
3. **Fixed Type Definitions**: Added `tenantId` and `subdomain` to User interface

## Test Credentials

### For "olaf" Tenant
- **URL**: http://localhost:3000/storefront/olaf/signin
- **Email**: `customer@olaf.local`
- **Password**: `password123`

### For "advena" Tenant  
- **URL**: http://localhost:3000/storefront/advena/signin
- **Email**: `john@example.com`
- **Password**: `password123`

## Troubleshooting Steps

### 1. Verify Database Has Customers
Run in terminal:
```powershell
npx prisma studio
```
Then navigate to the `Customer` model and verify the test customers exist.

### 2. Check Console Logs
When attempting to log in, open browser DevTools (F12) and check:
- **Network tab**: Look for POST request to `/api/auth/callback/customer-credentials`
- **Console tab**: Look for any JavaScript errors

### 3. Check Server Logs
In the terminal running `npm run dev`, look for these log messages:
- `[CUSTOMER AUTH] authorize() called with email: ...`
- `[CUSTOMER AUTH] Tenant lookup for subdomain: ...`
- `[CUSTOMER AUTH] Customer lookup for email: ...`
- `[CUSTOMER AUTH] Authentication successful for: ...`

### 4. Common Issues

#### "Tenant not found"
- Make sure you're using the correct subdomain (`olaf` or `advena`)
- Check that the tenant exists in the database

#### "Customer not found or no password"  
- Verify the customer exists in the database
- Check that the customer has a hashed password
- Ensure the customer is active (`isActive: true`)

#### "Invalid password"
- Double-check you're using `password123`
- The password should be hashed with bcrypt in the database

#### No error but login doesn't work
- Check that the session provider is set up correctly
- Verify NextAuth is using the correct auth options
- Clear browser cookies and try again

## Expected Behavior
1. Enter credentials on signin page
2. Submit form
3. Server validates credentials
4. Creates session with customer role
5. Redirects to `/storefront/{subdomain}/account`
6. Account page displays customer information

## Debug Commands

### Check if server is running
```powershell
curl http://localhost:3000
```

### Test auth endpoint directly
```powershell
curl -X POST http://localhost:3000/api/auth/signin/customer-credentials `
  -H "Content-Type: application/json" `
  -d '{"email":"customer@olaf.local","password":"password123","subdomain":"olaf"}'
```

### View database customers
```powershell
npx prisma studio
```
