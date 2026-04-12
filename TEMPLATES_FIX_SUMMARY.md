# Fix: Admin Templates Not Showing in BrandStudio Tenant Templates Tab

## Problem
Admin-created templates were not appearing in the BrandStudio templates tab when accessed by tenant users. This was a **permissions/access control issue**.

## Root Cause Analysis

### The Issue:
- **TemplateLibrary Component** (BrandStudio) was calling `/api/admin/templates`
- This endpoint **requires admin role** to access
- Tenant users don't have admin role, so they got a **403 Forbidden error**
- Result: No templates showed up for tenant users

### The Permission Hierarchy:
```
User Roles:
├── admin (can access /api/admin/*)
├── customer
├── tenant user (employee/owner at tenant)
└── viewer
```

The `/api/admin/templates` endpoint explicitly checked:
```typescript
if (session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## Solution Implemented

### 1. Created New Tenant-Accessible Endpoint
**File**: `app/api/templates/route.ts`

```typescript
// GET /api/templates - Public endpoint for authenticated users to fetch published admin templates
export async function GET(request: NextRequest) {
  // Only requires authenticated session (no role check)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetches published admin templates (tenantId = null, isPublished = true)
  const templates = await prisma.page.findMany({
    where: {
      tenantId: null,        // Admin templates
      isPublished: true,     // Only published templates visible
    },
    // ... returns formatted template data
  })
}
```

**Key Design Decisions:**
- ✅ Only authenticated users needed (no role restriction)
- ✅ Only returns **published** templates (admins can draft but not share until published)
- ✅ Fetches from `Page` table where `tenantId = null` (admin templates)
- ✅ Includes logging for debugging

### 2. Updated TemplateLibrary Component
**File**: `brandstudio-vite/src/components/Editor/TemplateLibrary.tsx`

**Changes:**
1. **Changed endpoint**: `/api/admin/templates` → `/api/templates`
2. **Added comprehensive logging** for debugging:
   ```typescript
   console.log('[TemplateLibrary] Fetching templates from /api/templates')
   console.log('[TemplateLibrary] Response status:', response.status)
   console.log('[TemplateLibrary] Fetched templates:', data)
   ```

3. **Improved error handling**:
   - Logs full error response text on failure
   - Better error messages for users
   - Handles both old and new response formats

4. **Fixed content parsing** in `handleAddTemplate`:
   - Handles multiple content structure formats:
     - Array of components: `[{...}, {...}]`
     - Object with components: `{ components: [...] }`
     - Object with sections: `{ sections: [...] }`
     - Single component
   - Much more robust and flexible

## Testing the Fix

### For Admin (Creating Templates):
1. Go to `/admin/templates`
2. Click "Open BrandStudio"
3. Design your template
4. Save and **publish** the template
5. Verify in database that template has `isPublished = true`

### For Tenant User (Using Templates):
1. Log in as tenant user
2. Open BrandStudio for your storefront
3. Go to Templates tab
4. Should now see all published admin templates
5. Click any template to add to your page

### Debugging:
- Check browser console for `[TemplateLibrary]` logs
- Check server console for `[TEMPLATES GET]` logs
- Verify template status: `SELECT * FROM pages WHERE "tenantId" IS NULL AND "isPublished" = true`

## API Comparison

| Endpoint | Role Required | Visibility | Use Case |
|----------|---------------|-----------|----------|
| `/api/admin/templates` | admin | Draft & published templates | Admin management UI |
| `/api/templates` | Any authenticated user | Published templates only | BrandStudio template library |

## Files Modified

1. **Created**: `app/api/templates/route.ts` (NEW)
   - Tenant-accessible endpoint for published templates
   - 62 lines

2. **Updated**: `brandstudio-vite/src/components/Editor/TemplateLibrary.tsx`
   - Changed fetch endpoint
   - Added comprehensive logging
   - Improved error handling
   - Fixed content parsing logic

## Architecture Benefits

✅ **Separation of Concerns**: Admin management vs. tenant access
✅ **Security**: Only published templates visible to tenants
✅ **Flexibility**: Multiple template content formats supported
✅ **Debuggability**: Comprehensive logging at both API and component levels
✅ **User Experience**: Clear error messages, proper loading states

## Future Enhancements

- Add template categories/tags for better organization
- Implement template ratings/favorites
- Add template preview screenshots
- Template versioning for updates
- Share button to publish drafted templates
