# Deployment Environment Variables Guide

## Quick Setup

1. Copy the template below to `.env.production`
2. Fill in all required values
3. Never commit `.env.production` to git!

---

## Required Environment Variables

### Application Configuration

```bash
# Application Environment
NODE_ENV=production

# Public URL (must match NEXTAUTH_URL)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-32-char-secret>
NEXTAUTH_COOKIE_DOMAIN=.yourdomain.com
NEXTAUTH_COOKIE_SECURE=true
```

**How to Generate NEXTAUTH_SECRET:**
```powershell
# PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))

# Or use online: https://generate-secret.vercel.app/32
```

### Database Configuration

```bash
# Full database connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/bizcore_prod

# Or individual components (for Docker)
POSTGRES_PASSWORD=your-secure-password
DB_PASSWORD=your-secure-password
```

**Format:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

### Email Configuration (SMTP)

```bash
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
ADMIN_EMAIL=admin@yourdomain.com
```

**Gmail Setup:**
1. Enable 2-Factor Authentication
2. Go to: https://myaccount.google.com/apppasswords
3. Generate App-Specific Password
4. Use that password (not your regular password)

### Cron Job Configuration

```bash
CRON_SECRET=<generate-32-char-secret>
```

**Generate same way as NEXTAUTH_SECRET**

### Security Configuration

```bash
# Force HSTS even on HTTP (not recommended)
FORCE_HSTS=false

# Allow insecure production (ONLY for testing!)
ALLOW_INSECURE_PROD=false
```

### Optional: pgAdmin Configuration

```bash
PGADMIN_DEFAULT_EMAIL=admin@bizcore.dev
PGADMIN_DEFAULT_PASSWORD=your-secure-password
```

### Optional: Feature Flags

```bash
# Seed demo data (ONLY in development!)
SEED_DEMO=false
```

### Optional: reCAPTCHA

```bash
RECAPTCHA_SECRET=your-recaptcha-secret-key
```

---

## Complete Template

Copy this to `.env.production` and fill in values:

```bash
# ============================================
# Application Configuration
# ============================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=CHANGE_THIS_TO_32_CHAR_SECRET
NEXTAUTH_COOKIE_DOMAIN=.yourdomain.com
NEXTAUTH_COOKIE_SECURE=true

# ============================================
# Database Configuration
# ============================================
DATABASE_URL=postgresql://postgres:CHANGE_THIS@localhost:5432/bizcore_prod
POSTGRES_PASSWORD=CHANGE_THIS
DB_PASSWORD=CHANGE_THIS

# ============================================
# Email Configuration
# ============================================
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
ADMIN_EMAIL=admin@yourdomain.com

# ============================================
# Cron Job Configuration
# ============================================
CRON_SECRET=CHANGE_THIS_TO_32_CHAR_SECRET

# ============================================
# Security Configuration
# ============================================
FORCE_HSTS=false
ALLOW_INSECURE_PROD=false

# ============================================
# Optional: pgAdmin
# ============================================
PGADMIN_DEFAULT_EMAIL=admin@bizcore.dev
PGADMIN_DEFAULT_PASSWORD=CHANGE_THIS

# ============================================
# Optional: Feature Flags
# ============================================
SEED_DEMO=false
```

---

## Validation Checklist

Before deploying, verify:

- [ ] `NEXTAUTH_SECRET` is 32+ characters
- [ ] `CRON_SECRET` is 32+ characters
- [ ] `NEXTAUTH_URL` matches `NEXT_PUBLIC_APP_URL`
- [ ] `NEXTAUTH_COOKIE_SECURE=true` (for HTTPS)
- [ ] `DATABASE_URL` is correct and accessible
- [ ] `SMTP_PASS` is an app-specific password (Gmail)
- [ ] `POSTGRES_PASSWORD` is strong and secure
- [ ] `NODE_ENV=production`
- [ ] `ALLOW_INSECURE_PROD=false` (unless testing)

---

## Troubleshooting

### "Invalid NEXTAUTH_SECRET"
- Generate a new 32+ character secret
- Ensure no special characters that break shell parsing

### "Database connection failed"
- Verify `DATABASE_URL` format is correct
- Check database is accessible from deployment server
- Verify credentials are correct

### "Email sending failed"
- Verify `SMTP_PASS` is app-specific password (Gmail)
- Check Gmail account has 2FA enabled
- Verify SMTP settings are correct

### "Cron job authentication failed"
- Verify `CRON_SECRET` matches in environment and cron service
- Check Authorization header format: `Bearer {CRON_SECRET}`

---

## Security Notes

1. **Never commit `.env.production` to git**
2. **Use secrets manager in production** (AWS Secrets Manager, etc.)
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Use different secrets for staging and production**
5. **Limit access to production environment variables**

---

## Next Steps

After setting environment variables:
1. Review `5_HOUR_DEPLOYMENT_PLAN.md`
2. Complete Hour 1 tasks
3. Proceed with deployment

