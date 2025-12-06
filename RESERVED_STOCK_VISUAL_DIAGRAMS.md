# Reserved Stock System - Visual Flow Diagrams

## 1. Order Lifecycle with Stock Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER PLACES ORDER                            │
│                                                                         │
│  Order Items: 2× Coffee (each needs 1 bean)                            │
│  Current Stock: 50 beans, Reserved: 0 beans                            │
└──────────────────────────┬──────────────────────────────────────────────┘
                           ↓
            ┌──────────────────────────────┐
            │   VALIDATE AVAILABILITY      │
            │  available = 50 - 0 = 50 ✓  │
            │  needed = 2                  │
            │  50 ≥ 2 → SUCCESS            │
            └──────────────────┬───────────┘
                               ↓
        ┌──────────────────────────────────────┐
        │   CREATE ORDER (status='pending')    │
        │                                      │
        │   Order ID: 123                      │
        │   Items: 2× Coffee                   │
        │   Status: PENDING                    │
        └──────────────────┬───────────────────┘
                           ↓
      ┌────────────────────────────────────────────┐
      │   RESERVE INVENTORY (temporary hold)       │
      │                                            │
      │   Beans:                                   │
      │   ├─ currentStock:   50 (no change)       │
      │   ├─ reservedStock:  0 → 2 (reserved)     │
      │   └─ available:      48 (50-2)            │
      │                                            │
      │   Log: type='reserved'                     │
      │        reason='Order 123 - RESERVED'       │
      └──────────────────┬─────────────────────────┘
                         ↓
     ┌───────────────────────────────────────────────┐
     │  OTHER CUSTOMERS CAN SEE:                     │
     │  "48 beans available" (not 50)                │
     │                                               │
     │  If someone tries to order 49, it fails:     │
     │  "Only 48 available"                          │
     └───────────────────┬───────────────────────────┘
                         ↓
           ┌─────────────────────────────┐
           │  CUSTOMER DECIDES:          │
           └──────┬──────────────┬───────┘
                  ↓              ↓
        ┌──────────────┐  ┌────────────────┐
        │   COMPLETES  │  │   CANCELS      │
        │   ORDER      │  │   ORDER        │
        └──────┬───────┘  └────────┬───────┘
               ↓                   ↓
    ┌──────────────────┐  ┌──────────────────┐
    │CONVERT RESERVED  │  │RELEASE RESERVED  │
    │→ PERMANENT       │  │BACK TO AVAILABLE │
    │                  │  │                  │
    │Beans:            │  │Beans:            │
    │├─currentStock:   │  │├─currentStock: 50│
    ││ 50→48 (apply!)  │  ││  (no change)    │
    │├─reservedStock:  │  │├─reservedStock:  │
    ││ 2→0 (release)   │  ││ 2→0 (release)   │
    │└─available: 48   │  │└─available: 50   │
    │                  │  │                  │
    │Log: type='out'   │  │Log:              │
    │reason='COMPLETED'│  │type='reserved_   │
    └──────────────────┘  │released'         │
                          │reason='CANCELLED'│
                          └──────────────────┘
```

---

## 2. Stock State Diagram

```
                         INGREDIENT STOCK
        ┌─────────────────────────────────────────┐
        │                                         │
        │   Current Stock = 50 units (physical)   │
        │                                         │
        ├─────────────────────────────────────────┤
        │  Reserved = 2 units (held by orders)    │
        │  Reserved = 0 units                     │
        │  Reserved = 5 units (pending orders)    │
        │                                         │
        ├─────────────────────────────────────────┤
        │  AVAILABLE = Current - Reserved         │
        │  AVAILABLE = 50 - 2 = 48 units          │
        │  AVAILABLE = 50 - 0 = 50 units          │
        │  AVAILABLE = 50 - 5 = 45 units          │
        │                                         │
        └─────────────────────────────────────────┘

    What Each Number Means:
    ━━━━━━━━━━━━━━━━━━━━━━━━━
    currentStock (50)
      → Actual physical units in warehouse
      → Updated only when orders complete/cancelled
      → The TRUTH

    reservedStock (2)
      → Units held by pending orders
      → Temporarily unavailable
      → Released when order completes or cancelled

    Available (48)
      → What new customers can order
      → Formula: currentStock - reservedStock
      → Real-time accurate
      → Calculated on demand
```

---

## 3. Multiple Orders Timeline

```
TIME  ACTION                          CURRENT  RESERVED  AVAILABLE
────────────────────────────────────────────────────────────────────

 T0   Initial state                      50        0        50
      

 T1   Customer A orders 10 units
      ├─ Reserve 10                      50       10        40
      └─ Status: pending
      

 T2   Customer B orders 30 units
      ├─ Check: 40 available ✓
      ├─ Reserve 30                      50       40        10
      └─ Status: pending
      

 T3   Customer C tries to order 15
      ├─ Check: 10 available ✗ FAIL
      └─ Error: "Only 10 available"
      

 T4   Customer A completes order
      ├─ currentStock: 50 → 40 (apply deduction)
      ├─ reservedStock: 40 → 30 (release reservation)
      ├─ Result:                         40       30        10
      └─ Status: completed
      

 T5   Customer B cancels order
      ├─ currentStock: 40 (unchanged)
      ├─ reservedStock: 30 → 0 (release reservation)
      ├─ Result:                         40        0        40
      └─ Status: cancelled
      

 T6   Customer C tries to order 30 again
      ├─ Check: 40 available ✓ SUCCESS
      ├─ Reserve 30                      40       30        10
      └─ Status: pending
```

---

## 4. Database State Transitions

```
┌──────────────────────┐
│  INGREDIENT TABLE    │
├──────────────────────┤
│ id: 1                │
│ name: Beans          │
│ currentStock: 50.0   │
│ reservedStock: 0.0   │
│ minStock: 5.0        │
└──────────────────────┘
           ↓
    Order Placed: Reserve 2
           ↓
┌──────────────────────┐
│  INGREDIENT TABLE    │
├──────────────────────┤
│ id: 1                │
│ name: Beans          │
│ currentStock: 50.0 ┐ │
│ reservedStock: 2.0 │ │ ← Changed
│ minStock: 5.0      │ │
└──────────────────────┘
           ↓
    Order Completed or Cancelled?
           ├─→ Completed
           │        ↓
           │   ┌──────────────────────┐
           │   │  INGREDIENT TABLE    │
           │   ├──────────────────────┤
           │   │ id: 1                │
           │   │ name: Beans          │
           │   │ currentStock: 48.0 ──┼─ Changed (permanent)
           │   │ reservedStock: 0.0   │ Changed (released)
           │   │ minStock: 5.0        │
           │   └──────────────────────┘
           │
           └─→ Cancelled
                    ↓
               ┌──────────────────────┐
               │  INGREDIENT TABLE    │
               ├──────────────────────┤
               │ id: 1                │
               │ name: Beans          │
               │ currentStock: 50.0 ──┤ Unchanged (no deduction)
               │ reservedStock: 0.0   │ Changed (released)
               │ minStock: 5.0        │
               └──────────────────────┘
```

---

## 5. Inventory Transaction Log

```
INVENTORY TRANSACTION TABLE:
═══════════════════════════════════════════════════════════════════

[1]  Type: RESERVED
     Ingredient: Beans (id=1)
     Quantity: 2
     Reason: "Order ORD-123 - RESERVED"
     Status: Order pending
     → Meaning: 2 beans held for this order
     
[2]  Type: RESERVED_RELEASED
     Ingredient: Beans (id=1)
     Quantity: 2
     Reason: "Order ORD-123 - CANCELLED"
     Status: Order cancelled
     → Meaning: Release the hold, back to available
     
vs.
     
[1]  Type: RESERVED
     Ingredient: Beans (id=1)
     Quantity: 2
     Reason: "Order ORD-456 - RESERVED"
     Status: Order pending
     → Meaning: 2 beans held for this order
     
[2]  Type: OUT
     Ingredient: Beans (id=1)
     Quantity: 2
     Cost: 25.00
     Reason: "Order ORD-456 - COMPLETED"
     Status: Order completed
     → Meaning: Permanent deduction, convert reserved to out
```

---

## 6. Available Stock Calculation

```
                    INGREDIENT
                       ↓
        ┌──────────────┴──────────────┐
        ↓                             ↓
   currentStock = 50            reservedStock = 2
   (Physical in warehouse)      (Held by orders)
        ↓                             ↓
        └──────────────┬──────────────┘
                       ↓
              Available = 50 - 2
              Available = 48 units
                       ↓
        ┌──────────────────────────────┐
        │  What customers see:         │
        │  "48 beans available"        │
        │                              │
        │  Can order up to: 48 units  │
        │  Cannot order: 49+ units    │
        └──────────────────────────────┘

    For Products with Ingredients:
    ════════════════════════════════
    
    Product: Burger
    ├─ Needs: 2 buns
    ├─ Needs: 1 meat patty
    
    Buns: currentStock=100, reserved=20, available=80
          Can make: 80/2 = 40 burgers
    
    Meat: currentStock=50, reserved=5, available=45
          Can make: 45/1 = 45 burgers
    
    Total available: MIN(40, 45) = 40 burgers
```

---

## 7. State Machine

```
                    ┌─────────────┐
                    │   PENDING   │
                    │  (reserved) │
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                ↓                     ↓
        ┌────────────────┐   ┌──────────────────┐
        │  COMPLETED/    │   │   CANCELLED      │
        │  READY/        │   │                  │
        │  DELIVERED     │   │  Release         │
        │                │   │  reservation     │
        │  Apply         │   │  → available +   │
        │  deduction     │   │                  │
        │  reserved→out  │   │  currentStock:   │
        │                │   │    unchanged     │
        │  currentStock- │   │  reservedStock:  │
        │  reserved-     │   │    -= qty        │
        └────────────────┘   └──────────────────┘
           ↓                         ↓
        Final state              Final state
        (no more changes)        (no more changes)
```

---

## 8. Real-World Scenario

```
COFFEE SHOP INVENTORY MANAGEMENT

Initial Setup:
├─ Beans: 100 units
├─ Milk: 50 units
└─ Cups: 200 units

Morning (8 AM): 
├─ Regular customer orders 5 coffees
│  ├─ Each needs: 20g beans, 30ml milk, 1 cup
│  ├─ Reserve: beans=100g, milk=150ml, cups=5
│  └─ Status: pending (waiting for pickup)
│
└─ Available for new orders:
   ├─ Beans: 100-100=0 (can make 0 more)
   ├─ Milk: 50-150=-100 WAIT... ERROR!
   │  → Order blocked: only 50ml available, need 150ml
   └─ This order shouldn't have been created!

Actually:
├─ Before order: beans available=100, milk available=50
├─ For 5 coffees: need beans=100, milk=150
├─ milk check: 50 < 150 → REJECT ORDER
└─ Message: "Not enough milk. Have 50ml, need 150ml"

Retry with 3 coffees:
├─ Need: beans=60, milk=90... NO (need 90, have 50)
├─ 
├─ Retry with 2 coffees:
├─ Need: beans=40, milk=60... NO (need 60, have 50)
│
└─ Retry with 1 coffee:
   ├─ Need: beans=20, milk=30, cups=1
   ├─ Check: 100≥20✓, 50≥30✓, 200≥1✓
   ├─ Order created: PENDING
   ├─ Reserve: beans=20, milk=30, cups=1
   ├─ New available:
   │  ├─ beans: 100-20=80
   │  ├─ milk: 50-30=20
   │  └─ cups: 200-1=199
   │
   ├─ Customer picks up at 9:15 AM
   ├─ Status → COMPLETED
   ├─ Apply deduction:
   │  ├─ beans: 100→80 (permanent)
   │  ├─ milk: 50→20 (permanent)
   │  └─ cups: 200→199 (permanent)
   │
   └─ Final: beans=80, milk=20, cups=199
      (this is THE TRUTH until next transaction)
```

---

## Summary

The **reserved stock** system ensures:

✅ **Accurate availability**: Real stock minus pending orders
✅ **No overselling**: Orders rejected if insufficient stock
✅ **Easy cancellation**: Just release the reservation
✅ **Full audit trail**: Every reservation/release/deduction logged
✅ **Atomic safety**: Transactions roll back on any error

**Key Insight**: Stock is reserved when order placed, deducted only when completed, released when cancelled.
