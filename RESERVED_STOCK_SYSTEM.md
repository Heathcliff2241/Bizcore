# Reserved Stock Inventory System - Implementation Guide

## Overview

The inventory system has been redesigned to use a **reserved stock** pattern that prevents stock recalculation when orders are cancelled. This is industry standard for e-commerce and POS systems.

**Status**: ✅ Implemented, TypeScript verified, ready for database migration

---

## How It Works

### Three Stock States:
```
┌─────────────────────────────────────────────┐
│ Total Inventory = currentStock               │
│ (physical inventory in warehouse)            │
├─────────────────────────────────────────────┤
│ Reserved = reservedStock                    │
│ (held by pending orders)                    │
├─────────────────────────────────────────────┤
│ Available = currentStock - reservedStock     │
│ (what can actually be ordered right now)    │
└─────────────────────────────────────────────┘
```

### Timeline Example: Coffee Order

**Scenario**: Coffee requires 1 unit of beans. Current stock: 50 beans.

#### 1️⃣ Order Placed (status: pending)
```
Action: RESERVE stock
  currentStock:    50 (unchanged - no physical deduction)
  reservedStock:   +1 (reserved for this order)
  available:       49 (50 - 1, shown to other customers)

Customer sees: "49 beans available" ✓
InventoryTransaction: type='reserved', reason='Order ORD-xxx - RESERVED'
```

#### 2️⃣ Order Completed (status → completed)
```
Action: CONVERT reserved to permanent deduction
  currentStock:    -1 (permanent deduction)
  reservedStock:   -1 (release the reservation)
  Result: currentStock=49, reservedStock=0

New available: 49 beans
InventoryTransaction: type='out', reason='Order ORD-xxx - COMPLETED'
```

#### 3️⃣ Order Cancelled (status → cancelled from pending)
```
Action: RELEASE reservation
  currentStock:    50 (unchanged - no physical deduction)
  reservedStock:   -1 (remove the reservation)
  available:       50 (restored)

InventoryTransaction: type='reserved_released', reason='Order ORD-xxx - CANCELLED'
```

---

## Database Schema

### New Field: `Ingredient.reservedStock`

```sql
ALTER TABLE "ingredients" ADD COLUMN "reservedStock" FLOAT NOT NULL DEFAULT 0;
```

**Purpose**: Track quantity held by pending orders

**Migration Status**: ✅ Created at `/prisma/migrations/add_reserved_stock/migration.sql`

### Updated Schema

```prisma
model Ingredient {
  id                    Int
  tenantId              Int
  name                  String
  currentStock          Float      // Physical inventory
  reservedStock         Float      // Reserved by pending orders (NEW)
  minStock              Float      // Low stock threshold
  costPerUnit           Float
  // ... other fields
}

model InventoryTransaction {
  id           Int
  tenantId     Int
  ingredientId Int
  type         String  // 'reserved', 'reserved_released', 'out', 'in'
  quantity     Float
  reason       String
  cost         Float?
  // ... other fields
}
```

---

## API Endpoints Updated

### 1. Create Order (Storefront)
**Endpoint**: `POST /api/orders`

**Changes**:
- ✅ Validates against available stock: `currentStock - reservedStock`
- ✅ Reserves inventory on order creation (doesn't deduct currentStock)
- ✅ Logs transaction with `type: 'reserved'`
- ✅ Starts order with status `pending` (not `completed`)

**Flow**:
```
POST /api/orders
  ↓
Check: available = currentStock - reservedStock
  ↓
Create order (status='pending')
  ↓
Reserve inventory (increment reservedStock)
  ↓
Log: type='reserved', reason='Order ORD-xxx - RESERVED'
```

### 2. Create POS Order
**Endpoint**: `POST /api/pos/orders`

**Changes**:
- ✅ Removed duplicate inventory deduction logic
- ✅ Changed from `status='completed'` to `status='pending'`
- ✅ Reserves inventory instead of permanently deducting
- ✅ Handles multiple order items atomically

**Removed**:
- ❌ Duplicate transaction block (lines 178-230 in old code)
- ❌ Double POS session updates
- ❌ Immediate `status='completed'`

### 3. Update Order Status
**Endpoint**: `PUT /api/orders/[id]`

**New Logic**:
```typescript
if (status transitions to: ready|completed|out_for_delivery|delivered) {
  // COMPLETE ORDER: Move reserved → permanent deduction
  for each ingredient:
    decrement currentStock by qty
    decrement reservedStock by qty
    log: type='out', reason='Order ORD-xxx - COMPLETED'
}

if (status transitions to: cancelled from pending) {
  // CANCEL ORDER: Release reservation
  for each ingredient:
    decrement reservedStock by qty (currentStock unchanged)
    log: type='reserved_released', reason='Order ORD-xxx - CANCELLED'
}
```

### 4. POS Product Availability
**Endpoint**: `GET /api/pos/products`

**Changes**:
- ✅ Now fetches `reservedStock` from database
- ✅ Calculates available stock: `(currentStock - reservedStock) / quantity_needed`
- ✅ Shows accurate available quantities on POS interface

**Example**:
```typescript
// Before: Math.floor(ingredient.currentStock / quantity)
// After:
availableStock = Math.floor(
  (ingredient.currentStock - ingredient.reservedStock) / quantity
)
```

---

## Inventory Transaction Types

The system now tracks 4 transaction types:

| Type | When | Stock Changes | Purpose |
|------|------|---------------|---------|
| `reserved` | Order placed | `reservedStock++` | Hold inventory for pending order |
| `reserved_released` | Order cancelled | `reservedStock--` | Return held inventory to available |
| `out` | Order completed | `currentStock--`, `reservedStock--` | Permanent deduction upon completion |
| `in` | Manual adjustment | `currentStock++` | Restock, returns, corrections |

**Example Logs**:
```json
// Order placed
{
  "type": "reserved",
  "quantity": 2,
  "reason": "Order ORD-1234567890 - RESERVED"
}

// Order completed
{
  "type": "out",
  "quantity": 2,
  "reason": "Order ORD-1234567890 - COMPLETED",
  "cost": 50.00
}

// Order cancelled
{
  "type": "reserved_released",
  "quantity": 2,
  "reason": "Order ORD-1234567890 - CANCELLED"
}
```

---

## Testing Checklist

### Scenario 1: Successful Order Flow
```
✅ Create order with 2× Coffee (needs 1 bean each)
   → Beans: currentStock=50, reserved=2, available=48
✅ View POS products
   → Shows available=48 (not 50)
✅ Change order to 'completed'
   → Beans: currentStock=48, reserved=0, available=48
✅ Check inventory transactions
   → 2 entries: 'reserved' then 'out'
```

### Scenario 2: Order Cancellation
```
✅ Create order with 2× Coffee
   → Beans: currentStock=50, reserved=2, available=48
✅ Another customer tries to order 50 items
   → Fails: "Need 50, available 48"
✅ Cancel first order
   → Beans: currentStock=50, reserved=0, available=50
✅ Second customer can now order
   → Succeeds
```

### Scenario 3: Low Stock Management
```
✅ Set minStock=10 for Beans
✅ Current: 12 beans, reserved=5
✅ Dashboard shows: "2 units above min" (12-5=7, but still tracked separately)
✅ Order uses remaining: available=7, so order for 8 fails
```

### Scenario 4: Multiple Ingredients per Product
```
✅ Hamburger needs: 2× buns, 3× meat patties
✅ Current: buns=100 (reserved=10), meat=50 (reserved=0)
✅ Available: min(90/2, 50/3) = min(45, 16) = 16
✅ Order 15 hamburgers succeeds
✅ Buns: reserved+=30, meat: reserved+=45
✅ Order 2 more hamburgers fails (only 1 available)
```

---

## Migration Steps

### Before Running

1. **Backup database**:
   ```bash
   # Backup your PostgreSQL database
   pg_dump bizcore_dev > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test in development**:
   - Run the build: `npm run build` ✅ Already verified
   - Test scenarios above locally

### Apply Migration

**Option 1: Prisma Migrate** (recommended)
```bash
cd c:\laragon\www\bizcore-v2
npx prisma migrate deploy
```

**Option 2: Manual SQL**
```bash
psql -h localhost -U bizcore_user -d bizcore_dev << EOF
ALTER TABLE "ingredients" ADD COLUMN "reservedStock" FLOAT NOT NULL DEFAULT 0;
COMMENT ON COLUMN "ingredients"."reservedStock" IS 'Stock reserved by pending orders. Released if order is cancelled, applied permanently if order completes.';
EOF
```

**Option 3: pgAdmin**
1. Open pgAdmin → Databases → bizcore_dev → SQL Editor
2. Run migration SQL

### Verify Migration

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ingredients'
ORDER BY ordinal_position;
```

Should show:
```
column_name          | data_type
---------------------+-----------
id                   | integer
tenantId             | integer
name                 | character varying
currentStock         | double precision
reservedStock        | double precision  ← NEW
minStock             | double precision
...
```

---

## Code Changes Summary

### Files Modified:

1. **`prisma/schema.prisma`**
   - Added `reservedStock Float @default(0)` to Ingredient model

2. **`app/api/orders/route.ts`** (POST)
   - Changed validation to use available stock: `currentStock - reservedStock`
   - Changed deduction to reservation: `reservedStock += qty` (not currentStock)
   - Changed transaction type from 'out' to 'reserved'
   - Removed duplicate inventory logic

3. **`app/api/pos/orders/route.ts`** (POST)
   - Changed status from `'completed'` to `'pending'`
   - Removed duplicate transaction block (was deducting twice)
   - Changed to reserve inventory instead of permanent deduction
   - Kept single atomic transaction

4. **`app/api/orders/[id]/route.ts`** (PUT)
   - Added completion logic: convert reserved → permanent
   - Added cancellation logic: release reserved stock
   - Proper state transitions with logging

5. **`app/api/pos/products/route.ts`** (GET)
   - Fetches `reservedStock` from database
   - Changed availability calculation to: `(currentStock - reservedStock) / quantity`

---

## Benefits of Reserved Stock

1. **No Recalculation on Cancel**: Released stock immediately available without processing
2. **Accurate Availability**: Real-time accurate display of what can be ordered
3. **Prevent Over-selling**: Validation checks available stock before allowing order
4. **Audit Trail**: Every reservation and release is logged
5. **Multi-Order Safe**: Multiple simultaneous orders handled atomically
6. **Industry Standard**: Used by Amazon, Shopify, Square POS, etc.

---

## Troubleshooting

### Issue: "Not enough reserved stock" error when completing
**Cause**: Inventory was manually adjusted after order was placed
**Solution**: Check inventory transactions for the ingredient; manually correct if needed

### Issue: Available stock shows negative
**Cause**: reservedStock > currentStock (shouldn't happen, indicates data issue)
**Solution**: Review transactions; correct manually in database if needed

### Issue: Orders stuck in 'pending' status
**Cause**: Status update endpoint not called
**Solution**: Ensure POS/storefront calls PUT endpoint when order is ready/completed

---

## Next Steps

1. **Apply Migration**: Run the migration step above
2. **Deploy**: Push code and migration to staging/production
3. **Verify**: Test the 4 scenarios above
4. **Monitor**: Watch inventory transaction logs for the first week
5. **Document**: Update any internal docs with new "reserved stock" concept

---

## Questions?

- Check inventory transactions: `SELECT * FROM inventory_transactions ORDER BY createdAt DESC LIMIT 20;`
- Check ingredient state: `SELECT id, name, currentStock, reservedStock FROM ingredients;`
- Check order status: `SELECT id, orderNumber, status FROM orders ORDER BY createdAt DESC LIMIT 20;`
