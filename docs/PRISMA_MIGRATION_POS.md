# Prisma Migration for POS System

## Database Changes Required

Run the following command to create and apply the migration:

```bash
cd c:/laragon/www/bizcore-v2
npx prisma migrate dev --name add_pos_system
```

This will:

1. Add the `Employee` model with fields for POS staff authentication
2. Add the `POSSession` model for tracking employee shifts and sales
3. Add `employeeId` and `paymentMethod` fields to the `Order` model
4. Create the `EmployeeRole` enum (cashier, manager, admin)

## Manual Steps After Migration

1. Generate Prisma Client:

```bash
npx prisma generate
```

2. Install jsonwebtoken if not already installed:

```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

3. Restart your development server

## Schema Changes Summary

### New Models

- **Employee**: Tenant staff who can access POS
  - Authentication via email/password or PIN
  - Role-based permissions (cashier, manager, admin)
  - Tracked last login times
  
- **POSSession**: Employee shift tracking
  - Opening/closing cash drawer amounts
  - Sales totals per session
  - Active session tracking

### Modified Models

- **Order**: Added `employeeId` and `paymentMethod` fields
- **Tenant**: Added `employees` relation

## Testing the Schema

After migration, test with:

```bash
npx prisma studio
```

This will open Prisma Studio to verify the new tables were created correctly.
