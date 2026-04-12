# BizCore Database Management Guide

## Quick Overview

| Environment | Database | Connection Pool | Status | Config File |
|-------------|----------|------------------|--------|-------------|
| **Local Dev** | PostgreSQL (Docker) | ❌ No | Running in compose | `docker-compose.yml` |
| **Production (Docker)** | PostgreSQL (Docker) | ✅ PgBouncer | Enabled | `docker-compose.prod.yml` |
| **Production (Fly.io)** | External DB (TBD) | ✅ PgBouncer | Future setup | `fly.toml` |

---

## 🚀 LOCAL DEVELOPMENT

### Setup
- **Database**: PostgreSQL 15 Alpine (Docker container)
- **Connection Pooling**: ❌ **DISABLED** - Not needed locally
- **ORM**: Prisma (type-safe database client)
- **GUI**: Prisma Studio (instead of pgAdmin)

### Key Files
```
docker-compose.yml          # Defines PostgreSQL service
.env.example               # Database connection template
prisma/schema.prisma       # Data models & database schema
prisma/migrations/         # Schema change history
```

### Running Locally
```bash
# 1. Start PostgreSQL in Docker
npm run docker:up

# 2. Run migrations (creates tables)
npm run db:migrate

# 3. Seed demo data (optional)
npm run db:seed

# 4. Open Prisma Studio GUI for database inspection
npm run db:studio

# 5. Start the app
npm run dev:all            # Both Next.js & BrandStudio
```

### Connection String (Local)
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/bizcore_dev?schema=public"
```
- **Host**: `localhost:5432` (PostgreSQL container)
- **User**: `postgres`
- **Password**: `postgres123` (dev default)
- **Database**: `bizcore_dev`
- **No pooling**: Direct connection to PostgreSQL

---

## 🏢 PRODUCTION DEPLOYMENT

### Current Status: TWO OPTIONS

#### **Option A: Docker Compose (Local Hosting)**
Runs PostgreSQL + PgBouncer + App on your own server

**Setup**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Services**:
- **PostgreSQL** (Port 5432) - Raw database
- **PgBouncer** (Port 6432) - Connection pool ✅ **ENABLED**
- **Nginx** (Port 80/443) - Reverse proxy
- **pgAdmin** (Port 5050) - Database GUI

**Configuration**: `docker-compose.prod.yml`
```yaml
pgbouncer:
  image: edoburu/pgbouncer:latest
  environment:
    DATABASE_URL: postgres://postgres:PASSWORD@postgres:5432/bizcore_dev
    POOL_MODE: transaction        # Transaction-level pooling
    MAX_CLIENT_CONN: 100          # Max incoming connections
    DEFAULT_POOL_SIZE: 20         # Connections per pool
    MIN_POOL_SIZE: 5
    RESERVE_POOL_SIZE: 5
```

**App Connection**: 
- Points to **PgBouncer (Port 6432)** instead of PostgreSQL directly
- Environment variable for production:
  ```env
  DATABASE_URL="postgresql://postgres:PASSWORD@pgbouncer:6432/bizcore_dev"
  ```

---

#### **Option B: Fly.io Deployment (Cloud Hosting)**
Runs app on Fly.io with external database (TBD - Neon or other)

**Current Status**: 
- `fly.toml` exists but incomplete
- **Database provider NOT YET CHOSEN**
  - Could be: Neon (serverless), AWS RDS, Fly Postgres, etc.
- Connection pooling: Will need PgBouncer or built-in pooling

**Configuration**: `fly.toml`
```toml
app = 'bizcore-v2-broken-wildflower-9754'
primary_region = 'sin'

[deploy]
  release_command = 'npx prisma migrate deploy'  # Auto-runs on deploy
  seed_command = 'tsx prisma/seed.ts'             # Optional seed
```

**When deploying to Fly.io, you'll need to**:
1. **Choose a database provider**:
   - **Neon** ✅ (Recommended for Fly.io - serverless PostgreSQL)
   - **AWS RDS** (Full control, higher cost)
   - **Fly Postgres** (On Fly.io infrastructure)
2. **Get DATABASE_URL from provider**
3. **Add to Fly.io secrets**:
   ```bash
   fly secrets set DATABASE_URL="postgresql://user:pass@host/db"
   ```
4. **Set up connection pooling** (if not included with provider)

---

## 🔗 PgBouncer (Production Connection Pooling)

### Why It's Needed in Production
- **Problem**: Each app request creates a new DB connection
- **Issue**: Too many connections = slow queries & connection exhaustion
- **Solution**: PgBouncer pools connections, reuses them across requests

### How It Works
```
App Requests (100 clients)
       ↓
   PgBouncer (Port 6432)
   MAX_CLIENT_CONN: 100 incoming
   DEFAULT_POOL_SIZE: 20 to DB
       ↓
PostgreSQL (Port 5432)
Only handles 20 concurrent connections instead of 100
```

### Configuration (Production)
```yaml
POOL_MODE: transaction      # Connection released after each transaction
MAX_CLIENT_CONN: 100        # Max clients can connect to PgBouncer
DEFAULT_POOL_SIZE: 20       # PgBouncer keeps 20 open to PostgreSQL
MIN_POOL_SIZE: 5            # Minimum always-ready connections
RESERVE_POOL_SIZE: 5        # Extra connections for spikes
SERVER_LIFETIME: 3600       # Recycle connections after 1 hour
IDLE_IN_TRANSACTION_SESSION_TIMEOUT: 600  # Kill idle after 10 min
```

### Connection String (With PgBouncer)
```env
DATABASE_URL="postgresql://postgres:PASSWORD@pgbouncer:6432/bizcore_dev?schema=public"
```
- Points to **pgbouncer (6432)** not PostgreSQL (5432)

### Local Development
- ❌ **NOT USED** - Low traffic doesn't need pooling
- Prisma connects directly to PostgreSQL port 5432

---

## 📊 Database Migrations & Seeds

### How Migrations Work
Prisma stores schema changes in sequential files:
```
prisma/migrations/
├── 20250101000001_init/
│   └── migration.sql
├── 20250102000002_add_subscriptions/
│   └── migration.sql
└── ...
```

### Workflow

#### Local Development
```bash
# Make schema changes in prisma/schema.prisma
# Then create a migration:
npm run db:migrate

# Prisma prompts for migration name
# Creates migration file
# Runs it against your local DB
```

#### Production Deployment
```bash
# Fly.io automatically runs this on deployment:
npx prisma migrate deploy

# Or Docker deployments:
npm run db:migrate

# This:
# 1. Reads all migration files in chronological order
# 2. Checks which ones haven't been applied
# 3. Runs new migrations only
# 4. Safe - idempotent
```

### Seeding (Optional)
```bash
npm run db:seed    # Runs prisma/seed.ts

# Inserts test/demo data:
# - Admin user
# - Sample products
# - Sample customers
```

---

## 🛠️ Prisma vs Neon vs PgBouncer

| Tool | Purpose | Local | Production |
|------|---------|-------|-----------|
| **Prisma** | ORM (database access in code) | ✅ Yes | ✅ Yes |
| **Neon** | Database provider (if you choose it) | ❌ No | ⚠️ Optional |
| **PgBouncer** | Connection pooling | ❌ No | ✅ Yes (Docker) |

### Clarification
- **Prisma** = How your app talks to the database (all environments)
- **Neon** = WHERE the database runs (cloud provider, only if you choose it)
- **PgBouncer** = HOW connections are managed (production only)

---

## 📋 Decision Matrix: What to Use

### For Local Development
```
✅ Docker PostgreSQL (included in docker-compose.yml)
✅ Prisma ORM (installed in package.json)
✅ Prisma Studio for GUI (npm run db:studio)
❌ PgBouncer (not needed)
❌ pgAdmin (Prisma Studio is better)
```

### For Production on Fly.io (Decision Needed)
```
❓ Database Provider: Choose ONE
   Option A: Neon (serverless, auto-scales) ← RECOMMENDED
   Option B: AWS RDS (full control, higher cost)
   Option C: Fly Postgres (on Fly.io infrastructure)

✅ Prisma ORM (same as local)
✅ Connection Pooling (either built-in or PgBouncer)
✅ Prisma migrations (auto-runs on deploy)
```

### For Production on Docker (Current)
```
✅ Docker PostgreSQL (port 5432)
✅ PgBouncer (port 6432) - ENABLED
✅ Prisma ORM
✅ pgAdmin for GUI
```

---

## 🚀 Next Steps for Production

### If Using Fly.io (Recommended)
1. **Create Neon account** (or choose another provider)
2. **Create PostgreSQL cluster** in Neon
3. **Get connection string** from Neon
4. **Add to fly.toml**:
   ```toml
   [env]
   DATABASE_URL = "your_neon_connection_string"
   ```
5. **Deploy**:
   ```bash
   fly deploy
   ```
6. Prisma migrations run automatically ✅

### If Using Docker (Self-Hosted)
1. **No additional setup needed**
2. **Just deploy** `docker-compose.prod.yml`
3. PgBouncer is already configured ✅
4. Run migrations on first deploy:
   ```bash
   npm run db:migrate
   ```

---

## 📞 Common Questions

### Q: Will Neon work with my current code?
**A:** Yes! Neon is PostgreSQL-compatible. Just change `DATABASE_URL` in fly.toml, that's it. Prisma doesn't care where the database is.

### Q: Do I need PgBouncer if using Neon?
**A:** Neon has built-in connection pooling. You can use Neon's pooling OR add PgBouncer on top for more control.

### Q: What if I want to self-host on my own server?
**A:** Use `docker-compose.prod.yml` (current setup). PostgreSQL + PgBouncer + Nginx all run in Docker containers.

### Q: Is pgAdmin necessary?
**A:** No. You can use:
- **Prisma Studio** (local dev) - `npm run db:studio`
- **pgAdmin** (production) - Already in docker-compose.prod.yml
- **Neon's Dashboard** (if using Neon) - Web-based

### Q: How do I backup the database?
**A:** 
- **Docker**: `docker exec bizcore_postgres pg_dump -U postgres bizcore_dev > backup.sql`
- **Neon**: Automatic backups included
- **AWS RDS**: AWS Backup service

---

## 🔒 Security Notes

### Local Development (HTTP)
```env
NEXTAUTH_COOKIE_SECURE=false
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/bizcore_dev
```
- ⚠️ Password in .env is OK (local only)
- Direct connection to DB (no pooling)

### Production (HTTPS)
```env
DATABASE_URL=postgresql://user:securepass@pgbouncer:6432/bizcore_dev
NEXTAUTH_COOKIE_SECURE=true
```
- ✅ Use strong passwords (32+ chars)
- ✅ Store passwords in secrets manager, NOT .env files
- ✅ Connection pooling via PgBouncer
- ✅ All connections over encrypted channels

---

## 📚 Related Files
- [DEPLOYMENT_ENV_VARS.md](./DEPLOYMENT_ENV_VARS.md) - Database configuration details
- [DEPLOYMENT_PLAN_FLY_IO.md](./DEPLOYMENT_PLAN_FLY_IO.md) - Fly.io deployment steps
- [docker-compose.yml](../docker-compose.yml) - Local development setup
- [docker-compose.prod.yml](../docker-compose.prod.yml) - Production Docker setup
- [prisma/schema.prisma](../prisma/schema.prisma) - Database models
- [fly.toml](../fly.toml) - Fly.io configuration
