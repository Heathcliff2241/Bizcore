# Activity Logging System Documentation

## Overview

The Activity Logging System is now fully integrated into the BizCore admin dashboard. It automatically tracks important actions across the platform and stores them in the `activity_log` database table for audit trails and monitoring.

## What Gets Logged

]\
### Tenant Operations
- **TENANT_CREATED**: When a new tenant is created
  - Logs: tenant name, subdomain, plan, owner email
- **TENANT_UPDATED**: When tenant details are modified
  - Logs: which fields were changed and new values
- **TENANT_DEACTIVATED**: When a tenant is deleted (actually soft-deleted/deactivated)
  - Logs: tenant name and deactivation timestamp

### User Operations
- **USER_CREATED**: When a new admin user is created
  - Logs: email, role, name
- **USER_UPDATED**: When an admin user is modified
  - Logs: changed fields, new role, new status

### Order Operations
- **ORDER_CREATED**: When a new order is placed
  - Logs: orderId, orderNumber, total, itemCount, customerEmail, paymentMethod, orderType
- **ORDER_UPDATED**: When order status or payment is modified
  - Logs: orderId, orderNumber, changes (fields modified), newStatus, newPaymentStatus, amountPaid

### Product Operations
- **PRODUCT_CREATED**: When a new product is created
  - Logs: productId, productName, price, cost, categoryId, ingredientCount
- **PRODUCT_UPDATED**: When product details are changed
  - Logs: productId, productName, changes (what changed), newPrice, newCost
- **PRODUCT_DELETED**: When a product is deleted
  - Logs: productId, productName, price, cost

### Future Integration Points
- Employee management (hire/fire/role changes)
- Subscription plan changes
- Authentication (login/logout/failed attempts)
- API key generation
- File uploads/deletions
- Settings modifications
- Permission updates

## Architecture

### Activity Logger Module (`lib/activityLogger.ts`)

Core functions:

```typescript
// Log any activity
logActivity({
  userId: number,
  tenantId: number,
  action: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
})

// Tenant-specific logging
logTenantActivity(tenantId, action, userId?, details?)

// User-specific logging
logUserActivity(userId, action, tenantId?, details?)

// Helper functions
getClientIp(request)      // Extract IP from request headers
getUserAgent(request)     // Extract user agent from request headers
```

### Database Schema

```prisma
model ActivityLog {
  id        Int      @id @default(autoincrement())
  userId    Int?
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenantId  Int?
  tenant    Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  action    String
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([tenantId])
  @@index([action])
  @@index([createdAt])
}
```

### API Endpoints

#### Fetch Activity Logs
```
GET /api/admin/tenants/[id]/activity?page=1&limit=20
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "action": "TENANT_UPDATED",
      "details": { "changes": ["name"], "newValues": {...} },
      "user": "John Doe",
      "userEmail": "john@example.com",
      "createdAt": "2024-12-04T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasMore": true
  }
}
```

## Usage Examples

### In API Routes

```typescript
import { logTenantActivity, logUserActivity } from '@/lib/activityLogger'

// When creating a tenant
const tenant = await prisma.tenant.create({ ... })
await logTenantActivity(
  tenant.id,
  'TENANT_CREATED',
  currentUserId,
  { plan: 'premium', subdomain: 'acme' }
)

// When updating a user
const user = await prisma.user.update({ ... })
await logUserActivity(
  user.id,
  'USER_UPDATED',
  currentTenantId,
  { newRole: 'admin', newStatus: 'active' }
)
```

### Best Practices

1. **Always include relevant details**: Provide context about what changed
2. **Use descriptive action names**: Use SNAKE_CASE for action types
3. **Don't log sensitive data**: Never log passwords or API keys in details
4. **Include user context**: Always log which user performed the action when available
5. **Async operation**: Activity logging is async and non-blocking - failures won't crash the app

## Viewing Activity Logs

### In Admin Dashboard
Navigate to any tenant's detail page → **Activity** tab to view:
- All actions performed on that tenant
- Who performed them and when
- Detailed change information
- Pagination support for large activity lists

### Database Queries

```sql
-- Get all activity for a tenant
SELECT * FROM activity_log WHERE tenantId = 1 ORDER BY createdAt DESC;

-- Get all user creation actions
SELECT * FROM activity_log WHERE action = 'USER_CREATED' ORDER BY createdAt DESC;

-- Get activity by user
SELECT * FROM activity_log WHERE userId = 5 ORDER BY createdAt DESC;

-- Get recent activity (last 24 hours)
SELECT * FROM activity_log 
WHERE createdAt >= NOW() - INTERVAL 1 DAY
ORDER BY createdAt DESC;
```

## Integration Checklist

✅ Tenant creation logging
✅ Tenant update logging  
✅ Tenant deactivation logging
✅ User creation logging
✅ User update logging
✅ Order creation logging
✅ Order status/payment update logging
✅ Product creation logging
✅ Product update logging
✅ Product deletion logging
✅ Activity fetch endpoint
✅ Admin dashboard Activity tab display
⬜ Employee management (future)
⬜ Subscription plan changes (future)
⬜ Authentication logs (future)
⬜ API access logs (future)

## Future Enhancements

### Planned Features
- **IP-based filtering**: Block suspicious activity
- **Audit report generation**: Export activity logs
- **Real-time alerts**: Notify on critical actions
- **Activity analytics**: Trend analysis and insights
- **Retention policies**: Auto-delete old logs
- **Performance optimization**: Archive historical data

### Suggested Integration Points
1. Order creation/updates
2. Product catalog changes
3. Employee role/permission changes
4. API key creation
5. Payment processing
6. Account subscription changes
7. Settings modifications
8. File uploads/deletions

## Troubleshooting

### Activities Not Appearing
1. Check database connection: `npx prisma db push`
2. Verify ActivityLog model exists: `npx prisma studio`
3. Check for errors in server logs
4. Ensure `logActivity` is being called

### Performance Issues
- Activity logging is async and non-blocking
- If needed, batch inserts or use a queue system (Redis, Bull)
- Consider archiving old logs (>6 months) to separate table

## Files Modified

- `lib/activityLogger.ts` - New activity logging utility
- `app/api/admin/tenants/[id]/route.ts` - Added logging to PUT/DELETE
- `app/api/admin/tenants/route.ts` - Added logging to POST
- `app/api/admin/users/route.ts` - Added logging to POST/PUT
- `app/admin/tenants/[id]/page.tsx` - Activity tab already implemented

## Next Steps

1. **Monitor the logs**: Check admin dashboard Activity tabs regularly
2. **Expand logging**: Add logging to more operations (orders, products, etc.)
3. **Set retention policy**: Decide how long to keep logs
4. **Create alerts**: Set up notifications for critical actions
5. **Generate reports**: Use logs for compliance and auditing
