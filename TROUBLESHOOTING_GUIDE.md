# BizCore Nginx & HTTPS Troubleshooting Guide

**Quick Links**:
- [Issue 1: bizcore.test Not Accessible](#issue-1-bizcoretest-not-accessible)
- [Issue 2: Login/Logout Broken on HTTPS](#issue-2-logoutlogin-broken-on-https)
- [Testing Checklist](#-testing-checklist)
- [Environment Setup](#environment-setup)

---

## Issue 1: bizcore.test Not Accessible

### Symptoms
- Cannot reach `http://bizcore.test` 
- Getting "Cannot resolve host" or "Connection refused"
- `localhost:3000` works fine, but domain doesn't

### Root Cause
1. **Missing hosts file entry** - Windows/Mac/Linux DNS doesn't know about `.test` domain
2. **Nginx not routing properly** - Container upstream pointing to wrong location
3. **Port binding issues** - Nginx not listening on port 80

### Quick Fix (Development)

#### Step 1: Add Hosts Entry

**Windows (Admin Terminal)**:
```powershell
# Run as Administrator
Add-Content C:\Windows\System32\drivers\etc\hosts "`n127.0.0.1   bizcore.test"
Add-Content C:\Windows\System32\drivers\etc\hosts "`n::1         bizcore.test"

# Verify
Get-Content C:\Windows\System32\drivers\etc\hosts | findstr bizcore
```

**Mac/Linux**:
```bash
# Edit /etc/hosts
sudo nano /etc/hosts

# Add these lines:
127.0.0.1   bizcore.test
::1         bizcore.test

# Save (Ctrl+O, Enter, Ctrl+X)
```

#### Step 2: Verify DNS Resolution

```powershell
# Windows
nslookup bizcore.test
ping bizcore.test

# Mac/Linux
dig bizcore.test
ping bizcore.test
```

Should show `127.0.0.1` or `::1`

#### Step 3: Verify Nginx is Running

```bash
# Check if containers are running
docker ps | grep nginx

# If not running, start docker compose
docker-compose up -d

# Check nginx logs
docker logs bizcore_nginx

# Test nginx directly
curl -v http://127.0.0.1
```

#### Step 4: Test Access

```bash
# Test with curl
curl -v http://bizcore.test

# If that works, test in browser
# http://bizcore.test

# If 502 Bad Gateway, check that Next.js is running on localhost:3000
curl http://localhost:3000
```

### Debugging Commands

```bash
# Test connection to backend from nginx container
docker exec bizcore_nginx curl http://host.docker.internal:3000

# Check nginx configuration
docker exec bizcore_nginx nginx -t

# View nginx config being used
docker exec bizcore_nginx cat /etc/nginx/conf.d/bizcore-dev.conf | grep -A 5 "proxy_pass"

# Monitor access logs
docker logs -f bizcore_nginx | grep access

# Check DNS inside container
docker exec bizcore_nginx nslookup host.docker.internal
```

---

## Issue 2: Login/Logout Broken on HTTPS

### Symptoms
- Authentication fails with HTTPS
- Session not persisting 
- "Cannot verify session" errors
- Cookie is not being set
- Login redirects to blank page

### Root Cause
The fundamental issue: **Protocol mismatch**
- Environment variables are set to `http://bizcore.test`
- But you're accessing via `https://bizcore.test`
- NextAuth cookies are marked as non-secure (HTTP only)
- HTTPS browsers reject non-secure cookies

### Why This Happens

**The Chain of Failures**:
1. `.env` says `NEXTAUTH_URL="http://bizcore.test"`
2. User accesses `https://bizcore.test`
3. NextAuth thinks it's HTTP, sets cookies without Secure flag
4. Browser rejects insecure cookies on HTTPS connection
5. Session is lost, user stays logged out

### Quick Fix (Production HTTPS)

#### Step 1: Create/Update Environment File

Create `.env.local` or `.env.production`:

```env
# HTTPS Configuration for production
NODE_ENV="production"
NEXTAUTH_URL="https://bizcore.test"
NEXT_PUBLIC_APP_URL="https://bizcore.test"
NEXTAUTH_SECRET="AB9WGL7qOdAEjjiddBNq/jHImha995xz8QoyYYxhnYg="

# CRITICAL: Cookie security settings for HTTPS
NEXTAUTH_COOKIE_SECURE="true"
NEXTAUTH_COOKIE_SAME_SITE="lax"
NEXTAUTH_COOKIE_DOMAIN=".bizcore.test"

# Optional but recommended
FORCE_HSTS="true"
```

#### Step 2: Ensure SSL Certificates Exist

For nginx to serve HTTPS, it needs certificates at:
- `nginx/ssl/cert.pem`
- `nginx/ssl/key.pem`

**For Local Testing** (self-signed):
```bash
# Generate self-signed certificate
cd nginx/ssl

# Windows PowerShell
New-SelfSignedCertificate -DnsName "bizcore.test" -CertStoreLocation "cert:\CurrentUser\My" | Export-PfxCertificate -FilePath "cert.pfx" -Password (ConvertTo-SecureString -String "password" -AsPlainText -Force)

# Convert to PEM format
openssl pkcs12 -in cert.pfx -out cert.pem -nodes -password pass:password

# Or directly with OpenSSL:
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out cert.pem \
  -subj "/CN=bizcore.test/O=BizCore/C=US"
```

**For Production** (Let's Encrypt):
```bash
# Using certbot in Docker
docker run -it --rm -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
  -p 80:80 -p 443:443 \
  certbot/certbot certonly --standalone \
  -d bizcore.test \
  -m admin@bizcore.dev \
  --agree-tos
```

#### Step 3: Start with HTTPS Configuration

```powershell
# Using the updated start-prod.ps1 script
.\scripts\start-prod.ps1 -Mode compose -Domain bizcore.test -SkipCertbot

# Or manually set env and start
$env:NODE_ENV = "production"
$env:NEXTAUTH_URL = "https://bizcore.test"
$env:NEXTAUTH_COOKIE_SECURE = "true"
$env:NEXTAUTH_COOKIE_SAME_SITE = "lax"

npm run build
npm run start
```

#### Step 4: Verify HTTPS is Working

```bash
# Test with curl (ignore self-signed cert warning)
curl -k -v https://bizcore.test

# Check response headers include Secure cookie
curl -k -v https://bizcore.test/api/auth/signin 2>&1 | grep -i "set-cookie"

# You should see something like:
# Set-Cookie: next-auth.session-token=...; Path=/; Secure; HttpOnly; SameSite=Lax
```

### Advanced Debugging

#### Check Next.js Auth Configuration

```typescript
// lib/auth.ts or your auth config
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('Cookie Secure:', process.env.NEXTAUTH_COOKIE_SECURE)

// The auth options should have:
const authOptions = {
  // ...
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        secure: process.env.NEXTAUTH_COOKIE_SECURE === 'true',  // ← This must be true
        sameSite: 'lax',
        path: '/',
      },
    },
  },
}
```

#### Monitor Network Traffic

```bash
# In browser DevTools, Network tab:
# 1. Go to https://bizcore.test/auth/signin
# 2. Look for Set-Cookie headers in response
# 3. Cookie should have these flags:
#    - Secure ✓
#    - HttpOnly ✓
#    - SameSite=Lax ✓

# If missing, environment variables are not being read correctly
```

#### Check Nginx Headers

```bash
# Verify nginx is passing protocol header
docker exec bizcore_nginx curl -v http://localhost \
  -H "Host: bizcore.test" \
  -H "X-Forwarded-Proto: https"

# Look for response headers showing secure protocol is detected
```

---

## 🧪 Testing Checklist

### For Development (HTTP, bizcore.test)

- [ ] Hosts file has `127.0.0.1 bizcore.test`
- [ ] DNS resolves: `ping bizcore.test` works
- [ ] Docker running: `docker ps` shows bizcore_nginx
- [ ] Next.js running: `curl http://localhost:3000` returns HTML
- [ ] Nginx working: `curl http://127.0.0.1` returns content
- [ ] Domain works: `curl http://bizcore.test` returns content
- [ ] Can access in browser: `http://bizcore.test`
- [ ] Login/logout works with HTTP
- [ ] Cookies are being set: `document.cookie` shows session-token
- [ ] No HTTPS redirect loop

### For Production (HTTPS, bizcore.test)

- [ ] Hosts file has `127.0.0.1 bizcore.test` and `::1 bizcore.test`
- [ ] SSL certificates exist: `ls nginx/ssl/cert.pem nginx/ssl/key.pem`
- [ ] `.env` has `NEXTAUTH_URL="https://bizcore.test"`
- [ ] `.env` has `NEXTAUTH_COOKIE_SECURE="true"`
- [ ] Docker running: `docker ps` shows bizcore_nginx
- [ ] HTTPS works: `curl -k https://bizcore.test` returns content
- [ ] Can access in browser: `https://bizcore.test`
- [ ] No SSL certificate warnings (self-signed is OK for testing)
- [ ] Login page loads: `https://bizcore.test/auth/signin`
- [ ] Can enter credentials
- [ ] Session cookie set: Browser DevTools → Application → Cookies
- [ ] Session cookie has Secure flag
- [ ] Can access protected pages after login
- [ ] Logout works and clears session
- [ ] No "Cannot verify session" errors

### API Testing

```bash
# Test auth endpoint
curl -k -v https://bizcore.test/api/auth/signin

# Check response headers
curl -k -v https://bizcore.test/api/auth/session

# Expected response:
# {
#   "user": {
#     "id": "...",
#     "email": "..."
#   }
# }

# If null or error, session is not being maintained
```

---

## Environment Setup

### Development Setup

```powershell
# 1. Add hosts entry
Add-Content C:\Windows\System32\drivers\etc\hosts "`n127.0.0.1   bizcore.test"

# 2. Copy .env.example to .env (or use existing .env)
# Make sure it has HTTP (not HTTPS)

# 3. Start Docker
docker-compose up -d

# 4. Start Next.js (in another terminal)
npm run dev

# 5. Access
# http://bizcore.test
```

### Production Setup

```powershell
# 1. Add hosts entries
Add-Content C:\Windows\System32\drivers\etc\hosts "`n127.0.0.1   bizcore.test"
Add-Content C:\Windows\System32\drivers\etc\hosts "`n::1         bizcore.test"

# 2. Generate SSL certificates (if using self-signed)
cd nginx/ssl
# Use the OpenSSL command from Step 2 above

# 3. Update .env.production with HTTPS config
# Copy from .env.production file in repo

# 4. Start with production script
.\scripts\start-prod.ps1 -Mode compose -Domain bizcore.test -SkipCertbot

# 5. Access
# https://bizcore.test
```

---

## 🔗 Related Files

- **Configuration**: `.env`, `.env.production`, `.env.local`
- **Nginx**: `nginx/nginx.conf`, `nginx/conf.d/bizcore-dev.conf`, `nginx/conf.d/bizcore-secure.conf`
- **Auth**: `lib/auth.ts`, `middleware.ts`, `types/next-auth.d.ts`
- **Scripts**: `scripts/start-prod.ps1`, `scripts/start-prod-compose.ps1`
- **Docker**: `docker-compose.yml`, `docker-compose.prod.yml`, `Dockerfile`

---

## 📞 Support & Further Issues

If issues persist:

1. **Check logs**:
   ```bash
   docker logs bizcore_nginx
   docker logs bizcore_postgres
   # And Next.js console output
   ```

2. **Verify environment**:
   ```bash
   # Inside Docker
   docker exec -it $(docker ps -q -f "ancestor=node:20") printenv | grep NEXTAUTH
   ```

3. **Test components individually**:
   - Next.js: `curl http://localhost:3000`
   - Nginx: `curl http://127.0.0.1`
   - DNS: `nslookup bizcore.test`

4. **Check connectivity**:
   ```bash
   docker exec bizcore_nginx ping host.docker.internal
   docker exec bizcore_nginx curl http://host.docker.internal:3000
   ```

---

**Last Updated**: December 1, 2025  
**Status**: Active - Use this guide for troubleshooting
