# Quick Start

Choose your workflow below.

---

## 🚀 Development Mode (RECOMMENDED FOR ACTIVE DEVELOPMENT)

**Best for**: Writing code, testing new features, hot reload

### Three Simple Steps:

**Terminal 1 - Start Database & Services**:
```powershell
cd C:\laragon\www\bizcore-v2
docker-compose up -d
```

**Terminal 2 - Start Dev Server**:
```powershell
cd C:\laragon\www\bizcore-v2
npm run dev
```

**Access**:
```
http://localhost:3000
```

### That's it! 
- Code changes reload instantly
- Full debugging capabilities
- Database seeding: `npm run db:seed`
- Prisma Studio: `npm run db:studio`

### Stop Everything
```powershell
# Terminal 1: Ctrl+C (stop Next.js)
# Terminal 2: docker-compose down
```

---

## 🏃 Production Build Mode (For Testing Production Build)

**Best for**: Testing production build locally before deployment

### Three Simple Steps:

**Terminal 1 - Start Database & Services**:
```powershell
cd C:\laragon\www\bizcore-v2
docker-compose up -d
```

**Terminal 2 - Build & Start Production**:
```powershell
cd C:\laragon\www\bizcore-v2
npm run build
npm run start
```

**Access**:
```
http://localhost:3000
```

### Production Build Features
- Optimized bundle size
- No hot reload (code changes require rebuild)
- Same database as dev mode
- Full error logging

### Stop
```powershell
# Terminal 1: Ctrl+C (stop Next.js)
# Terminal 2: docker-compose down
```

---

## 🔒 HTTPS Production Mode (For Real Production)

**Best for**: Real production deployment with SSL/TLS

⚠️ **Note**: Complex setup, not recommended for local testing. Use HTTP modes above.

See `NGINX_HTTPS_ISSUES.md` for detailed HTTPS configuration.

---

## 📊 Comparison: All Modes

| Feature | Dev | Production | HTTPS Prod |
|---------|-----|-----------|-----------|
| **Setup Time** | < 1 min | < 1 min | Complex |
| **Hot Reload** | ✅ Yes | ❌ No | ❌ No |
| **Performance** | Good | ✅ Optimized | Optimized |
| **SSL** | Not needed | Not needed | ✅ Yes |
| **Best For** | Coding | Testing build | Real prod |
| **Command** | `npm run dev` | `npm run build && npm run start` | See NGINX guide |

---

## 🧪 Quick Test

```powershell
# Start containers
docker-compose up -d

# Wait 5 seconds for PostgreSQL to be ready
sleep 5

# Start dev server
npm run dev

# In browser: http://localhost:3000
```

---

## 🐛 Troubleshooting

**Port 3000 in use?**
```powershell
# Find process
Get-Process | Where-Object {$_.Name -eq "node"} | Select-Object ProcessName, Id

# Kill it
Get-Process | Where-Object {$_.Name -eq "node"} | Stop-Process -Force
```

**Docker won't start?**
```powershell
# Restart Docker Desktop (Settings → Resources → Restart)
# Or:
docker system prune -a
```

**Database errors?**
```powershell
# Check container logs
docker logs bizcore_postgres

# Reset database
docker-compose down -v
docker-compose up -d
npm run db:migrate
```

**Can't access bizcore.test?**
- You don't need it - use `http://localhost:3000` instead
- If you want the domain: Fix hosts file entry (127.0.0.1 not 192.168.x.x)

---

## 💾 Useful References

- **Development Guide**: `DAILY_DEV_GUIDE.md`
- **Troubleshooting**: `TROUBLESHOOTING_GUIDE.md`
- **Session Summary**: `SESSION_SUMMARY.md`
- **HTTPS Deep Dive**: `NGINX_HTTPS_ISSUES.md`

---

## 🎯 Next Steps After First Run

### After HTTP Works
1. Run database migrations: `npm run db:migrate`
2. Seed test data: `npm run db:seed`
3. Test login functionality
4. Try building: `npm run build`

### Before Production HTTPS
1. Generate real SSL certificates (Let's Encrypt)
2. Configure proper domain DNS
3. Set up CI/CD pipeline
4. Test backup/restore procedures
5. Configure monitoring and logging

---

**Quick Decision Tree**:

```
Ready to use BizCore?
│
├─ Want to code/debug? 
│  └─ HTTP Development (this guide, top section)
│
├─ Have a demo/presentation? 
│  └─ HTTP Production (this guide, middle section) ⭐ RECOMMENDED
│
├─ Need real production HTTPS?
│  └─ HTTPS Production (this guide, bottom section)
│
└─ Not sure?
   └─ Start with HTTP Development, upgrade to HTTP Production for demo day!
```

---

## 📚 Useful Commands

```powershell
# Development
npm run dev                    # Start dev server on port 3000
npm run lint                   # Check code quality
npm test                       # Run tests
npm run format                 # Auto-format code

# Database
npm run db:migrate            # Run migrations
npm run db:seed              # Seed with test data
npm run db:studio            # Open Prisma Studio GUI
npm run db:push              # Push schema to DB

# Production
npm run build                 # Build for production
npm run start                 # Start production server

# Docker
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker compose logs -f        # View logs
docker exec -it bizcore_postgres psql -U postgres  # Connect to DB
```
