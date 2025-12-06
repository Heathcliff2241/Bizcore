# Nginx Security Hardening Complete ✅

## What Was Implemented

### 1. **HTTPS/SSL/TLS** ✅
- **Certificates**: Self-signed SSL certificates at `nginx/ssl/`
- **Protocols**: TLS 1.2 and 1.3 only (no older versions)
- **Port 443**: HTTPS enabled alongside HTTP
- **HTTP Redirect**: All HTTP traffic (port 80) redirects to HTTPS
- **Cipher Suites**: Modern, forward-secrecy enabled ciphers:
  - ECDHE-ECDSA-AES128-GCM-SHA256
  - ECDHE-RSA-AES128-GCM-SHA256
  - ECDHE-ECDSA-AES256-GCM-SHA384
  - ECDHE-RSA-AES256-GCM-SHA384
  - ECDHE-ECDSA-CHACHA20-POLY1305
  - ECDHE-RSA-CHACHA20-POLY1305

### 2. **Security Headers** ✅
All response headers are set with `always` to ensure they're sent even on error responses:

| Header | Value | Purpose |
|--------|-------|---------|
| **Strict-Transport-Security** | max-age=63072000 (2 years) | Force HTTPS for all future requests |
| **Content-Security-Policy** | Strict policy with 'self' | Prevent XSS, injection attacks, control resource loading |
| **X-Frame-Options** | SAMEORIGIN | Prevent clickjacking |
| **X-Content-Type-Options** | nosniff | Prevent MIME type sniffing |
| **X-XSS-Protection** | 1; mode=block | Legacy XSS protection (CSP is primary) |
| **Referrer-Policy** | strict-origin-when-cross-origin | Control referrer information |
| **Permissions-Policy** | Restrictive | Block geolocation, microphone, camera, payment, etc. |
| **Cross-Origin-Embedder-Policy** | require-corp | Prevent Spectre-like attacks |
| **Cross-Origin-Opener-Policy** | same-origin | Isolate browsing context |
| **Cross-Origin-Resource-Policy** | cross-origin | Control resource sharing |

### 3. **Rate Limiting & DDoS Protection** ✅
Defined zones with per-IP tracking:
- **API Zone**: 10 requests/sec, burst of 20
- **Auth Zone**: 5 requests/sec, burst of 5
- **General Zone**: 30 requests/sec, burst of 50
- **Login Zone**: 3 requests/sec, burst of 5

**Connection Limits**:
- API endpoints: max 10 concurrent connections per IP
- Auth endpoints: max 5 concurrent connections per IP
- General endpoints: max 20 concurrent connections per IP

### 4. **Request Size & Timeout Limits** ✅
- **Max Body Size**: 10MB (prevents buffer overflow attacks)
- **Client Body Buffer**: 128KB
- **Client Header Buffer**: 1KB (initial), 16KB (large headers)
- **Proxy Timeouts**:
  - Connect: 60s (general), 30s (auth)
  - Send: 60s (general), 30s (auth)
  - Read: 60s (general), 30s (auth)

### 5. **Proxy Security** ✅
- **Upstream Pool**: `host_backend` with health checks
  - Max fails: 3 before marking as down
  - Fail timeout: 30 seconds
  - Keepalive: 32 connections
- **Proxy Buffering**: Enabled to prevent large response attacks
  - Buffer size: 4KB
  - Buffers: 8x4KB
  - Busy buffers: 8KB

### 6. **Path Denial & Access Control** ✅
Denied paths prevent exploitation:
- `/.` - Hidden files (.env, .git, .htaccess, etc.)
- `/*~` - Backup files
- `/node_modules/` - Source code exposure
- `/wp-admin`, `/wp-login` - WordPress paths
- `/config.php`, `/xmlrpc.php` - CMS files
- Admin endpoints disabled for public access

### 7. **Compression & Performance** ✅
- **Gzip**: Enabled for text, CSS, JavaScript, JSON (reduces bandwidth)
- **Brotli**: Ready for deployment (commented out, can be enabled)
- **Minification**: Handles Next.js built assets

### 8. **Logging & Monitoring** ✅
- **Access Logs**: `/var/log/nginx/access.log` (main format)
- **Error Logs**: `/var/log/nginx/error.log`
- **Security Logs**: Available for audit
- **Health Check**: `/health` endpoint returns 200 "healthy"

### 9. **Cache Control** ✅
- **Static Assets** (30 days): CSS, JS, images
  - `Cache-Control: public, immutable`
  - `Expires: 30 days`
  - `X-Content-Type-Options: nosniff`
- **Dynamic Content**: No-cache headers
- Access logging disabled for static assets

### 10. **Version Hiding** ✅
- `server_tokens off` - Nginx version not exposed in headers
- X-Powered-By header from Next.js still visible (can be removed in app)

## Access Your Application

```
HTTPS: https://bizcore.test
HTTP:  http://bizcore.test (redirects to HTTPS)
```

## Production Deployment Checklist

- [ ] Generate valid SSL/TLS certificates (Let's Encrypt recommended)
  - Update paths in `bizcore-secure.conf`:
    ```nginx
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ```

- [ ] Enable OCSP Stapling (uncomment in config)
  - Improves SSL performance
  - Requires resolver configuration

- [ ] Update CSP to match your domains
  - Currently allows: `'self'`, Google Fonts, CDN resources
  - Customize `default-src`, `script-src`, `style-src`, etc.

- [ ] Review rate limiting thresholds
  - Adjust burst values based on your traffic patterns

- [ ] Set up log rotation
  - Configure logrotate for nginx logs to prevent disk space issues

- [ ] Add monitoring/alerting
  - Monitor rate limit hits (429 responses)
  - Alert on high error rates (5xx responses)

- [ ] Test with security tools:
  - SSL Labs: https://www.ssllabs.com/ssltest/
  - Mozilla Observatory: https://observatory.mozilla.org/
  - Security Headers: https://securityheaders.com/

- [ ] Update HSTS preload list (production only)
  - Domain must have HSTS header with `preload` flag
  - Submit at https://hstspreload.org/

## Configuration Files

- **Main Config**: `nginx/nginx.conf`
  - Global settings, compression, rate limiting zones
  - Upstream backend definition
  
- **Secure Server Config**: `nginx/conf.d/bizcore-secure.conf`
  - HTTPS server block with all hardening
  - HTTP redirect block
  
- **SSL Certificates**: `nginx/ssl/`
  - `cert.pem` - Certificate
  - `key.pem` - Private key
  - Scripts for self-signed or Let's Encrypt setup

- **Docker Compose**: `docker-compose.yml`
  - Mounts secure config as default.conf
  - Exposes ports 80 and 443
  - Health checks enabled

## Quick Commands

```bash
# Check nginx config syntax
docker exec bizcore_nginx nginx -t

# View nginx logs
docker logs bizcore_nginx

# Check active connections
docker exec bizcore_nginx nginx -s status

# Reload nginx (without downtime)
docker exec bizcore_nginx nginx -s reload

# View access logs
docker exec bizcore_nginx tail -f /var/log/nginx/access.log

# View security headers
curl -I https://bizcore.test
```

## Security Headers Grade

Expected Mozilla Observatory grade: **A** or **A+**
- All critical headers present
- CSP properly configured
- HTTPS enforced
- No deprecated headers

## Notes

- Self-signed certificates will show browser warnings (normal for development)
- For production, use Let's Encrypt or commercial CA
- The health check endpoint (`/health`) is intentionally exposed for load balancers
- WebSocket support enabled for real-time features (Next.js hot reload, etc.)

## Support

For certificate setup help:
- Self-signed: Run `./nginx/ssl/generate-self-signed-cert.sh`
- Let's Encrypt: Run `./nginx/ssl/setup-letsencrypt.sh`
- Windows: Use `./nginx/ssl/generate-self-signed-cert.ps1`
