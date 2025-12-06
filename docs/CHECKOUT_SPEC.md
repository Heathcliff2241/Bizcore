# Checkout Spec

## Purpose
A minimal yet robust checkout UX and API contract for the storefront that supports both Pickup and Delivery flows, client-side validation, server-side order creation, inventory deduction, secure payment tokenization/redirect, and proper error handling.

## User-facing fields (minimal MVP):
- Customer Info: Full name (required), Email (required), Phone (optional)
- Delivery Type: "pickup" | "delivery" (required)
  - If delivery: Address (line1, line2, city, state, postalCode, country) — required
  - If pickup: Store/Location selection optional
- Payment Method: "card" | "cash" | "manual" (required)
  - If card: tokenized flow (Stripe/Checkout/Server token)
  - If cash: set paymentStatus = "pending" and collect at pickup/delivery
- Cart Items: Each item includes productId, name, price, quantity, options
- Additional: Order notes, Tip (optional), couponCode (optional)

## UX Wireframe (brief):
- Left column: Cart summary with editable quantities (use existing `CartItems`/`CheckoutSummary` components)
- Right column: Checkout form with tabs/selection for Delivery vs Pickup, input fields for customer and address; payment method selector and Submit button

## API Contract - POST /api/orders

Request payload (JSON):
{
  "tenantId": "string", // optional; prefer subdomain as path or header
  "customer": {
    "name": "string",
    "email": "string",
    "phone?:": "string"
  },
  "deliveryType": "delivery" | "pickup",
  "address?:": {
    "line1": "string",
    "line2?:": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string"
  },
  "items": [
    { "productId": number | string, "quantity": number, "price": number, "options?:": any }
  ],
  "subtotal": number,
  "discount": number,
  "tax": number,
  "tip": number,
  "total": number,
  "paymentMethod": "card" | "cash" | "manual",
  "paymentToken?:": "string", // if card
  "couponCode?:": "string",
  "idempotencyKey?:": "string"
}

### Response payload (success, 201):
{
  "orderId": number,
  "status": "pending" | "paid" | "failed",
  "message": "Order created",
  "order": { /* minimal order payload for display */ }
}

### Errors
- 400 Bad Request: Missing required fields or cart validation (e.g., empty cart, invalid email)
- 409 Conflict: Items no longer available or insufficient inventory
- 402 Payment Required: Payment failures (card declined)
- 500 Internal Server Error: General failure

## Server Behavior
1. Validate request: required fields, totals and taxes consistent with items (prevent tampering) — optionally recalculate price server-side to enforce trust.
2. Check and Reserve inventory (transactionally): verify stock available for all products and their ingredients. If insufficient, return 409 with item details.
3. Create Order record + OrderItems.
4. Deduct inventory and create InventoryTransactions in the same DB transaction as (2)–(3); use Prisma transaction to ensure atomicity.
5. If paymentMethod === 'card': create payment charge via Stripe / payment provider and mark order paid/failed accordingly.
6. Return success response, including order id and status. If the payment is not yet complete, return status pending and payment metadata to the client.
7. Trigger side effects: send order confirmation email (background job / webhook), Push notifications, update admin dashboards.
8. Use idempotencyKey to make clients repeat-safe.

## Edge Cases & Validation
- If calculated total does not match provided total within small delta, prefer server calculation and reject or recalc.
- If reservation fails (stock reserved by concurrent orders), return 409 with details for the user to adjust their cart.
- Payment failure after stock reservation should rollback stock or create compensation flows (depending on payment gateway). Ideally create a compensation job to restock or cancel order.

## Implementation Notes (MVP)
- For now, accept `paymentMethod: "cash"` for minimal MVP; do not integrate Stripe yet.
- Validate email and basic address fields client-side with server-side validations.
- Use `idempotencyKey` header or body property for order creation to prevent duplicate orders on retries.
- For the UI: show friendly error messages for specific issues like insufficient stock or payment declines.

## Acceptance Criteria
- POST /api/orders returns 201 with `orderId` for valid payloads.
- Insufficient inventory returns 409 and prevents order creation.
- Inventory deduction and order creation are an atomic transaction (db-level or application-level with transaction rollback on errors).
- Cart resets on success and order confirmation message displays.
- Server returns standardized error object with code and message.

## Next Steps
- Implement `CheckoutForm.tsx` using `useCart` hook and the `CheckoutSummary` component.
- Build API route `app/api/orders/route.ts` to apply this contract with Prisma transaction and optimistic integrity checks.
- Add server-side tests for inventory and order creation edge cases.

