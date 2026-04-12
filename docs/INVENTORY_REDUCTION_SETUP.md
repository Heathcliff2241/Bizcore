# Products × Ingredients Reduction Setup

## Current Implementation

The system has **fully implemented automatic ingredient stock reduction** after every order is placed. Here's how it works:

---

## 1. POS Orders (`/api/pos/orders/route.ts`)

### Flow:
When a POS order is created, the system:

1. **Creates the order** with all items (lines 89-111)
2. **Deducts ingredient stock atomically** in a transaction (lines 113-175)

### Reduction Logic (lines 113-175):

```typescript
// For each item in the order
for (const item of items) {
  // Get the product with all its ingredients
  const product = await tx.product.findUnique({
    where: { id: item.productId },
    include: { productIngredients: true }
  })

  // For each ingredient in the product
  if (product.productIngredients) {
    for (const pi of product.productIngredients) {
      // Calculate how much ingredient to deduct
      const deductQty = pi.quantity * item.quantity
      // e.g., if coffee needs 1 unit of beans, and order is for 2 coffees
      // then deduct 2 units of beans

      // Validate stock is available
      const ingredient = await tx.ingredient.findUnique({ 
        where: { id: pi.ingredientId } 
      })
      if (ingredient.currentStock < deductQty) {
        throw new Error(`Insufficient stock for ${ingredient.name}`)
      }

      // Deduct from ingredient stock
      await tx.ingredient.update({
        where: { id: pi.ingredientId },
        data: { currentStock: { decrement: deductQty } }
      })

      // Log the transaction
      await tx.inventoryTransaction.create({
        data: {
          tenantId: decoded.tenantId,
          ingredientId: pi.ingredientId,
          type: 'out',
          quantity: deductQty,
          reason: `POS Order ${orderNumber}`,
          performedBy: decoded.employeeId
        }
      })
    }
  }
}
```

### Key Features:
- ✅ **Atomic transaction**: All reductions happen together or rollback if any fails
- ✅ **Validation**: Checks ingredient stock before deducting
- ✅ **Audit trail**: Creates `inventoryTransaction` record for each deduction
- ✅ **Error handling**: Rejects order if insufficient stock

### Issue in Current Code:
⚠️ **Duplicate deduction logic** (lines 113-175 AND lines 178-230)
- The same reduction loop runs twice in the same transaction
- This causes **ingredients to be deducted TWICE** per order
- **Action needed**: Remove the duplicate code block (lines 178-230)

---

## 2. Regular Orders (`/api/orders/route.ts`)

### Flow:
When a storefront order is created, the system:

1. **Validates ingredient stock** (lines 113-147)
2. **Creates the order** in a transaction (lines 157-205)
3. **Deducts ingredient stock** within the same transaction (lines 207-216)

### Reduction Logic (lines 207-216):

```typescript
// Deduct inventory for each ingredient
for (const [ingId, qtyNeeded] of ingredientUsage.entries()) {
  const ing = ingredients.find((v) => v.id === ingId)
  if (!ing) continue
  
  // Deduct from ingredient stock
  await tx.ingredient.update({ 
    where: { id: ingId }, 
    data: { currentStock: { decrement: qtyNeeded } } 
  })

  // Log the transaction
  await tx.inventoryTransaction.create({ 
    data: { 
      tenantId: tenant.id, 
      ingredientId: ingId, 
      type: 'out', 
      quantity: Number(qtyNeeded), 
      reason: `Order ${order.id}`, 
      cost: Number(ing.costPerUnit ?? 0) * Number(qtyNeeded), 
      performedBy: null 
    } 
  })
}
```

### Key Features:
- ✅ **Pre-validation**: Checks all ingredient stock before creating order
- ✅ **Single deduction**: Only happens once per order
- ✅ **Cost tracking**: Records cost in inventory transaction
- ✅ **Atomic transaction**: All operations happen together

---

## 3. Order Status Updates (`/api/orders/[id]/route.ts`)

### Flow:
When an order status changes to a "deductible" status (ready, completed, out_for_delivery, delivered), it deducts ingredients again.

### Reduction Logic (lines 150-193):

```typescript
const deductibleStatuses = ['ready', 'completed', 'out_for_delivery', 'delivered']
const currentStatus = currentOrder.status

// Only deduct if transitioning FROM non-deductible TO deductible status
if (deductibleStatuses.includes(order_status) && !deductibleStatuses.includes(currentStatus)) {
  await prisma.$transaction(async (tx) => {
    for (const orderItem of currentOrder.orderItems) {
      const product = await tx.product.findUnique({ 
        where: { id: orderItem.productId }, 
        include: { productIngredients: true } 
      })

      if (product.productIngredients && product.productIngredients.length > 0) {
        for (const pi of product.productIngredients) {
          const deductQty = pi.quantity * orderItem.quantity
          
          // Deduct from ingredient stock
          await tx.ingredient.update({ 
            where: { id: pi.ingredientId }, 
            data: { currentStock: { decrement: deductQty } } 
          })

          // Log the transaction
          await tx.inventoryTransaction.create({
            data: { 
              tenantId: tenant.id, 
              ingredientId: pi.ingredientId, 
              type: 'out', 
              quantity: deductQty, 
              reason: `Order ${currentOrder.orderNumber}` 
            }
          })
        }
      }
    }
  })
}
```

### Key Features:
- ✅ **State-aware**: Only deducts when transitioning to deductible status
- ✅ **Prevents double-deduction**: Checks current status
- ✅ **Delayed reduction**: Can track inventory differently for pending vs completed orders

---

## Database Tables Used

### `Ingredient`
- `id` (integer, primary key)
- `tenantId` (integer)
- `name` (string)
- `currentStock` (decimal)
- `unit` (string)
- `minStock` (decimal)
- `costPerUnit` (decimal)

### `ProductIngredient` (junction table)
- `productId` (integer, foreign key)
- `ingredientId` (integer, foreign key)
- `quantity` (decimal) - how much of ingredient needed per 1 unit of product

### `InventoryTransaction` (audit log)
- `id` (integer, primary key)
- `tenantId` (integer)
- `ingredientId` (integer)
- `type` ('in' | 'out')
- `quantity` (decimal)
- `reason` (string)
- `cost` (decimal, optional)
- `performedBy` (integer, optional)
- `createdAt` (timestamp)

---

## Example Flow

**Scenario**: Customer orders 2× Coffee (requires 1 unit of beans each)

### Before Order:
```
Ingredient: Beans
- currentStock: 50 units
```

### Order Placement:
```typescript
items = [{ productId: 1, quantity: 2 }]
product = Coffee { productIngredients: [{ ingredientId: 1, quantity: 1 }] }

// Calculate deduction
deductQty = 1 (ingredient qty) × 2 (order qty) = 2 units
```

### After Order:
```
Ingredient: Beans
- currentStock: 48 units (50 - 2)

InventoryTransaction:
- type: 'out'
- ingredientId: 1
- quantity: 2
- reason: 'POS Order POS-1733401234-456'
- performedBy: employeeId
```

---

## Issues & Recommendations

### 🚨 Critical Issue: Duplicate Deduction in POS Orders

**Location**: `/app/api/pos/orders/route.ts` lines 113-230

**Problem**: 
- Inventory reduction logic runs TWICE in the same function
- First block (lines 113-175): Inside the order creation transaction
- Second block (lines 178-230): Second transaction right after
- Results in **ingredients being deducted twice per order**

**Example**: 
- Order 2× Coffee → Beans deducted by 4 units instead of 2 units

**Fix Required**:
- Remove the duplicate block (lines 178-230)
- Keep only the first deduction (lines 113-175)
- The block at lines 226-239 (POS session stats) also runs twice

---

## Summary Table

| Aspect | POS Orders | Regular Orders | Status Updates |
|--------|-----------|----------------|----------------|
| **Deduction Timing** | Order creation | Order creation | Status change |
| **Validation** | During deduction | Pre-order validation | During update |
| **Audit Trail** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Atomic** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Issue** | ⚠️ Duplicate logic | ✅ Working correctly | ✅ State-aware |
| **Cost Tracking** | ❌ No | ✅ Yes | ❌ No |

---

## Testing Checklist

- [ ] POS: Create order with 2× Coffee → Beans should decrease by 2 (not 4)
- [ ] POS: Create order with low stock → Should reject order
- [ ] Storefront: Create order with multiple items → Verify all ingredients deducted correctly
- [ ] Inventory Transactions: Check transaction logs are created for each deduction
- [ ] Status Update: Change order to "completed" → Verify ingredients deducted (if not already POS)
- [ ] Multi-item: Order with product having multiple ingredients → All should deduct
