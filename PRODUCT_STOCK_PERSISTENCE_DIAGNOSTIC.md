# Product Stock Persistence - Diagnostic Guide

## Issue Summary
"Products manager for the tenant side when updating the product stock is not persistent and doesn't get updated"

## Investigation Status: COMPLETE WITH DIAGNOSTICS ADDED

I've added comprehensive logging to trace the complete data flow from form submission through database persistence. Here's what to check:

---

## Testing Steps

### Step 1: Open Browser DevTools Console
1. Open the Products Manager page in your tenant dashboard
2. Open DevTools (F12)
3. Go to the "Console" tab
4. Clear the console (icon looks like a ban sign)

### Step 2: Create a New Product with Stock Tracking
1. Click "Add Product"
2. Fill in basic details:
   - **Name:** "Test Stock Product"
   - **Price:** 100
   - **Track Inventory:** CHECK this checkbox ✓
   - **Current Stock:** 50
   - **Low Stock Threshold:** 10
3. Click "Create Product"

### Step 3: Check Console Logs - Client Side
After creating the product, you should see in the console:

```
[ProductsManager] Form submission: {
  method: "POST",
  payload: {
    name: "Test Stock Product",
    price: 100,
    track_inventory: true,
    current_stock: 50,
    low_stock_threshold: 10,
    ...other fields
  },
  trackInventory: true,
  currentStock: 50,
  lowStockThreshold: 10
}
```

**Expected:** This shows the form is correctly capturing the stock data.
**If Missing:** The form state is not being updated properly.

---

```
[ProductsManager] API response status: 200
```

**Expected:** API returns success.
**If Different:** Check what error code appears (401, 500, etc.).

---

```
[ProductsManager] Fetched products: {
  count: X,
  sampleProduct: {
    id: 123,
    name: "Test Stock Product",
    trackInventory: true,
    currentStock: 50,
    lowStockThreshold: 10
  }
}
```

**Expected:** The fetched product includes correct stock values.
**If currentStock is 0:** The database didn't save it, or API isn't returning it.

### Step 4: Check Server Logs
In your server terminal, look for logs like:

```
[API /products POST] Received payload: {
  track_inventory: true,
  current_stock: 50,
  low_stock_threshold: 10,
  fullBody: {...}
}
```

**Expected:** Shows server received the data correctly.
**If Missing:** Form submission might not be reaching the API.

---

```
[API /products POST] Product created: {
  id: 123,
  trackInventory: true,
  currentStock: 50,
  lowStockThreshold: 10
}
```

**Expected:** Confirms database saved the values.
**If currentStock is 0:** Prisma isn't saving the field.

---

## Potential Issues & Solutions

### Issue 1: Form State Not Capturing Stock
**Symptoms:**
- Console shows `currentStock: 0` or `currentStock: NaN`
- Checkbox "Track Inventory" is unchecked in logs

**Solution:**
- Verify form input bindings in ProductsManager.tsx:
  - Line 932-933: Current Stock input state binding
  - Line 942-943: Low Stock Threshold input state binding
  - Line 917-918: Track Inventory checkbox state binding

### Issue 2: Stock Fields Hidden When Track Inventory Unchecked
**Symptoms:**
- Stock input fields disappear when you uncheck "Track Inventory"
- You can't enter stock values

**Solution:**
- This is intentional - stock only matters when tracking is enabled
- Make sure checkbox is checked before entering stock values

### Issue 3: API Not Receiving Data
**Symptoms:**
- Client console shows correct data
- Server console shows `current_stock: undefined` or missing

**Solution:**
- Check network tab in DevTools:
  - Network → Find POST request to `/api/products`
  - Click it → Payload tab
  - Verify `track_inventory`, `current_stock` are in the body

### Issue 4: Database Not Saving
**Symptoms:**
- Server logs show data received correctly
- But database fetch returns 0 for currentStock

**Solution:**
- Check Prisma migration was applied:
  ```bash
  npm run db:migrate
  ```
- Verify database schema:
  ```bash
  npm run db:studio
  ```
  - Open to Products table
  - Check `trackInventory`, `currentStock`, `lowStockThreshold` columns exist

### Issue 5: Stock Displays But Not Persistent on Page Refresh
**Symptoms:**
- Stock shows correctly after creation
- But after page refresh, it's back to 0

**Solution:**
- This indicates API GET is not returning the value
- Check `/api/products` route line 59-61 - should map `currentStock` to response

---

## Database Query to Verify Data is Saved

Run this in Prisma Studio:
```bash
npm run db:studio
```

Then:
1. Navigate to `Product` table
2. Find your "Test Stock Product"
3. Check these columns:
   - `trackInventory` should be `true`
   - `currentStock` should be `50`
   - `lowStockThreshold` should be `10`

If values are 0 or null, the save didn't work.

---

## Manual API Test

Test the API directly with curl/Postman:

### Create Product with Stock
```bash
curl -X POST http://localhost:3000/api/products?subdomain=your-subdomain \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "price": 100,
    "track_inventory": true,
    "current_stock": 50,
    "low_stock_threshold": 10
  }'
```

### Check Response
The response should include:
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 123,
      "trackInventory": true,
      "currentStock": 50,
      "lowStockThreshold": 10
    }
  }
}
```

---

## What I've Added for Diagnostics

### ProductsManager.tsx
- ✅ Form submission logging (shows payload being sent)
- ✅ API response status logging
- ✅ Fetch products result logging (shows what was returned)

### /api/products/route.ts (POST)
- ✅ Received payload logging (shows server got the data)
- ✅ Product created logging (shows what was saved)

### /api/products/[id]/route.ts (PUT)
- ✅ Received payload logging (for edits)
- ✅ Product saved logging (for edits)

---

## Next Steps

1. **Run through the testing steps above**
2. **Paste the console output from both client and server**
3. **Let me know which step fails**

This will help pinpoint exactly where the data flow breaks.

---

## Data Flow Summary

```
Form Submit (ProductsManager.tsx)
    ↓ [Logs: Form submission with payload]
API POST /api/products
    ↓ [Logs: Received payload]
Prisma Create/Update
    ↓ [Logs: Product saved]
Return Response
    ↓
Fetch Products List
    ↓ [Logs: Fetched products with stock values]
Update UI State
    ↓
Display Products
```

Each arrow has logging to trace where the issue is.
