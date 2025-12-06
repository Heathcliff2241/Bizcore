# Dashboard Settings System Implementation

## Overview
The dashboard settings system has been completely refactored to be cohesive with all dashboard components (Products, Customers, Orders, Inventory) and allows full customization of theme, typography, layout, and SEO across the entire dashboard.

## Architecture

### 1. **Settings API Routes** (`/app/api/settings/route.ts`)
- **GET**: Fetches tenant-specific settings from the database with sensible defaults
- **PUT**: Updates tenant settings in the database
- **Authentication**: All requests require valid session via NextAuth
- **Tenant Isolation**: All settings are scoped to the user's tenant using the same pattern as products/customers APIs

**Response Format:**
```json
{
  "success": true,
  "data": {
    "brandColors": {
      "primary": "#059669",
      "secondary": "#10b981",
      "accent": "#34d399",
      "background": "#ffffff",
      "surface": "#f9fafb",
      "text": "#111827"
    },
    "typography": {
      "titleFont": "Inter",
      "textFont": "Inter",
      "contentFont": "Inter"
    },
    "layout": {
      "headerStyle": "modern",
      "footerStyle": "minimal",
      "sectionSpacing": "comfortable"
    },
    "seo": {
      "metaTitle": "Dashboard",
      "metaDescription": "Welcome to your dashboard",
      "keywords": ""
    }
  }
}
```

### 2. **Settings Context Provider** (`/lib/settings-context.tsx`)
Provides global access to settings across all dashboard components via React Context.

**Features:**
- `useSettings()` hook for consuming settings in any component
- Automatic fetch on mount
- Update function to save changes back to API
- Error handling with redirect to signin on 401
- Loading and error states

**Types Exported:**
- `DashboardSettings` - Main settings interface
- `BrandColors`, `Typography`, `Layout`, `SEO` - Individual setting sections

**Usage in Components:**
```tsx
import { useSettings } from '@/lib/settings-context';

export function MyComponent() {
  const { settings, loading, updateSettings } = useSettings();
  
  // Use settings.brandColors.primary, etc.
}
```

### 3. **Settings Page Component** (`/app/dashboard/settings/page.tsx`)
Fully refactored with proper TypeScript, no API_ENDPOINTS, and cohesive design.

**Features:**
- **Tab-based UI**: Brand Colors, Typography, Layout, SEO
- **Live Preview**: Color pickers with hex input
- **Unsaved Changes Detection**: Only shows save/cancel buttons when changes made
- **Success/Error Notifications**: Toast-style feedback with Framer Motion
- **Accessible**: Proper labels, ARIA attributes, keyboard navigation

**Tab Details:**
1. **Brand Colors** - Customize all dashboard colors (primary, secondary, accent, background, surface, text)
2. **Typography** - Choose fonts (Inter, SF Pro Display, Roboto, Open Sans, Lato, Poppins)
3. **Layout** - Configure header style, footer style, section spacing
4. **SEO** - Set meta title, description, and keywords

### 4. **Dashboard Layout Integration** (`/app/dashboard/layout.tsx`)
Wrapped with `SettingsProvider` to make settings available to all child dashboard pages.

**Provider Hierarchy:**
```
SettingsProvider
  └─ ThemeProvider
      └─ Dashboard Pages (Products, Customers, Orders, Inventory, Settings)
```

## How It Works

### Data Flow

1. **User Navigates to Settings**
   - Dashboard layout renders with SettingsProvider
   - SettingsProvider fetches settings from `/api/settings` on mount
   - Settings are stored in React Context state

2. **User Modifies Settings**
   - Settings page uses local state to track unsaved changes
   - Changes only affect local state until save is clicked

3. **User Saves Settings**
   - Settings page calls `updateSettings()` hook function
   - Hook sends PUT request to `/api/settings` with new settings
   - API validates, updates database via Prisma
   - Success response updates context state
   - All components subscribed via `useSettings()` automatically re-render

4. **Components Use Settings**
   - Any dashboard component can import `useSettings()`
   - Accesses current settings from context
   - Can call `updateSettings()` to trigger saves

### Multi-Tenancy
- Settings are stored in `Tenant.settings` JSON field
- `getTenantId()` function ensures user can only access their tenant's settings
- Each tenant has isolated, independent settings

## Integration Points

### Current Components Ready to Use Settings
- Products page - Can apply custom colors to UI
- Customers page - Can apply custom colors and layouts
- Inventory page - Can apply custom settings
- Orders page - Can apply custom settings

### Example: Using Settings in a Component

```tsx
import { useSettings } from '@/lib/settings-context';

export default function ProductsManager() {
  const { settings } = useSettings();
  
  return (
    <button
      style={{ 
        backgroundColor: settings.brandColors.primary,
        fontFamily: settings.typography.textFont 
      }}
    >
      Add Product
    </button>
  );
}
```

## Files Created/Modified

### Created:
- `/app/api/settings/route.ts` - Settings API endpoints
- `/lib/settings-context.tsx` - Settings context and hooks

### Modified:
- `/app/dashboard/settings/page.tsx` - Complete refactor with TypeScript and proper design
- `/app/dashboard/layout.tsx` - Wrapped with SettingsProvider

## Type Safety

All components use proper TypeScript interfaces:
```tsx
interface DashboardSettings {
  brandColors: BrandColors;
  typography: Typography;
  layout: Layout;
  seo: SEO;
}

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

// ... more interfaces for each setting section
```

## Error Handling

- **401 Unauthorized**: Redirects user to sign-in page
- **403 Forbidden**: User not associated with tenant
- **500 Server Error**: Shows error banner with message
- **Network Errors**: Graceful handling with user feedback

## Next Steps to Enhance

1. **Apply Settings to Components**: Update Products, Customers, Orders, Inventory pages to actually use the theme colors
2. **CSS-in-JS Variables**: Export settings as CSS variables for global theme application
3. **Preset Themes**: Pre-built theme presets users can select
4. **Dark Mode**: Add dark mode toggle in settings
5. **Analytics**: Track which tenants customize which settings

## Testing the Implementation

1. Sign in to dashboard
2. Navigate to Settings page
3. Change colors in "Brand Colors" tab
4. Change fonts in "Typography" tab
5. Modify layout options in "Layout" tab
6. Add SEO metadata in "SEO" tab
7. Click "Save Settings"
8. Verify success message appears
9. Refresh page - settings persist from database
10. Check other dashboard pages - they can now access the new settings via `useSettings()`
