# BizCore Nginx & HTTPS Issues - Analysis & Solutions

**Date**: December 1, 2025  
**Status**: Issue Tracking & Resolution Guide

---

## 📋 Issues Summary

### Issue 1: `bizcore.test` Not Accessible via Nginx
- **Problem**: `bizcore.test` domain is not properly resolving through nginx, preventing access to the app
- **Root Cause**: DNS resolution and/or nginx upstream configuration issues
- **Impact**: Cannot test with proper domain name instead of localhost:3000

### Issue 2: Login/Logout Broken on HTTPS Production
- **Problem**: Authentication fails when running on HTTPS in production mode
- **Root Cause**: Cookie security settings and NEXTAUTH session configuration conflicts
- **Impact**: Users cannot authenticate or sign out when using HTTPS

---

## 🔍 Root Cause Analysis

### Issue 1: bizcore.test Not Accessible

#### Recent Changes Contributing to Problem:

1. **`.env` File Changes** (From git diff):
   ```diff
   - NEXTAUTH_URL="http://localhost:3000"
   + NEXTAUTH_URL="http://bizcore.test"  ← Changed from localhost
   + NEXT_PUBLIC_APP_URL="http://bizcore.test"
   + NEXT_PUBLIC_BRANDSTUDIO_URL="http://bizcore.test/studio"
   ```
   **Impact**: App now expects to be accessed via `bizcore.test`, but nginx routing may not be working

2. **Nginx Configuration Issues**:
   - Both `bizcore-dev.conf` and `bizcore-secure.conf` use `host.docker.internal:3000` as upstream
   - In development mode, this only works if Next.js is running on the host machine
   - The configuration **doesn't handle** proper DNS resolution of `bizcore.test`

3. **Missing `/etc/hosts` Entry** (On Windows/host machine):
   ```hosts
   127.0.0.1   bizcore.test
   ```
   This must be added to access the domain locally

#### How to Fix Issue 1:

**Step 1: Add hosts entry**
```powershell
# Windows (run as Administrator)
# Add to C:\Windows\System32\drivers\etc\hosts
127.0.0.1   bizcore.test
::1         bizcore.test
```

**Step 2: Ensure nginx is routing correctly**
- If running nginx in Docker: Container must map ports correctly
- If running nginx locally: Ensure it's listening on 80/443
- Check docker-compose.prod.yml ports:
  ```yaml
  nginx:
    ports:
      - "80:80"
      - "443:443"
  ```

**Step 3: Verify Next.js is accessible**
```bash
# Test direct connection to Next.js
curl http://localhost:3000

# Test through nginx
curl http://bizcore.test  # Only works after adding hosts entry
```

**Step 4: Verify nginx is serving correctly**
```bash
# Check if nginx is running
docker ps | grep nginx

# Check nginx logs
docker logs bizcore_nginx

# Test from inside nginx container
docker exec bizcore_nginx curl http://host.docker.internal:3000
```

---

### Issue 2: Login/Logout Broken on HTTPS

#### Root Causes:

1. **Cookie Security Mismatch**:
   ```typescript
   // From middleware.ts
   const forwardedProto = request?.headers.get('x-forwarded-proto') || ''
   const isSecureRequest = forwardedProto === 'https' || ...
   ```
   - When HTTPS is detected, HSTS header is added
   - BUT: Cookie settings may not match (secure vs insecure)

2. **NEXTAUTH_URL vs Actual Protocol**:
   ```env
   # .env file
   NEXTAUTH_URL="http://bizcore.test"  ← HTTP in .env
   ```
   - Even when accessed via HTTPS, app thinks it's HTTP
   - NextAuth cookies are set without `Secure` flag for HTTP
   - But HTTPS blocks these insecure cookies

3. **NEXTAUTH Cookie Configuration**:
   ```typescript
   // Should be set but missing from .env
   NEXTAUTH_COOKIE_SECURE="true"       ← Missing!
   NEXTAUTH_COOKIE_SAME_SITE="lax"     ← Missing!
   ```

4. **Nginx Not Passing Protocol Correctly**:
   ```nginx
   # In bizcore-secure.conf
   proxy_set_header X-Forwarded-Proto $scheme;  ✓ Correct
   # But the upstream handler may not be reading it properly
   ```

#### How to Fix Issue 2:

**Solution A: Update .env for Production HTTPS**
```env
# .env.prod (for HTTPS)
NODE_ENV="production"
NEXTAUTH_URL="https://bizcore.test"
NEXT_PUBLIC_APP_URL="https://bizcore.test"
NEXTAUTH_COOKIE_SECURE="true"
NEXTAUTH_COOKIE_SAME_SITE="lax"
NEXTAUTH_SECRET="<your-stable-secret>"
```

**Solution B: Update start-prod.ps1 to set correct environment**
```powershell
# Modify the Mode = 'compose' section:
if ($Mode -eq 'compose') {
  # For HTTPS:
  $env:NEXTAUTH_URL = "https://$Domain"
  $env:NEXT_PUBLIC_APP_URL = "https://$Domain"
  $env:NEXTAUTH_COOKIE_SECURE = 'true'
  $env:NEXTAUTH_COOKIE_SAME_SITE = 'lax'
  
  # For HTTP (development):
  # $env:NEXTAUTH_COOKIE_SECURE = 'false'
}
```

**Solution C: Fix auth configuration handler**
- Ensure `lib/auth.ts` (or similar) reads these variables:
```typescript
const authOptions = {
  // ...
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        secure: process.env.NEXTAUTH_COOKIE_SECURE === 'true',
        sameSite: process.env.NEXTAUTH_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none' || 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
}
```

**Solution D: Verify Nginx is Passing Headers**
Check that nginx config passes these headers:
```nginx
# In all location blocks:
proxy_set_header X-Forwarded-Proto $scheme;  ✓
proxy_set_header X-Forwarded-Host $host;     ✓
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  ✓
proxy_set_header X-Real-IP $remote_addr;     ✓
```

---

## 📊 Git History of Changes

### Recent commits affecting these issues:

1. **`.env` changes** - Changed NEXTAUTH_URL from localhost to bizcore.test
2. **`docker-compose.prod.yml`** - Added nginx container with port mappings
3. **Nginx configs** - Added bizcore-dev.conf and bizcore-secure.conf
4. **`start-prod.ps1`** - New production startup script
5. **Package updates** - Added various dependencies

### Key Git Diff Points:

```
Commit: Changed NEXTAUTH_URL configuration
- NEXTAUTH_URL="http://localhost:3000"
+ NEXTAUTH_URL="http://bizcore.test"

Commit: Docker Compose changes
- Added nginx service with upstream to host.docker.internal:3000
- Added 80/443 port mappings

Commit: Environment changes
+ NEXTAUTH_COOKIE_SECURE and related variables NOT added
+ This is the gap causing HTTPS issues!
```

---

## ✅ Recommended Quick Fixes

### For Development (HTTP, bizcore.test):

```powershell
# 1. Add hosts entry (Windows, run as Admin):
Add-Content C:\Windows\System32\drivers\etc\hosts "127.0.0.1   bizcore.test"

# 2. Start docker with dev config:
docker-compose up -d

# 3. Verify nginx is running:
docker ps

# 4. Test access:
curl http://bizcore.test
```

### For Production (HTTPS):

```powershell
# 1. Create .env.prod:
NEXTAUTH_URL="https://bizcore.test"
NEXTAUTH_COOKIE_SECURE="true"
NEXTAUTH_COOKIE_SAME_SITE="lax"
NODE_ENV="production"

# 2. Generate or provide SSL certificates to nginx/ssl/
# 3. Start with production config:
.\scripts\start-prod.ps1 -Mode compose -Domain bizcore.test

# 4. Verify HTTPS:
curl --insecure https://bizcore.test
```

---

## 🔧 Configuration Checklist

- [ ] **Hosts File**: Add `127.0.0.1 bizcore.test` to system hosts
- [ ] **Docker**: Ensure containers are running (`docker ps`)
- [ ] **Next.js**: Verify running on `localhost:3000`
- [ ] **Nginx**: Verify listening on port 80/443
- [ ] **NEXTAUTH_URL**: Matches the protocol (http vs https)
- [ ] **Cookie Settings**: `NEXTAUTH_COOKIE_SECURE` matches protocol
- [ ] **SSL Certificates**: Exist at `nginx/ssl/cert.pem` and `nginx/ssl/key.pem`
- [ ] **Proxy Headers**: `X-Forwarded-Proto` passed through nginx
- [ ] **Firewall**: Port 80/443 accessible locally

---

## 🧪 Testing Commands

```bash
# Test DNS resolution
nslookup bizcore.test
ping bizcore.test

# Test nginx directly
curl -v http://bizcore.test

# Test with verbose output to see headers
curl -v -H "Host: bizcore.test" http://127.0.0.1

# Test HTTPS (if cert exists)
curl -k https://bizcore.test

# Test from Docker container
docker exec bizcore_nginx curl -v http://host.docker.internal:3000

# Check nginx error logs
docker logs bizcore_nginx -f

# Check Next.js server
curl http://localhost:3000
```

---

## 📝 Summary Table

| Issue | Root Cause | Solution | Priority |
|-------|-----------|----------|----------|
| **bizcore.test not accessible** | Missing `/etc/hosts` entry + DNS resolution | Add hosts entry, verify nginx upstream | HIGH |
| **Nginx not routing** | Upstream config points to docker internal | Use `host.docker.internal` or adjust | HIGH |
| **Login broken on HTTPS** | `NEXTAUTH_URL` is HTTP but accessed via HTTPS | Set HTTPS in .env + cookie security flags | CRITICAL |
| **Cookies rejected on HTTPS** | `NEXTAUTH_COOKIE_SECURE` not set | Set to `true` for HTTPS, `false` for HTTP | CRITICAL |
| **HSTS header issues** | Middleware adds HSTS but cookies don't match | Ensure cookie security matches protocol | MEDIUM |

---

## 🚀 Next Steps

1. **Immediate**: Add hosts entry and test HTTP access
2. **Short-term**: Fix .env configuration for HTTPS
3. **Long-term**: Implement environment-specific config management
4. **Documentation**: Update README with setup instructions

---

**Created**: 2025-12-01  
**Last Updated**: 2025-12-01  
**Status**: Analysis Complete - Implementation Pending
