# Payment Proof Field Implementation

## Overview
The `paymentProof` field has been successfully added to the Order model in the Prisma schema. This field stores base64-encoded image data for payment proof (e.g., screenshots of bank transfers, checks, etc.).

## Database Schema Changes

### Order Model (`prisma/schema.prisma`)
```prisma
model Order {
  // ... existing fields ...
  paymentProof         String?              @db.LongText
  // ... existing relations ...
}
```

**Field Details:**
- **Type:** `String?` (optional)
- **Database Type:** `LongText` - allows for large base64-encoded image data
- **Purpose:** Stores image proof of payment for orders

## API Endpoint Usage

### Creating an Order with Payment Proof

**Endpoint:** `POST /api/orders`

**Request Body Example:**
```json
{
  "customer": {
    "firstName": "Thirdy",
    "lastName": "Esmero",
    "email": "thirdy@gmail.com",
    "phone": "+63123123123"
  },
  "items": [
    {
      "productId": 6,
      "quantity": 2,
      "price": 150
    }
  ],
  "deliveryType": "delivery",
  "address": "123 Main St, City",
  "subtotal": 300,
  "paymentMethod": "bank_transfer",
  "paymentProof": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

### Updated GET Endpoint

The GET endpoint at `GET /api/orders` retrieves all orders with the following fields:

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "order_number": "ORD-176494242543",
        "customer_name": "Thirdy Esmero",
        "customer_email": "thirdy@gmail.com",
        "customer_phone": "+63123123123",
        "created_at": "2024-01-15T10:30:00Z",
        "total_amount": 336,
        "subtotal_amount": 300,
        "tax_amount": 36,
        "order_status": "pending",
        "payment_status": "unpaid",
        "payment_method": "bank_transfer",
        "amount_paid": 0
      }
    ]
  }
}
```

## File Upload Conversion

To send image data as payment proof, convert the file to base64:

### JavaScript Example:
```javascript
const fileInput = document.getElementById('paymentProofInput');
const file = fileInput.files[0];

const reader = new FileReader();
reader.onload = (e) => {
  const base64String = e.target.result; // e.g., "data:image/png;base64,..."
  
  // Send with order data
  const orderData = {
    customer: {...},
    items: [...],
    paymentProof: base64String
  };
  
  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
};
reader.readAsDataURL(file);
```

### cURL Example:
```bash
# First, convert image to base64
BASE64_IMAGE=$(base64 < /path/to/payment_proof.png)

# Send order with payment proof
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
      {"productId": 6, "quantity": 2, "price": 150}
    ],
    "deliveryType": "delivery",
    "subtotal": 300,
    "paymentMethod": "bank_transfer",
    "paymentProof": "data:image/png;base64,'$BASE64_IMAGE'"
  }'
```

## Current Implementation Status

✅ **Database Schema:** `paymentProof` field added to Order model
✅ **Data Type:** LongText for efficient storage of large base64 strings
✅ **Optional Field:** Allows orders without payment proof initially
✅ **Migration Resolved:** Database schema is synchronized

## Next Steps (Optional)

### 1. Create Dedicated Payment Proof Upload Endpoint
```typescript
// POST /api/orders/:orderId/payment-proof
async POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Convert to base64
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;
  
  // Update order with payment proof
  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { paymentProof: dataUrl }
  });
  
  return NextResponse.json({ success: true, data: order });
}
```

### 2. Add Payment Proof Retrieval Endpoint
```typescript
// GET /api/orders/:orderId/payment-proof
async GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    select: { paymentProof: true }
  });
  
  if (!order?.paymentProof) {
    return NextResponse.json({ message: 'No payment proof found' }, { status: 404 });
  }
  
  return NextResponse.json({ paymentProof: order.paymentProof });
}
```

### 3. Add Admin Payment Proof Verification
Add a status field to track proof verification:
```prisma
model Order {
  // ... existing fields ...
  paymentProofStatus  String? @default("pending") // pending, verified, rejected
  paymentProofNotes   String?
}
```

## Testing the Implementation

### Test Case 1: Order with Payment Proof
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-tenant-subdomain: avio" \
  -d '{
    "customer": {"firstName": "Test", "lastName": "User", "email": "test@example.com", "phone": "+1234567890"},
    "items": [{"productId": 6, "quantity": 1, "price": 150}],
    "deliveryType": "delivery",
    "subtotal": 150,
    "paymentMethod": "bank_transfer",
    "paymentProof": "data:image/png;base64,..."
  }'
```

### Test Case 2: Order without Payment Proof
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-tenant-subdomain: avio" \
  -d '{
    "customer": {"firstName": "Test", "lastName": "User", "email": "test@example.com", "phone": "+1234567890"},
    "items": [{"productId": 6, "quantity": 1, "price": 150}],
    "deliveryType": "delivery",
    "subtotal": 150,
    "paymentMethod": "cash"
  }'
```

## Database Query Examples

### Retrieve orders with payment proof:
```sql
SELECT id, orderNumber, paymentMethod, paymentProof IS NOT NULL as hasProof
FROM orders
WHERE tenantId = 3 AND paymentProof IS NOT NULL;
```

### Check payment proof storage size:
```sql
SELECT 
  id, 
  orderNumber,
  LENGTH(paymentProof) as proofSize,
  LENGTH(paymentProof) / 1024 / 1024 as sizeInMB
FROM orders
WHERE paymentProof IS NOT NULL
ORDER BY LENGTH(paymentProof) DESC;
```

## Performance Considerations

- **Image Compression:** Consider compressing images before upload to reduce database size
- **Max File Size:** Base64 images are typically 33% larger than binary; ~3MB file = ~4MB database entry
- **Storage:** For large-scale deployment, consider moving images to cloud storage (S3, GCS) and storing only the URL in the database

## Migration Status
```
✅ Database schema updated
✅ Order model includes paymentProof field
✅ Migration conflicts resolved
⏳ Payment proof upload endpoint (optional)
⏳ Admin verification workflow (optional)
```
