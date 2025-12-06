# 🔐 SSL Certificate Setup - Windows Guide

## ✅ Status: Certificates Generated Successfully!

Your self-signed SSL certificates have been created:

```
✅ Certificate: nginx/ssl/cert.pem (1,976 bytes)
✅ Private Key: nginx/ssl/key.pem (3,272 bytes)
```

---

## 📋 Next Steps: Enable HTTPS in Nginx

### Step 1: Edit Nginx Configuration

Open: `nginx/conf.d/bizcore-secure.conf`

**Find this section (around line 8):**
```nginx
# ============================================================
# HTTP → HTTPS Redirect (remove this if HTTPS not ready)
# server {
#     listen 80;
#     server_name _;
#     return 301 https://$host$request_uri;
# }
```

**Uncomment it** by removing the `#` at the start of each line:
```nginx
# ============================================================
# HTTP → HTTPS Redirect
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
```

---

### Step 2: Uncomment HTTPS Server Block

**Find this section (around line 48):**
```nginx
# ============================================================
# HTTPS Main Server (Uncomment when SSL certificates ready)
# ============================================================
# server {
#     listen 443 ssl http2;
#     ...
# }
```

**Uncomment the entire `server { ... }` block** by removing all `#` characters

---

### Step 3: Restart Nginx

```bash
docker-compose -f docker-compose.prod.yml up -d nginx
```

Or if using docker-compose:
```bash
docker-compose restart nginx
```

---

### Step 4: Verify HTTPS Works

```bash
# Test HTTPS connection
curl -I https://localhost/

# Or open in browser (ignore certificate warning)
https://localhost/
```

**Expected Response:**
```
HTTP/1.1 200 OK
Strict-Transport-Security: max-age=31536000
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
...
```

---

## 🎯 For Production (Let's Encrypt)

To use free production certificates:

**Option 1: Inside Docker Container**
```bash
docker exec bizcore_nginx certbot certonly --standalone \
  -d yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos
```

**Option 2: On Host Machine (if OpenSSL installed)**
Create a PowerShell script: `nginx/ssl/setup-letsencrypt.ps1`

---

## ⚠️ Certificate Warnings (Normal)

Your browser will show a warning because this is a **self-signed certificate**. This is **normal and expected** for development.

To bypass the warning:
- **Chrome**: Click "Advanced" → "Proceed to localhost"
- **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
- **Edge**: Click "Details" → "Go on to the webpage"

---

## 📖 Helpful Resources

- **Main Security Guide**: `NGINX_SECURITY_HARDENING.md`
- **Setup Checklist**: `SECURITY_IMPLEMENTATION_CHECKLIST.md`
- **Quick Reference**: `PHASE5-QUICK-REFERENCE.md`
- **Configuration**: `nginx/conf.d/bizcore-secure.conf`

---

## 🆘 Troubleshooting

### "Strict-Transport-Security missing"
→ HTTPS server block not uncommented in config

### "Connection refused"
→ Docker nginx not running - run: `docker-compose -f docker-compose.prod.yml up -d nginx`

### "Bad certificate"
→ Normal for self-signed - click "Advanced" in browser to continue

### "Cannot find module"
→ Reinstall: `npm install` in project root

---

## ✅ Checklist

- [x] SSL certificates generated ✅
- [ ] Uncomment HTTPS block in bizcore-secure.conf
- [ ] Uncomment HTTP redirect block
- [ ] Restart nginx container
- [ ] Test HTTPS: `curl -I https://localhost/`
- [ ] Verify security headers present

---

**Ready to go live?** Follow the steps above and you'll have HTTPS enabled in 5 minutes! 🚀
