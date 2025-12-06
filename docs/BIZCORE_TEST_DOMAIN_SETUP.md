# BizCore.test Domain Setup Guide

## Overview
BizCore has been updated to support accessing the app via **`bizcore.test`** as the primary domain instead of `localhost:3000`. This provides a more production-like environment during development.

## What Was Changed

### 1. Environment Variables
**Files Updated:**
- `.env`
- `.env.local`

**Key Changes:**
```dotenv
# Old
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BRANDSTUDIO_URL="http://localhost:5173"

# New
NEXTAUTH_URL="http://bizcore.test"
NEXT_PUBLIC_APP_URL="http://bizcore.test"
NEXT_PUBLIC_BRANDSTUDIO_URL="http://bizcore.test/studio"
```

### 2. Next.js Configuration
**File:** `next.config.js`

Added support for multiple image domains and flexible CORS headers:
- `bizcore.test`
- `localhost`
- `127.0.0.1`

### 3. Nginx Configuration
**File:** `nginx/conf.d/bizcore-dev.conf`

Updated server_name to accept both domains:
```nginx
server_name bizcore.test localhost 127.0.0.1;
```

### 4. BrandStudio Vite Configuration
**File:** `brandstudio-vite/vite.config.ts`

Updated CORS origins to accept:
- `http://bizcore.test`
- `http://localhost:3000`
- `http://localhost:5174`
- `http://localhost:5173`

### 5. New URL Helper Library
**File:** `lib/getAppUrl.ts`

Created utility functions for dynamic URL handling:
- `getAppUrl()` - Returns the current app URL based on context
- `getBrandStudioUrl()` - Returns the BrandStudio URL
- `getPostMessageOrigin()` - Returns the proper origin for iframe postMessage
- `getBrandStudioIframeUrl(params)` - Generates complete iframe URL with query params

### 6. Updated Components
Updated hardcoded URLs in:
- `app/admin/brandstudio/page.tsx` - Uses `getBrandStudioUrl()`
- `app/dashboard/[subdomain]/layout.tsx` - Uses `getBrandStudioIframeUrl()`
- `app/dashboard/[subdomain]/brandstudio/page.tsx` - Uses dynamic URL helpers

### 7. Updated API Routes
Made CORS headers flexible in:
- `app/api/pages/route.ts` - Dynamic CORS header function
- `app/api/pages/[id]/route.ts` - Dynamic CORS header function

## Setup Instructions

### Step 1: Update Hosts File
Add `bizcore.test` to your hosts file to resolve locally:

**Windows (Admin PowerShell):**
```powershell
Add-Content -Path "$env:windir\System32\drivers\etc\hosts" -Value "127.0.0.1    bizcore.test"
```

Or manually edit `C:\Windows\System32\drivers\etc\hosts` and add:
```
127.0.0.1    bizcore.test
```

**Mac/Linux:**
```bash
sudo echo "127.0.0.1    bizcore.test" >> /etc/hosts
```

### Step 2: Restart Docker Services
After updating nginx config, restart the nginx container:
```bash
docker-compose restart
```

Or rebuild if changes aren't picked up:
```bash
docker-compose down -v
docker-compose up -d
```

### Step 3: Access the Application
**Via Nginx (Recommended for development):**
- Main App: `http://bizcore.test`
- BrandStudio: `http://bizcore.test/studio`

**Direct Access (Fallback):**
- Next.js: `http://localhost:3000`
- BrandStudio Vite: `http://localhost:5173` or `http://localhost:5174`

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  Browser                                │
│  http://bizcore.test                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Nginx Container (Port 80)              │
│  - Serves bizcore.test                  │
│  - Proxies to host.docker.internal:3000 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Next.js Dev Server (localhost:3000)    │
│  - Main BizCore app                     │
│  - API routes                           │
│  - BrandStudio iframe mount point       │
└─────────────────────────────────────────┘
```

## Dynamic URL Resolution

The app now intelligently detects the current domain:

### Server-Side (Node.js)
```typescript
getAppUrl() // Returns process.env.NEXT_PUBLIC_APP_URL or 'http://bizcore.test'
```

### Client-Side (Browser)
```typescript
getAppUrl() // Returns window.location (respects current URL)
```

This ensures that if you access the app via `localhost:3000`, it uses that URL. If you access via `bizcore.test`, it uses that.

## Troubleshooting

### Issue: `bizcore.test` not resolving
**Solution:** Make sure you added it to your hosts file and the entry points to `127.0.0.1`

### Issue: CORS errors when accessing BrandStudio
**Solution:** The CORS headers now dynamically accept the origin from the request. Make sure nginx is restarted.

### Issue: Iframe postMessage not working
**Solution:** The `getPostMessageOrigin()` function now handles multiple domains. Check browser console for details.

### Issue: Want to use localhost:3000 instead
**Solution:** You can still access the app directly at `http://localhost:3000`. All URL generation is now dynamic and domain-agnostic.

## Environment Fallbacks

If `NEXT_PUBLIC_APP_URL` is not set in environment:
- Server-side: Falls back to `http://bizcore.test`
- Client-side: Uses `window.location` (current browser URL)

This ensures the app works in both scenarios:
1. Via nginx proxy (bizcore.test)
2. Direct access (localhost:3000)

## Next Steps

### Optional: Add SSL/TLS
To use `https://bizcore.test`, refer to the nginx SSL configuration guide in `docs/NGINX_SECURITY_HARDENING.md`

### Optional: Update Documentation
Update any deployment docs or dev setup guides to reference `bizcore.test` instead of `localhost:3000`

### Testing
Verify everything works:
1. Visit `http://bizcore.test` in browser
2. Navigate to `/admin/brandstudio` and verify BrandStudio loads
3. Check browser console for any CORS or origin-related errors
4. Test BrandStudio iframe communication and postMessage functionality
