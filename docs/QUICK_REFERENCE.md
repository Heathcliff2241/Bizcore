# BizCore Nginx & HTTPS Quick Reference

## Issue 1️⃣: bizcore.test Not Working

**Problem**: Can't access `http://bizcore.test`  
**Fix**: Add hosts entry

```powershell
# Windows (Admin)
Add-Content C:\Windows\System32\drivers\etc\hosts "`n127.0.0.1   bizcore.test"

# Verify
ping bizcore.test
```

---

## Issue 2️⃣: Login Broken on HTTPS

**Problem**: Authentication fails when using `https://bizcore.test`  
**Fix**: Update environment variables

```env
# .env.local or .env.production
NEXTAUTH_URL="https://bizcore.test"           # ← HTTPS not HTTP!
NEXTAUTH_COOKIE_SECURE="true"                 # ← For HTTPS
NEXTAUTH_COOKIE_SAME_SITE="lax"
```

---

## ⚡ Quick Start

### Development (HTTP)
```powershell
# 1. Add hosts
Add-Content C:\Windows\System32\drivers\etc\hosts "`n127.0.0.1   bizcore.test"

# 2. Start Docker
docker-compose up -d

# 3. Start Next.js
npm run dev

# 4. Access
# http://bizcore.test
```

### Production (HTTPS)
```powershell
# 1. Add hosts
Add-Content C:\Windows\System32\drivers\etc\hosts "`n127.0.0.1   bizcore.test"
Add-Content C:\Windows\System32\drivers\etc\hosts "`n::1         bizcore.test"

# 2. Ensure certs exist at nginx/ssl/cert.pem and nginx/ssl/key.pem
# (Generate with: openssl req -x509 -nodes -days 365 -newkey rsa:2048...)

# 3. Start with HTTPS config
.\scripts\start-prod.ps1 -Mode compose -Domain bizcore.test -SkipCertbot

# 4. Access
# https://bizcore.test (ignore SSL warning for self-signed cert)
```

---

## 🧪 Quick Tests

```bash
# DNS working?
ping bizcore.test                          # ✓ Should resolve to 127.0.0.1

# Next.js running?
curl http://localhost:3000                 # ✓ Should return HTML

# Nginx running?
curl http://127.0.0.1                      # ✓ Should return HTML

# Domain working?
curl http://bizcore.test                   # ✓ Should return HTML

# HTTPS working?
curl -k https://bizcore.test               # ✓ Should return HTML (with -k for self-signed)

# Session cookie set?
curl -k -c cookies.txt https://bizcore.test/auth/signin
cat cookies.txt                            # ✓ Should show next-auth.session-token with Secure flag
```

---

## 📋 Environment Variables Quick Reference

### HTTP (Development)
```env
NODE_ENV=development
NEXTAUTH_URL=http://bizcore.test
NEXTAUTH_COOKIE_SECURE=false
```

### HTTPS (Production)
```env
NODE_ENV=production
NEXTAUTH_URL=https://bizcore.test
NEXTAUTH_COOKIE_SECURE=true
NEXTAUTH_COOKIE_SAME_SITE=lax
FORCE_HSTS=true
```

---

## 🚨 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot resolve host bizcore.test` | Missing hosts entry | Add to `C:\Windows\System32\drivers\etc\hosts` |
| `Connection refused on bizcore.test` | Nginx not running | Run `docker-compose up -d` |
| `502 Bad Gateway` | Next.js not running on 3000 | Run `npm run dev` |
| `Login doesn't work on HTTPS` | `NEXTAUTH_URL` is HTTP | Set to `https://bizcore.test` and `COOKIE_SECURE=true` |
| `Session not persisting` | Cookie not being set | Check browser DevTools → Application → Cookies |
| `ERR_CERT_AUTHORITY_INVALID` | Self-signed cert | Use `-k` with curl or ignore in browser |
| `Cannot verify session` | Cookie secure flag mismatch | Ensure HTTPS + `NEXTAUTH_COOKIE_SECURE=true` |

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `.env` | Dev environment (HTTP) |
| `.env.production` | Prod template (HTTPS) |
| `nginx/conf.d/bizcore-dev.conf` | Dev nginx config |
| `nginx/conf.d/bizcore-secure.conf` | Prod nginx config (HTTPS) |
| `scripts/start-prod.ps1` | Production startup script |
| `middleware.ts` | Auth middleware + security headers |
| `lib/auth.ts` | NextAuth configuration |

---

## 🔍 Debug Logs

```bash
# Nginx logs
docker logs -f bizcore_nginx

# Next.js logs (if running locally)
# Check terminal where you ran 'npm run dev'

# Check environment inside Docker
docker exec -it $(docker ps -q) sh -c "env | grep NEXTAUTH"
```

---

## ✅ Verification Checklist

Before considering fixed:

- [ ] `ping bizcore.test` works
- [ ] `curl http://bizcore.test` returns HTML (dev) or redirects to HTTPS (prod)
- [ ] `curl -k https://bizcore.test` works (prod)
- [ ] Can access in browser at http://bizcore.test or https://bizcore.test
- [ ] Login page loads
- [ ] Can submit login form without errors
- [ ] After login, see session cookie with Secure flag
- [ ] Can access protected pages
- [ ] Logout works and clears session
- [ ] No browser console errors related to auth

---

**Last Updated**: December 1, 2025
