# BizCore Startup Guide: Dev & Production

This file explains how to start BizCore in development and in production-like environments, including useful environment variables, host mapping, TLS, and troubleshooting steps.

## 1. Quick dev startup (local, common workflow)

This starts both the Next.js app and the BrandStudio vite dev server.

1. Install dependencies (if not already):

   ```powershell
   npm install
   cd brandstudio-vite
   npm install
   cd ..
   ```

2. Create a copy of the environment file and edit values in `.env.local`: 

   ```powershell
   cp .env.example .env.local
   # Edit .env.local as needed (e.g., database, auth secrets) in Notepad or VS Code
   ```

3. Start PostgreSQL, PgBouncer and Nginx dev proxy (docker):

   ```powershell
   npm run docker:up
   ```

4. Start both dev servers:

   ```powershell
   npm run dev:all
   # or start apps individually
   npm run dev                # BizCore (Next.js) on http://localhost:3000
   npm run dev:brandstudio    # BrandStudio Vite on http://localhost:5174
   ```

Notes:
- Dev mode uses `bizcore-dev.conf` (HTTP) and is helpful for development. Debugging and HMR are enabled.
- `next.config.js` allows `*` origin in dev; in production it will require explicit origin.

## 2. Production startup (local production simulation or real production)

Important: Production requires HTTPS & strong secrets. If you must run HTTP in production for testing, you must explicitly enable an opt-in called `ALLOW_INSECURE_PROD=true`. This is not recommended for real production environments.

### 2A. Local production simulation (with HTTPS and domain mapping)

1. Map the domain `bizcore.test` to your host or local IP in the hosts file on Windows. Open PowerShell as Administrator and edit the file `C:\Windows\System32\drivers\etc\hosts` and add:

   ```text
   192.168.1.8  bizcore.test
   127.0.0.1    localhost
   ```

2. Configure environment variables (`.env.local`) for production mode:

   - `NODE_ENV=production`
   - `NEXTAUTH_URL=https://bizcore.test`
   - `NEXT_PUBLIC_APP_URL=https://bizcore.test`
   - `NEXTAUTH_COOKIE_DOMAIN=.bizcore.test`  # Optional: use the leading dot to scope cookies across subdomains
   - `NEXTAUTH_COOKIE_SECURE=true`
   - `NEXTAUTH_SECRET=<your-production-secret>`
   - Add database credentials: `DATABASE_URL`, `POSTGRES_PASSWORD`, etc.

3. Ensure TLS certificates are set up under `nginx/ssl/` (e.g., `cert.pem` and `key.pem`) or a matching configuration for Let's Encrypt. See `nginx/conf.d/bizcore-secure.conf`.

4. Build the Next.js app and run the production server behind Nginx.

   ```powershell
   # Build
   npm run build

   # Start production (behind nginx)
   npm run start

   # For Docker based production
   npm run docker:build
   npm run docker:up
   ```

5. Validate the server/config:

   - https://bizcore.test should show your site.
   - Check headers for `Strict-Transport-Security`, `Content-Security-Policy` and other security headers (HSTS is set in `bizcore-secure.conf`).

6. Login test:

   - Visit `https://bizcore.test` in the browser.
   - Login using your admin user.
   - In DevTools ➜ Network, check if the login POST returns `Set-Cookie` header (`next-auth.session-token`); the cookie should have `Secure` and `HttpOnly`, and domain should match.

### 2B. Local production-like environment (HTTP test) — EZ testing (NOT RECOMMENDED)

Only use this temporarily for debugging if you can't set up TLS yet. Use the explicit opt-in flags:

```powershell
$env:NODE_ENV='production';
$env:NEXTAUTH_URL='http://192.168.1.8';
$env:NEXT_PUBLIC_APP_URL='http://192.168.1.8';
$env:NEXTAUTH_COOKIE_SECURE='false';
$env:ALLOW_INSECURE_PROD='true';
npm run start
```

Notes:
- You must set `ALLOW_INSECURE_PROD=true` to allow insecure cookies in production — this is a safety guard so insecure cookies are not used accidentally.
- Leave `NEXTAUTH_COOKIE_DOMAIN` unset to allow host-only cookies when using IP addresses.
- Testing over HTTP disables `Secure` cookie; this is only for temporary debugging.

## 3. Docker production variant

If the intended deployment uses Docker & Nginx: produce a Docker image and run with Docker Compose.

1. Build the production image:

```powershell
npm run docker:build
```

2. Configure environment variables for container environment — use a secure secret manager or `.env.local` and ensure you do NOT commit these secrets.

3. Use `docker-compose.yml` (or a production compose override — `docker-compose.prod.yml`) to start services:

```powershell
# Be sure to set env variables before running
docker-compose up -d --build
```

4. Validate by visiting `https://bizcore.test`

## 4. Important configuration files to change

- `.env.local` — core environment variables; use `.env.example` as a starting point.
  - `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_COOKIE_DOMAIN`, `NEXTAUTH_COOKIE_SECURE`
  - Database credentials, pgAdmin variables

- `nginx/conf.d/bizcore-secure.conf` — configure TLS certs and domain(s)
  - Add a valid TLS cert and key in `nginx/ssl` or configure Let's Encrypt.

- `docker-compose.yml` or `docker-compose.prod.yml` — if using Docker for production, add environment variable substitution for secret values.

- `next.config.js` — `headers` config enforces CORS; in production ensure `NEXT_PUBLIC_APP_URL` is set to the exact active client origin.

- `lib/auth.ts`, `lib/customerAuth.ts` — cookieSecure logic and cookie domain resolution; `resolveCookieDomain` uses `NEXTAUTH_COOKIE_DOMAIN` or `NEXTAUTH_URL`.

## 5. Debugging tips & commands

- Check the cookie domain on login POST:
  - In the browser's Network tab for the login request, check `Set-Cookie` header for `next-auth.session-token` for `Domain` & `Secure` flags.

- Use curl to test endpoints and cookies:
  - Get CSRF cookie:
    ```powershell
    curl -vk -c cookies.txt https://bizcore.test/api/auth/csrf
    ```
  - Use the saved cookie to login (replace token and credentials accordingly):
    ```powershell
    curl -vk -b cookies.txt -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "csrfToken=THE_TOKEN&email=admin@bizcore.dev&password=admin123" https://bizcore.test/api/auth/callback/credentials
    ```
  - Check response for `Set-Cookie` and check `cookies.txt` for the cookie

- Server logs:
  - Next.js startup logs in server console show key info: `Session cookie domain resolved to`, `Cookie secure override`, `NEXT_PUBLIC_APP_URL`, and debug logs in auth handlers.
  - Nginx logs at `/var/log/nginx/access.log` and `/var/log/nginx/error.log`.

- Troubleshooting common issues:
  - `Set-Cookie` not present → server not setting session; check if credentials were valid and NextAuth returned a session.
  - `Set-Cookie` present but cookie is not stored → Domain mismatch or `Secure` cookie on HTTP; check `Domain` and `Secure` flags.
  - CORS blocking cookie → ensure `Access-Control-Allow-Origin` is exact origin and `Access-Control-Allow-Credentials: true`.

## 6. Quick check & state information

- To verify the app is using the right origin and cookie policy, check startup logs for:
  - `[AUTH] Session cookie domain resolved to:`
  - `[AUTH] Cookie secure override (NEXTAUTH_COOKIE_SECURE):` 
  - `[AUTH] NEXT_PUBLIC_APP_URL:`

## 7. Security reminder & steps to production harden

- Always use HTTPS in production and `NEXTAUTH_COOKIE_SECURE=true`.
- Avoid default or seeded demo passwords on production.
- Use a secure secrets management strategy; avoid committing secrets into the repo.
- Replace in-memory rate limiting with Redis-backed or infrastructure rate limiting.

---

If you want, I can:
- Create a small convenience script (`scripts/start-prod-http.ps1`) to start the production server with the explicit temp HTTP envs (covered above).
- Or add a `docker-compose.prod.yml` variant for production with certs and DNS mapping.

Which option do you prefer next?