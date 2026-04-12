# Payment Proof Implementation Guide

## Overview

The payment proof feature allows customers to upload image evidence of payment (such as bank transfer receipts, check photos, etc.) when creating orders. The feature is fully integrated into the BizCore order system.

## What's Been Implemented

### 1. ✅ Database Schema
- **File**: `prisma/schema.prisma`
- **Field**: `paymentProof String? @db.LongText`
- **Purpose**: Stores base64-encoded image data
- **Status**: Deployed and migration resolved

### 2. ✅ Type Definitions
- **File**: `lib/paymentProof.ts`
- **Contains**:
  - TypeScript interfaces for payment proof data
  - Validation utilities
  - File conversion helpers
  - `PaymentProofUploader` class for client-side handling

### 3. ✅ React Component
- **File**: `components/PaymentProofUploader.tsx`
- **Features**:
  - Drag-and-drop image upload
  - File validation (size, type)
  - Base64 conversion
  - Image preview
  - Error handling
  - Loading states

### 4. ✅ API Integration
- **File**: `app/api/orders/route.ts`
- **Method**: POST
- **Supports**: Optional `paymentProof` field in request payload

### 5. ✅ Testing
- **File**: `test-payment-proof.js`
- **Includes**: Test cases for schema, API, and data retrieval

## Usage Examples

### Frontend: Using the React Component

```typescript
'use client'

import { useState } from 'react'
import PaymentProofUploader from '@/components/PaymentProofUploader'
import { PaymentProofUploader as Uploader, CreateOrderWithProofRequest } from '@/lib/paymentProof'

export default function CheckoutPage() {
  const [paymentProof, setPaymentProof] = useState<string | null>(null)

  const handlePaymentProofChange = (base64Data: string | null) => {
    setPaymentProof(base64Data)
  }

  const submitOrder = async () => {
    const orderData: CreateOrderWithProofRequest = {
      customer: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      },
      items: [
        { productId: 1, quantity: 2, price: 100 }
      ],
      deliveryType: 'delivery',
      subtotal: 200,
      paymentMethod: 'bank_transfer',
      paymentProof // Include the proof if available
    }

    const uploader = new Uploader()
    const result = await uploader.submitOrder(orderData)

    if (result.success) {
      console.log('Order created:', result.data)
      // Redirect to confirmation page
    } else {
      console.error('Order failed:', result.error)
    }
  }

  return (
    <div>
      <h1>Checkout</h1>
      
      {/* Payment proof upload - only for non-cash payments */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <select id="paymentMethod" className="border rounded px-3 py-2">
          <option value="cash">Cash</option>
          <option value="card">Credit/Debit Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="online_payment">Online Payment</option>
        </select>
      </div>

      {/* Show proof uploader for non-cash payments */}
      <div className="mt-6">
        <PaymentProofUploader
          onProofChange={handlePaymentProofChange}
          disabled={false}
          maxFileSizeMB={5}
        />
      </div>

      <button
        onClick={submitOrder}
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded"
      >
        Place Order
      </button>
    </div>
  )
}
```

### Backend: Creating an Order

```bash
# Using cURL
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-tenant-subdomain: avio" \
  -d '{
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "items": [
      {
        "productId": 6,
        "quantity": 2,
        "price": 150
      }
    ],
    "deliveryType": "delivery",
    "address": "123 Main St",
    "subtotal": 300,
    "paymentMethod": "bank_transfer",
    "paymentProof": "data:image/png;base64,iVBORw0KGg..."
  }'
```

### JavaScript: Manual File Upload

```javascript
// Get file from input
const fileInput = document.getElementById('paymentProof');
const file = fileInput.files[0];

// Convert to base64
const reader = new FileReader();
reader.onload = (e) => {
  const base64 = e.target.result; // "data:image/png;base64,..."
  
  // Use with PaymentProofUploader class
  const uploader = new PaymentProofUploader();
  uploader.submitOrder({
    customer: { /* ... */ },
    items: [ /* ... */ ],
    deliveryType: 'delivery',
    subtotal: 300,
    paymentMethod: 'bank_transfer',
    paymentProof: base64
  }).then(result => {
    if (result.success) {
      console.log('Order created:', result.data);
    } else {
      console.error('Error:', result.error);
    }
  });
};
reader.readAsDataURL(file);
```

## API Reference

### POST /api/orders

**Request Body:**
```typescript
{
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  deliveryType: 'dine-in' | 'takeout' | 'delivery';
  address?: string;
  subtotal: number;
  paymentMethod: string;
  paymentProof?: string; // Optional: base64 data URL
  tip?: number;
  discount?: number;
  deliveryFee?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    id: number;
    orderNumber: string;
    paymentProof?: string; // Stored proof
    paymentMethod: string;
    paymentStatus: string;
    total: number;
    // ... other order fields
  };
  message?: string;
}
```

## File Format & Constraints

### Supported Image Formats
- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- WebP (`.webp`)
- GIF (`.gif`)

### Size Constraints
- **Maximum**: 5MB per image
- **Recommended**: Compress large images before upload
- Base64 encoded size is ~33% larger than original binary

### Base64 Format
All images are stored as data URLs:
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
```

## Validation

### Client-Side Validation
Use the `PaymentProofUploader` class for automatic validation:

```typescript
import { PaymentProofUploader, validatePaymentProof } from '@/lib/paymentProof';

// Option 1: Using the uploader class
const uploader = new PaymentProofUploader(5); // 5MB max
const result = await uploader.convert(file);

// Option 2: Using validation function
const validation = validatePaymentProof(file);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

### Server-Side Validation (Optional)
Add validation in the POST endpoint if needed:

```typescript
// In app/api/orders/route.ts
if (paymentProof && paymentProof.length > 10 * 1024 * 1024) { // 10MB base64
  return NextResponse.json(
    { success: false, message: 'Payment proof exceeds maximum size' },
    { status: 400 }
  );
}
```

## Database Queries

### Find Orders with Payment Proof
```sql
SELECT id, orderNumber, paymentMethod, paymentProof IS NOT NULL as hasProof
FROM orders
WHERE tenantId = 3 AND paymentProof IS NOT NULL
ORDER BY createdAt DESC;
```

### Get Payment Proof Size Statistics
```sql
SELECT 
  COUNT(*) as totalOrders,
  COUNT(CASE WHEN paymentProof IS NOT NULL THEN 1 END) as ordersWithProof,
  ROUND(AVG(COALESCE(LENGTH(paymentProof), 0)) / 1024 / 1024, 2) as avgProofSizeMB,
  MAX(LENGTH(paymentProof)) / 1024 / 1024 as maxProofSizeMB
FROM orders
WHERE tenantId = 3;
```

### Update Payment Proof After Order Creation
```typescript
// In app/api/orders/[orderId]/payment-proof/route.ts
const order = await prisma.order.update({
  where: { id: parseInt(orderId) },
  data: { paymentProof: newBase64String }
});
```

## Performance Optimization Tips

### 1. Image Compression
Before uploading, compress images using a library:
```typescript
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};
const compressedFile = await imageCompression(file, options);
```

### 2. Storage Alternative (Cloud Storage)
For large-scale deployment, consider moving images to cloud storage:

```typescript
// Upload to S3/GCS and store URL instead
const uploadedUrl = await uploadToS3(file);
const order = await prisma.order.create({
  data: {
    // ... order data
    paymentProof: uploadedUrl // Store URL instead of base64
  }
});
```

### 3. Database Optimization
Add an index for faster queries:
```sql
CREATE INDEX idx_orders_payment_proof ON orders(paymentProof) WHERE paymentProof IS NOT NULL;
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "File size exceeds 5MB" | Image too large | Compress image before upload |
| "Unsupported file type" | Wrong format | Use PNG, JPG, WebP, or GIF |
| "Invalid base64 format" | Corrupted data | Re-upload the file |
| "Payment proof exceeds maximum size" | Base64 string too large | Reduce image dimensions |

## Testing

Run the test suite:
```bash
node test-payment-proof.js
```

Expected output:
```
🚀 Payment Proof Field Integration Tests
========================================

📝 Test 1: Create Order with Payment Proof
✅ Order created successfully

📝 Test 2: Create Order WITHOUT Payment Proof
✅ Order created successfully (without payment proof)

📝 Test 3: Retrieve Orders and Verify Payment Proof Field
✅ Retrieved X orders
```

## Future Enhancements

### 1. Payment Proof Verification
Add admin panel to verify and approve payment proofs:
```typescript
// Add to Order model
paymentProofStatus: 'pending' | 'verified' | 'rejected'
paymentProofVerifiedBy?: Int
paymentProofVerifiedAt?: DateTime
```

### 2. Automatic OCR/Processing
Extract data from proof documents:
```typescript
import Tesseract from 'tesseract.js';

const result = await Tesseract.recognize(paymentProofImage);
const extractedText = result.data.text;
```

### 3. Webhook Notifications
Notify admins when proof is uploaded:
```typescript
// Send webhook to payment processor
await fetch('https://webhook.example.com/payment-proof', {
  method: 'POST',
  body: JSON.stringify({
    orderId: order.id,
    paymentProof: order.paymentProof,
    timestamp: new Date()
  })
});
```

## Troubleshooting

### Issue: Image Preview Not Showing
**Solution**: Ensure CORS headers are set correctly in Next.js:
```typescript
// next.config.js
module.exports = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' }
      ]
    }
  ]
};
```

### Issue: Database Size Growing Too Large
**Solution**: Implement image rotation/cleanup:
```typescript
// app/api/cron/cleanup-old-proofs.ts
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
await prisma.order.updateMany({
  where: {
    paymentProof: { not: null },
    createdAt: { lt: thirtyDaysAgo }
  },
  data: { paymentProof: null } // Archive to S3 first
});
```

## Support

For issues or questions about the payment proof feature:
1. Check this documentation
2. Review test cases in `test-payment-proof.js`
3. Check API logs in the server console
4. Verify database schema with `npx prisma studio`

## Summary

✅ Payment proof field is fully implemented and tested
✅ Frontend component ready for use
✅ API integration complete
✅ Database migration deployed
✅ Type safety with TypeScript
✅ Comprehensive error handling
✅ Performance optimizations available

**Status**: Ready for production use
