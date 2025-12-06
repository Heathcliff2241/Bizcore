# BizCore Daily Development Guide

Quick reference for common development and production commands for BizCore v2.

---

## 🚀 Quick Start

### Development Mode (HTTP - localhost:3000)

```powershell
# Terminal 1: Start Docker services (PostgreSQL, pgAdmin, Nginx)
docker-compose up -d

# Terminal 2: Start Next.js development server
npm run dev

# Access: http://localhost:3000 or http://bizcore.test
```

### Production Mode (HTTPS - bizcore.test)

```powershell
# Single command to build and start HTTPS
.\scripts\start-prod.ps1 -Mode compose -Domain bizcore.test -SkipCertbot

# Access: https://bizcore.test
```

---

## 📋 Complete Command Reference

### Database Commands

```powershell
# Run migrations
npm run db:migrate

# Seed database with demo data
npm run db:seed

# Open Prisma Studio (interactive database UI)
npm run db:studio
```

### Development Commands

| Command | Purpose | Terminal |
|---------|---------|----------|
| `npm run dev` | Start Next.js dev server on port 3000 | Terminal 2 |
| `npm run dev:brandstudio` | Start BrandStudio Vite app on port 5174 | Terminal 3 |
| `npm run dev:all` | Start both apps simultaneously | Terminal 2 |
| `docker-compose up -d` | Start all Docker services | Terminal 1 |
| `docker-compose down` | Stop all Docker services | Terminal 1 |
| `npm run lint` | Run ESLint | - |
| `npm run format` | Format code with Prettier | - |
| `npm run type-check` | Run TypeScript type checking | - |
| `npm test` | Run Jest unit tests | - |

### Production Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Build Next.js for production |
| `npm start` | Start production server (after build) |
| `.\scripts\start-prod.ps1 -Mode host` | Run production locally (Next.js on host) |
| `.\scripts\start-prod.ps1 -Mode compose -SkipCertbot` | Run production with Docker Compose & Nginx |

### Docker Commands

```powershell
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs bizcore_nginx       # Nginx logs
docker logs bizcore_postgres    # PostgreSQL logs
docker logs bizcore_pgbouncer   # Connection pool logs

# Follow logs in real-time
docker logs -f bizcore_nginx

# Execute command inside container
docker exec bizcore_nginx nginx -t    # Test nginx config
docker exec bizcore_postgres psql -U postgres -c "SELECT version();"

# Stop specific container
docker stop bizcore_nginx

# Restart specific container
docker restart bizcore_nginx

# Remove containers and volumes
docker-compose down -v

# Rebuild containers
docker-compose up -d --build
```

---

## 🔧 Development Workflow

### Starting Fresh

```powershell
# 1. Clean up
docker-compose down -v
Remove-Item node_modules -Recurse -Force
npm cache clean --force

# 2. Reinstall and setup
npm install
npm run db:migrate
npm run db:seed

# 3. Start services
docker-compose up -d
npm run dev:all
```

### Running Tests

```powershell
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests for specific file
npm test -- AnalyticsManager.test.tsx

# Run tests with coverage
npm test -- --coverage
```

### Building for Production

```powershell
# Full production build process
npm run build
npm start

# Or using the production script
.\scripts\start-prod.ps1 -Mode compose -Domain bizcore.test -SkipCertbot
```

---

## 🌐 Access Points

### Development (HTTP)

| Service | URL | Port | Notes |
|---------|-----|------|-------|
| BizCore Main | `http://localhost:3000` | 3000 | Next.js app |
| BizCore via Domain | `http://bizcore.test` | 80 | Via Nginx |
| BrandStudio | `http://localhost:5174` | 5174 | Vite app |
| pgAdmin | `http://localhost:5050` | 5050 | Database GUI |

### Production (HTTPS)

| Service | URL | Port | Notes |
|---------|-----|------|-------|
| BizCore Main | `https://bizcore.test` | 443 | Nginx + TLS |
| pgAdmin | `http://localhost:5050` | 5050 | Still HTTP for local |

---

## 🔐 Production HTTPS Setup

### Prerequisites

1. **Hosts file entry** (admin terminal):
   ```powershell
   Add-Content C:\Windows\System32\drivers\etc\hosts "`n127.0.0.1   bizcore.test"
   Add-Content C:\Windows\System32\drivers\etc\hosts "`n::1         bizcore.test"
   ```

2. **SSL certificates** (already exist at `nginx/ssl/cert.pem` and `nginx/ssl/key.pem`)

3. **Environment variables** (set automatically by `start-prod.ps1`):
   ```env
   NODE_ENV=production
   NEXTAUTH_URL=https://bizcore.test
   NEXTAUTH_COOKIE_SECURE=true
   NEXTAUTH_COOKIE_SAME_SITE=lax
   ```

### Starting HTTPS Production Build

```powershell
# Simple: Uses default settings
.\scripts\start-prod.ps1 -Mode compose -Domain bizcore.test -SkipCertbot

# With staging Let's Encrypt (for testing cert generation)
.\scripts\start-prod.ps1 -Mode compose -Domain bizcore.test -Staging

# With custom secret
.\scripts\start-prod.ps1 -Mode compose -Domain bizcore.test -SkipCertbot -Secret "your-secret-here"

# Seed DB during startup
.\scripts\start-prod.ps1 -Mode compose -Domain bizcore.test -SkipCertbot -SeedDB
```

### Verifying HTTPS Setup

```powershell
# Test HTTPS access
curl -k https://bizcore.test

# Check SSL certificate
curl -k -v https://bizcore.test 2>&1 | grep "subject"

# Test authentication endpoint
curl -k https://bizcore.test/api/auth/session

# View nginx logs
docker logs -f bizcore_nginx
```

---

## 📊 Monitoring & Debugging

### Check Application Health

```powershell
# Test Next.js backend
curl http://localhost:3000

# Test Nginx proxy
curl http://127.0.0.1

# Test through domain (after hosts entry)
curl http://bizcore.test

# Check database connection
docker exec bizcore_postgres pg_isready -U postgres
```

### View Logs

```powershell
# Real-time nginx logs
docker logs -f bizcore_nginx

# Real-time Next.js logs (when running locally)
# Watch the terminal where `npm run dev` is running

# All services
docker logs bizcore_nginx
docker logs bizcore_postgres
docker logs bizcore_pgbouncer
```

### Performance Debugging

```powershell
# Check container resource usage
docker stats

# View all environment variables in running container
docker exec bizcore_nginx printenv | Sort-Object

# Check Next.js environment (if running locally)
# Add console.log in next.config.js or app layout
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot resolve host bizcore.test"

**Fix**: Add to hosts file (admin terminal):
```powershell
Add-Content C:\Windows\System32\drivers\etc\hosts "`n127.0.0.1   bizcore.test"
```

### Issue: "Connection refused" on localhost:3000

**Fix**: Ensure Docker and npm dev server are running:
```powershell
docker ps  # Should show containers running
npm run dev  # In separate terminal
```

### Issue: Nginx 502 Bad Gateway

**Fix**: Check if Next.js is running:
```powershell
curl http://localhost:3000  # Should return HTML
docker logs bizcore_nginx  # Check nginx error logs
```

### Issue: HTTPS login fails / "Cannot verify session"

**Fix**: Verify environment variables:
```powershell
# In production, ensure .env has:
# NEXTAUTH_URL=https://bizcore.test
# NEXTAUTH_COOKIE_SECURE=true

# Check running container
docker exec $(docker ps -q -f "ancestor=node:20") printenv | findstr NEXTAUTH
```

### Issue: Port already in use

**Fix**: Kill process using the port:
```powershell
# For port 3000
Get-Process | Where-Object {$_.Name -eq "node"} | Stop-Process

# For Docker port conflicts
docker-compose down
```

---

## 💾 File Locations

### Key Configuration Files

```
bizcore-v2/
├── .env                          # Development environment (HTTP)
├── .env.production              # Production environment (HTTPS)
├── next.config.js               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── jest.config.js               # Jest testing configuration
├── nginx/
│   ├── nginx.conf               # Main nginx config
│   ├── conf.d/
│   │   ├── bizcore-dev.conf     # Development proxy config
│   │   └── bizcore-secure.conf  # Production HTTPS config
│   └── ssl/
│       ├── cert.pem             # SSL certificate
│       └── key.pem              # SSL private key
├── scripts/
│   ├── start-prod.ps1           # Production startup (main)
│   └── start-prod-compose.ps1   # Docker compose helper
├── prisma/
│   └── schema.prisma            # Database schema
└── docker-compose.yml           # Docker services
```

### Useful Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js app router pages |
| `components/` | Shared React components |
| `lib/` | Utilities (auth, prisma, rate limiting) |
| `types/` | TypeScript type definitions |
| `prisma/` | Database schema & migrations |
| `public/` | Static assets |
| `brandstudio-vite/` | BrandStudio design tool (Vite) |

---

## 🎯 Development Best Practices

### Before Committing Code

```powershell
# 1. Run linting
npm run lint

# 2. Format code
npm run format

# 3. Check types
npm run type-check

# 4. Run tests
npm test

# 5. Test in browser
# - Development: http://localhost:3000
# - Production: https://bizcore.test (after running start-prod.ps1)
```

### Database Migrations

```powershell
# Create a new migration
npx prisma migrate dev --name feature_name

# Review before applying
git diff prisma/schema.prisma

# Apply specific migration
npm run db:migrate

# Reset database (careful!)
npx prisma migrate reset
```

### Environment Variable Checklist

**Development (.env)**:
- `NODE_ENV=development`
- `NEXTAUTH_URL=http://localhost:3000` or `http://bizcore.test`
- `NEXTAUTH_COOKIE_SECURE=false`

**Production (.env.production)**:
- `NODE_ENV=production`
- `NEXTAUTH_URL=https://bizcore.test`
- `NEXTAUTH_COOKIE_SECURE=true`
- `NEXTAUTH_COOKIE_SAME_SITE=lax`

---

## 📞 Quick Help

```powershell
# Show all npm scripts
npm run

# Show Docker containers status
docker ps

# Test specific port
Test-NetConnection localhost -Port 3000

# View all running processes
Get-Process | Where-Object {$_.Name -like "*node*" -or $_.Name -like "*nginx*"}
```

---

**Last Updated**: December 1, 2025  
**Status**: Active Development  
**Next Review**: Check after major version updates
