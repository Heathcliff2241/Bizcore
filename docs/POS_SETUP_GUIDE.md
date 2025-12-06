# POS System Setup Guide

This guide covers the complete setup of the Point of Sale (POS) system for BizCore tenants.

## Overview

The POS system allows tenant owners to:

- Add employees who can access the POS
- Manage employee roles and permissions
- Track sales through employee shifts
- Process orders with different payment methods
- Theme the POS interface to match their brand

## 1. Database Migration

First, run the Prisma migration to create the necessary tables:

```bash
cd c:/laragon/www/bizcore-v2
npx prisma migrate dev --name add_pos_system
npx prisma generate
```

## 2. Install Dependencies

Install jsonwebtoken for POS authentication:

```bash
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

## 3. File Structure

The POS system consists of:

### API Routes

- `/api/employees` - Employee CRUD operations
- `/api/employees/[id]` - Single employee operations
- `/api/pos/auth/login` - Employee authentication
- `/api/pos/sessions` - POS session management
- `/api/pos/orders` - POS order creation and retrieval

### Dashboard Pages

- `/dashboard/settings/employees` - Employee management UI

### Storefront Pages

- `/[subdomain]/pos/login` - Employee login
- `/[subdomain]/pos` - Main POS interface

## 4. Features

### For Tenant Owners (Dashboard)

Navigate to **Dashboard → Settings → Employees** to:

- Add new POS employees
- Set employee roles (Cashier, Manager, Admin)
- Create optional PINs for quick login
- Activate/deactivate employees
- View employee login history

### For Employees (Storefront POS)

Access via `yourstore.example.com/pos/login`:

1. **Login**: Use email + password or email + PIN
2. **Start Shift**: Opens a POS session with opening cash
3. **Process Orders**:
   - Browse products by category
   - Add items to cart
   - Adjust quantities
   - Select payment method (Cash, Card, Digital)
   - Complete transaction
4. **End Shift**: Close session and reconcile cash

### POS Features

✅ **Product Management**

- Real-time product catalog
- Category filtering
- Search functionality
- Product images and pricing

✅ **Cart Operations**

- Add/remove items
- Quantity adjustments
- Real-time price calculations
- Tax calculations (10% default)

✅ **Payment Processing**

- Multiple payment methods
- Order numbering
- Receipt generation ready
- Order history tracking

✅ **Session Management**

- Cash drawer tracking
- Sales totals per shift
- Employee activity logs

✅ **Security**

- JWT-based authentication
- Role-based access control
- Session expiration (12 hours)
- Tenant isolation

## 5. Theming (Future Enhancement)

The POS will inherit tenant theme colors from:

```typescript
// In tenant settings
{
  primaryColor: '#1e40af',
  secondaryColor: '#059669',
  // POS-specific overrides
  posTheme: {
    headerBg: '#1e40af',
    buttonColor: '#059669',
    // etc.
  }
}
```

## 6. Usage Workflow

### Adding First Employee

1. Login as tenant owner
2. Go to Dashboard → Settings → Employees
3. Click "Add Employee"
4. Fill in details:
   - First Name: John
   - Last Name: Doe
   - Email: <john@yourstore.com>
   - Password: securePassword123
   - PIN: 1234 (optional, for quick login)
   - Role: Cashier
5. Click "Add Employee"

### Employee First Login

1. Go to `yourstore.example.com/pos/login`
2. Enter email: <john@yourstore.com>
3. Switch to "PIN Login" tab
4. Enter PIN: 1234
5. Click "Login to POS"

### Processing First Sale

1. After login, POS interface opens
2. Click on products to add to cart
3. Adjust quantities with +/- buttons
4. Select payment method
5. Click "Charge $XX.XX" to complete
6. Order is created and cart clears

## 7. API Authentication

For custom integrations, POS API uses Bearer tokens:

```javascript
// Login
const response = await fetch('/api/pos/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subdomain: 'mystore',
    email: 'employee@store.com',
    pin: '1234'
  })
})

const { token } = await response.json()

// Use token for POS operations
fetch('/api/pos/orders', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

## 8. Security Notes

- Passwords are bcrypt hashed (10 rounds)
- PINs are also hashed for security
- JWT tokens expire after 12 hours
- Employees can only access their tenant's data
- Only tenant owners can manage employees

## 9. Database Schema

### Employee Table

```prisma
model Employee {
  id          Int          @id @default(autoincrement())
  tenantId    Int
  firstName   String
  lastName    String
  email       String
  password    String       // Bcrypt hashed
  pin         String?      // Bcrypt hashed, optional
  role        EmployeeRole // cashier, manager, admin
  isActive    Boolean      @default(true)
  lastLogin   DateTime?
}
```

### POSSession Table

```prisma
model POSSession {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  tenantId        Int
  startTime       DateTime  @default(now())
  endTime         DateTime?
  openingCash     Float     @default(0)
  closingCash     Float?
  totalSales      Float     @default(0)
  totalOrders     Int       @default(0)
  isActive        Boolean   @default(true)
}
```

## 10. Next Steps

- [ ] Run database migration
- [ ] Add your first employee
- [ ] Test POS login
- [ ] Process a test order
- [ ] Customize POS theme colors (optional)
- [ ] Set up receipt printing (future)
- [ ] Configure tax rates per region (future)

## Support

For issues or questions:

1. Check the logs in browser console
2. Verify database migration ran successfully
3. Ensure employee is active and has correct permissions
4. Check that tenant is active

## Roadmap

Future enhancements:

- [ ] Receipt printing via thermal printer or PDF
- [ ] Offline mode with sync
- [ ] Multi-location support
- [ ] Advanced reporting and analytics
- [ ] Customer loyalty program integration
- [ ] Inventory auto-deduction
- [ ] Shift reports with cash reconciliation
- [ ] Split payments
- [ ] Discounts and coupons
- [ ] Tips handling
