# 🧪 QUICK TESTING GUIDE - 5 Features to Verify

**Time Needed**: ~30-45 minutes  
**Priority**: CRITICAL for defense

---

## ✅ TEST 1: Inventory Auto-Deduction (10 min)

### Setup:
```bash
# 1. Start dev server
npm run dev

# 2. Open Prisma Studio in another terminal
npm run db:studio
```

### Steps:
1. In Prisma Studio, create a product:
   - Name: "Coffee"
   - Price: 5.00
   - Tenant: Your test tenant

2. Create an ingredient:
   - Name: "Beans"
   - Unit: "grams"
   - currentStock: **100**
   - minStock: **10**

3. Link them:
   - Go to ProductIngredients
   - Create: { productId: [your coffee], ingredientId: [your beans], quantity: 5 }

4. Create employee and login to POS:
   - Go to `/storefront/[subdomain]/pos/login`
   - Add 2x Coffee to cart
   - Charge $10.00

5. **VERIFY**: Go back to Prisma Studio
   - Check Ingredients → Beans → currentStock
   - **Expected**: 100 - (5 × 2) = **90** ✅

---

## ✅ TEST 2: Low-Stock Alerts (5 min)

### Setup:
In Prisma Studio, modify the Beans ingredient:
- currentStock: **5**
- minStock: **10**

### Steps:
1. Go to dashboard: `http://localhost:3000/dashboard/[subdomain]`
2. Wait for page to load
3. Look for red alert banner below welcome header

### **VERIFY**:
- See: **"⚠️ Low Stock Alert"** in red
- Message: **"1 ingredient is running low on stock"**
- Item listed: **"Beans: 5 units (min: 10)"** ✅

---

## ✅ TEST 3: Input Validation (10 min)

### Using Postman or curl:

#### Invalid Request (should fail):
```bash
curl -X POST http://localhost:3000/api/pos/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [],
    "paymentMethod": "cash"
  }'
```

**Expected Response**: 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": [{
    "code": "too_small",
    "minimum": 1,
    "message": "At least one item required"
  }]
}
```
✅ **VALIDATED**: Bad data rejected

#### Valid Request (should succeed):
```bash
curl -X POST http://localhost:3000/api/pos/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "productId": 1, "quantity": 1 }
    ],
    "paymentMethod": "cash"
  }'
```

**Expected Response**: 201 Created
```json
{
  "order": {
    "id": 123,
    "orderNumber": "POS-1731945600-456",
    "status": "completed",
    "total": 5.50
  }
}
```
✅ **VALIDATED**: Good data accepted

---

## ✅ TEST 4: Rate Limiting (10 min)

### Steps:
1. Go to login: `http://localhost:3000/auth/signin`
2. Try wrong password **5 times** with any email
   - Try 1: ✅ Rejected
   - Try 2: ✅ Rejected
   - Try 3: ✅ Rejected
   - Try 4: ✅ Rejected
   - Try 5: ✅ Rejected
   - **Try 6**: ⏳ Instantly rejected (no processing)
     
### **VERIFY**:
- Attempts 1-5: Normal rejection with "Invalid credentials"
- Attempt 6: Silently rejected, no feedback (rate limited)
- After 15 minutes: Can try again ✅

---

## ✅ TEST 5: Security Headers (5 min)

### Steps:
1. Open `http://localhost:3000`
2. Press **F12** to open DevTools
3. Go to **Network** tab
4. Reload page (**F5**)
5. Click the first HTML request (usually largest)
6. Go to **Response Headers** tab
7. Scroll down

### **VERIFY** - Look for these headers:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains ✅
X-Frame-Options: SAMEORIGIN ✅
X-Content-Type-Options: nosniff ✅
X-XSS-Protection: 1; mode=block ✅
Referrer-Policy: strict-origin-when-cross-origin ✅
Permissions-Policy: camera=(), microphone=(), geolocation=() ✅
```

All 6 headers present = **SECURITY PASSING** ✅

---

## 📋 Quick Checklist

- [ ] Test 1: Inventory auto-deduct (Beans: 100 → 90)
- [ ] Test 2: Low-stock alert visible on dashboard
- [ ] Test 3: Invalid data rejected (400 error)
- [ ] Test 3: Valid data accepted (201 created)
- [ ] Test 4: Rate limiting blocks 6th attempt
- [ ] Test 5: All 6 security headers present

**If ALL checks pass**: ✅ **YOU'RE READY FOR DEFENSE**

---

## 🆘 Troubleshooting

### "Inventory not decreasing"
- Check if ingredient exists and has productIngredients link
- Verify product has the right productIngredients entry
- Check order was actually created (check Prisma Studio orders table)

### "Low-stock alert not showing"
- Verify `summary.lowStock > 0` - check API response
- Make sure currentStock < minStock
- Refresh page - might be cached

### "Input validation not working"
- Verify validation.ts file is imported in orders/route.ts
- Check `createPOSOrderSchema.parse()` is being called
- Look at console for errors

### "Security headers not showing"
- Hard refresh (Ctrl+Shift+R)
- Make sure middleware.ts is saved
- Check DevTools is showing latest request (not cached)

### "Rate limiting not working"
- Check rateLimit.ts is imported in auth.ts
- Test from incognito window (fresh session)
- Try from different browser if needed

---

## 🎬 Demo Flow (2 minutes)

1. **Inventory**: "Let me show you auto-deduction" [Show POS order, then check Beans stock decreased]
2. **Alerts**: "Here's the low-stock alert system" [Dashboard with red banner]
3. **Security**: "These are our security headers" [DevTools Response Headers]
4. **Validation**: "Our API validates all inputs" [Show rejected invalid request]
5. **Architecture**: "Multi-tenant isolation means..." [Explain subdomain design]

---

**You've got this. Test these 5 things. Then defend with confidence. 🚀**
