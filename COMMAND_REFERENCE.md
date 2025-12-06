# BizCore Quick Command Reference

## 🎯 What Do You Want to Do?

### Show a Demo (Demo Day / Client Meeting)
```powershell
.\scripts\start-prod.ps1 -Mode host -Port 3000 -Domain bizcore.test -SeedDB
```
→ See: `DEMO_DAY_SETUP.md`

### Start Development
```powershell
docker-compose up -d
npm run dev
```
→ See: `DAILY_DEV_GUIDE.md`

### Deploy to Production HTTPS
```powershell
.\scripts\start-prod.ps1 -Mode compose -Domain bizcore.test -Email admin@example.com
```
→ See: `TROUBLESHOOTING_GUIDE.md`

---

## 📋 Most Common Commands

```powershell
# Start everything (dev)
docker-compose up -d && npm run dev

# Stop everything
docker-compose down

# Run tests
npm test

# Seed database
npm run db:seed

# View database
npm run db:studio

# Build for production
npm run build

# Start production server
npm start

# Check for errors
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

---

## 🐳 Docker Quick Reference

```powershell
# View all containers
docker ps -a

# View logs
docker logs bizcore_postgres
docker logs bizcore_nginx

# Stop all
docker-compose down

# Stop everything including volumes
docker-compose down -v

# Restart service
docker restart bizcore_postgres

# Execute command in container
docker exec bizcore_postgres psql -U postgres -d bizcore_dev

# View database UI
# Browser: http://localhost:5050
# Login: admin@bizcore.dev / admin123
```

---

## 🧪 Testing Quick Checklist

```powershell
# Is Docker running?
docker ps

# Is Next.js running?
curl http://localhost:3000

# Is database connected?
npm run db:studio

# Is nginx working?
curl http://127.0.0.1

# Can I login?
# Browser: http://localhost:3000/auth/signin
# Email: admin@bizcore.dev
```

---

## 🚨 When Something Breaks

```powershell
# Option 1: Quick fix (60% success)
docker restart bizcore_postgres

# Option 2: Restart everything (80% success)
docker-compose down
docker-compose up -d

# Option 3: Nuclear option (95% success, takes 3 min)
docker-compose down -v
docker system prune -a
docker-compose up -d
npm run db:seed
npm run dev

# Option 4: Check what's wrong
docker logs bizcore_nginx
docker logs bizcore_postgres
npm run lint
```

---

## 📚 Full Documentation Guide

| Guide | Purpose | Use When |
|-------|---------|----------|
| **QUICK_START.md** | 3 setup modes | Getting started |
| **DAILY_DEV_GUIDE.md** | All dev commands | Working on code |
| **DEMO_DAY_SETUP.md** | Demo-specific | Before presentations |
| **DEMO_DAY_CHECKLIST.md** | Pre-demo checklist | Day before demo |
| **TROUBLESHOOTING_GUIDE.md** | Problem solving | Something broke |
| **SESSION_SUMMARY.md** | What we did | Understanding setup |

---

## 🎯 One-Liners for Common Tasks

```powershell
# Fresh start
docker-compose down -v; docker-compose up -d; npm run db:seed; npm run dev

# Quick test
curl http://localhost:3000 && echo "✅ App is running!"

# Kill zombie processes
Get-Process | Where-Object {$_.Name -eq "node"} | Stop-Process -Force

# Clear DNS cache
ipconfig /flushdns

# Find what's using port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# See all npm scripts
npm run

# Latest 20 lines of nginx logs
docker logs bizcore_nginx 2>&1 | tail -n 20
```

---

## 🔑 Key Files to Know

```
bizcore-v2/
├── .env                              ← Environment variables
├── .env.production                   ← Production env settings
├── next.config.js                    ← Next.js configuration
├── docker-compose.yml                ← Dev services
├── docker-compose.prod.yml           ← Prod services
├── scripts/
│   ├── start-prod.ps1                ← Start production server
│   ├── start-prod-compose.ps1        ← Docker compose helper
│   └── obtain-certs.ps1              ← SSL certificate fetching
├── nginx/
│   ├── nginx.conf                    ← Main nginx config
│   ├── conf.d/
│   │   ├── bizcore-dev.conf          ← Dev proxy config
│   │   └── bizcore-secure.conf       ← HTTPS config
│   └── ssl/
│       ├── cert.pem                  ← SSL certificate
│       └── key.pem                   ← SSL private key
├── prisma/
│   └── schema.prisma                 ← Database schema
└── app/                              ← Next.js pages
```

---

## 🌐 Access Points

```
HTTP Development:
  - http://localhost:3000 (Direct app)
  - http://127.0.0.1 (Via nginx)
  - http://bizcore.test (Via domain, if configured)

Database UI (pgAdmin):
  - http://localhost:5050
  - admin@bizcore.dev / admin123

Production HTTPS:
  - https://bizcore.test (if HTTPS configured)
```

---

## 🎓 Learning Path

1. **First Time?** → Read `QUICK_START.md` (HTTP Development section)
2. **Want to Code?** → Read `DAILY_DEV_GUIDE.md`
3. **Need to Demo?** → Read `DEMO_DAY_SETUP.md`
4. **Something Broken?** → Read `TROUBLESHOOTING_GUIDE.md`
5. **Want Details?** → Read `SESSION_SUMMARY.md`

---

## 💡 Pro Tips

✅ **Keep terminal open during dev** - see logs in real time  
✅ **Use Incognito mode** - avoids cache issues  
✅ **Hard refresh** - Ctrl+Shift+R for CSS/JS updates  
✅ **Check logs first** - `docker logs` is your best friend  
✅ **Seed data** - `npm run db:seed` for clean demo  
✅ **Save configs** - backup `.env` before changes  
✅ **Port conflicts** - use 8080 if 3000 is busy  

---

## 🔗 Quick Links

- **Project Root**: `C:\laragon\www\bizcore-v2`
- **Database Schema**: `prisma/schema.prisma`
- **Next.js Config**: `next.config.js`
- **Nginx Config**: `nginx/nginx.conf`
- **Environment**: `.env` or `.env.production`

---

## ⚡ Emergency Commands

```powershell
# App won't start?
npm install

# Port already in use?
netstat -ano | findstr :3000

# Docker won't start?
docker info

# Need a fresh database?
docker exec bizcore_postgres dropdb -U postgres bizcore_dev

# Lock yourself out?
npm run db:seed
```

---

**Last Updated**: December 1, 2025  
**Keep This Bookmarked** ⭐  
**Saves Time When Debugging** ⏱️
