# Neon Setup Guide for BizCore

Complete step-by-step guide to set up Neon and connect it to your Fly.io deployment.

---

## 📋 Prerequisites

- Neon account (free tier available)
- Fly.io account (already have this)
- Git and flyctl installed locally

---

## 🚀 Step 1: Create Neon Account

1. **Go to** https://console.neon.tech/
2. **Sign up** with email or GitHub (GitHub recommended)
3. **Create a project** - Name it `bizcore` or similar
4. **Choose region** closest to your users (default is fine)

---

## 🔑 Step 2: Create a Database & Get Connection String

### In Neon Console:

1. **After project creation**, you'll see a default database `neondb`
2. **Click the database** to view details
3. **Connection string is displayed** - looks like:
   ```
   postgresql://neondb_owner:xxxxxxxxxxxx@ep-xxxxxxxx.us-east-1.neon.tech/neondb?sslmode=require
   ```

### Copy This! ☝️

**Don't modify it, just copy the full string.**

---

## 📝 Step 3: Update fly.toml

Open `fly.toml` and update the `[env]` section:

**BEFORE:**
```toml
app = 'bizcore-v2-broken-wildflower-9754'
primary_region = 'sin'

[build]
  args = { NEXT_PUBLIC_APP_URL = "https://bizcore-v2.fly.dev", NEXTAUTH_URL = "https://bizcore-v2.fly.dev" }

[deploy]
  release_command = 'npx prisma migrate deploy'
  seed_command = 'tsx prisma/seed.ts'
```

**AFTER:**
```toml
app = 'bizcore-v2-broken-wildflower-9754'
primary_region = 'sin'

[build]
  args = { NEXT_PUBLIC_APP_URL = "https://bizcore-v2.fly.dev", NEXTAUTH_URL = "https://bizcore-v2.fly.dev" }

[env]
  DATABASE_URL = "postgresql://neondb_owner:xxxxxxxxxxxx@ep-xxxxxxxx.us-east-1.neon.tech/neondb?sslmode=require"

[deploy]
  release_command = 'npx prisma migrate deploy'
  seed_command = 'tsx prisma/seed.ts'
```

**Replace the `DATABASE_URL` value with your actual Neon connection string.**

---

## 🔐 Step 4: Add to Fly.io Secrets (Secure Method)

Instead of putting it in the file, use Fly.io secrets for better security:

```bash
fly secrets set DATABASE_URL="postgresql://neondb_owner:xxxxxxxxxxxx@ep-xxxxxxxx.us-east-1.neon.tech/neondb?sslmode=require"
```

**Then update fly.toml to reference the secret:**

```toml
[env]
  DATABASE_URL = "${DATABASE_URL}"
```

Or just **remove the `[env]` section entirely** and let Fly.io use the secret.

---

## ✅ Step 5: Test Connection Locally (Optional)

To verify your Neon connection string works before deploying:

```bash
# Set the connection string locally
$env:DATABASE_URL = "postgresql://neondb_owner:xxxxxxxxxxxx@ep-xxxxxxxx.us-east-1.neon.tech/neondb?sslmode=require"

# Test connection
npx prisma db execute --stdin < nul

# Or push schema to Neon
npx prisma db push
```

---

## 🚀 Step 6: Deploy to Fly.io

```bash
# Commit your changes
git add fly.toml
git commit -m "Add Neon database connection"

# Deploy
fly deploy
```

**What happens:**
1. Fly.io builds your app
2. Runs `npx prisma migrate deploy` (creates tables in Neon)
3. Runs `tsx prisma/seed.ts` (seeds demo data in Neon)
4. App connects to Neon database

---

## 🧪 Step 7: Verify Deployment

```bash
# View logs
fly logs

# Check app is running
fly status

# Test the app
fly open
```

**Expected in logs:**
```
[API] Database connected to Neon
[MIGRATIONS] Running pending migrations...
[SEED] Seeding database...
```

---

## 📊 Verify Database in Neon Console

After deployment:

1. **Go to** https://console.neon.tech/
2. **Click your project**
3. **Click "SQL Editor"**
4. **Run a test query:**
   ```sql
   SELECT COUNT(*) FROM "User";
   ```
5. **Should return row count** (shows data was seeded)

---

## 🔄 Local Development Still Uses Docker

**Your `.env.local` stays the same:**

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/bizcore_dev?schema=public&connect_timeout=15"
NODE_ENV="development"
```

- `npm run dev` → Uses Docker PostgreSQL
- `fly deploy` → Uses Neon PostgreSQL
- Zero conflicts ✅

---

## ⚠️ Important Notes

### **Don't forget to:**
- ✅ Save your Neon connection string somewhere safe
- ✅ Never commit `fly.toml` with hardcoded passwords (use `fly secrets set` instead)
- ✅ Keep local `.env.local` untouched
- ✅ Use `?sslmode=require` in production (already in Neon string)

### **Neon Free Tier Includes:**
- ✅ Generous free database
- ✅ Auto-scaling
- ✅ Automatic backups
- ✅ Great for development & small production

### **If you hit limits later:**
- Upgrade to Neon paid plan (~$15/mo for Pro)
- Or switch to AWS RDS (more expensive but full control)

---

## 🆘 Troubleshooting

### "Connection refused"
- Check Neon connection string is correct
- Verify `?sslmode=require` is included
- Check your IP isn't blocked (Neon allows all by default)

### "Migrations failed"
- Check Neon database exists
- Run locally first: `npx prisma db push`
- Then deploy

### "NEXTAUTH_SECRET not found"
- Make sure you set it: `fly secrets set NEXTAUTH_SECRET="..."`
- Also set: `CRON_SECRET`, `SMTP_USER`, `SMTP_PASS`

---

## 📚 What's Next

1. **Monitor in Neon Console** - Check query performance
2. **Set up backups** - Neon has auto-backups, but verify
3. **Add more secrets to Fly.io:**
   ```bash
   fly secrets set NEXTAUTH_SECRET="your-secret"
   fly secrets set CRON_SECRET="your-secret"
   fly secrets set SMTP_USER="your-email"
   fly secrets set SMTP_PASS="your-password"
   ```
4. **Monitor app logs** - `fly logs`

---

## 🎯 Quick Checklist

- [ ] Created Neon account
- [ ] Created database in Neon
- [ ] Copied connection string
- [ ] Updated `fly.toml` OR ran `fly secrets set`
- [ ] Tested connection locally (optional)
- [ ] Committed changes
- [ ] Deployed with `fly deploy`
- [ ] Verified in Neon console
- [ ] App is running on Fly.io

---

## 📞 Need Help?

- **Neon docs**: https://neon.tech/docs
- **Fly.io docs**: https://fly.io/docs
- **Prisma + Neon**: https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project

