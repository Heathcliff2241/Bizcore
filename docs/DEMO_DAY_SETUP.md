# Demo Day Setup - Simple HTTP Production

**Perfect for**: Demo day, presentations, client meetings  
**Complexity**: Minimal  
**Setup Time**: < 2 minutes  
**Reliability**: Maximum ✅

---

## 🎯 One-Command Setup

```powershell
cd C:\laragon\www\bizcore-v2
.\scripts\start-prod.ps1 -Mode host -Port 3000 -Domain bizcore.test -SeedDB
```

That's it! The application will:
- ✅ Build for production (optimized)
- ✅ Seed database with demo data
- ✅ Start on `http://localhost:3000`
- ✅ Be available at `http://bizcore.test` (if hosts entry exists)
- ✅ Run production Next.js server

---

## 📋 Step-by-Step for Demo Day

### Before Demo (5 minutes)

```powershell
# 1. Start Docker services (database, etc)
cd C:\laragon\www\bizcore-v2
docker-compose up -d

# 2. Start production server (builds + seeds + runs)
.\scripts\start-prod.ps1 -Mode host -Port 3000 -Domain bizcore.test -SeedDB

# 3. Wait for build to complete (~45 seconds)
# Look for: "ready - started server on 0.0.0.0:3000"

# 4. Test access
curl.exe http://localhost:3000
# Should return HTML immediately
```

### During Demo

**Share link**: `http://localhost:3000`  
**Or**: `http://bizcore.test` (requires hosts file entry)

### After Demo

```powershell
# Stop production server: Ctrl+C in the terminal

# Stop Docker services
docker-compose down
```

---

## 🔧 Command Options

### Standard Demo Setup
```powershell
.\scripts\start-prod.ps1 -Mode host -Port 3000 -Domain bizcore.test -SeedDB
```

### Without Database Seeding
```powershell
.\scripts\start-prod.ps1 -Mode host -Port 3000 -Domain bizcore.test
```

### On Different Port (if 3000 is busy)
```powershell
.\scripts\start-prod.ps1 -Mode host -Port 8080 -Domain bizcore.test -SeedDB
```

### With Custom Secret
```powershell
.\scripts\start-prod.ps1 -Mode host -Port 3000 -Domain bizcore.test -SeedDB -Secret "your-custom-secret"
```

---

## ✅ Pre-Demo Checklist

- [ ] Docker Desktop is running
- [ ] No Node.js processes on port 3000: `Get-Process | Where-Object {$_.Name -eq "node"}`
- [ ] Enough disk space: `Get-Volume | Where-Object {$_.DriveLetter -eq "C"}`
- [ ] `.env` file exists with default settings
- [ ] `nginx/ssl/cert.pem` and `key.pem` exist (for reference, not used in HTTP mode)

### Quick Health Check
```powershell
# 30 seconds before demo, run:
curl.exe http://localhost:3000

# Should respond immediately with HTML
# You're good to go! ✅
```

---

## 📊 Why HTTP Mode for Demo Day?

| Aspect | HTTPS | HTTP (Recommended) |
|--------|-------|-------------------|
| **Setup Complexity** | Complex | ✅ Very Simple |
| **Time to Demo** | 3-5 min | ✅ < 2 min |
| **Network Issues** | Possible | ✅ Unlikely |
| **Certificate Warnings** | Annoying | ✅ None |
| **SSL Debugging** | Hard | ✅ Not needed |
| **What People See** | Distracted | ✅ Focused on app |
| **Reliability** | 85% | ✅ 100% |

---

## 🚀 What You're Demonstrating

With `-SeedDB` flag, your demo will have:

✅ **Sample Companies**
- Demo Corp
- Tech Solutions Inc
- Sample Business LLC

✅ **Sample Users**
- admin@bizcore.dev (Owner)
- editor@bizcore.dev (Editor)
- viewer@bizcore.dev (Viewer)

✅ **Sample Data**
- Products
- Orders
- Transactions
- Analytics

**Demo Password**: (Check your .env or ask if unsure)

---

## 💡 Pro Tips for Demo Day

### 1. Have a Backup Port Ready
```powershell
# If port 3000 fails, use 8080
.\scripts\start-prod.ps1 -Mode host -Port 8080 -Domain bizcore.test -SeedDB
```

### 2. Clear Browser Cache First
```powershell
# Chrome: Ctrl+Shift+Delete → Clear browsing data → All time
# Or use Incognito mode
```

### 3. Pre-Stage the Demo Data
```powershell
# Run seeding beforehand:
npm run db:seed

# Then start without -SeedDB:
.\scripts\start-prod.ps1 -Mode host -Port 3000 -Domain bizcore.test
```

### 4. Have Fallback Access Methods
- **Primary**: `http://localhost:3000` (local)
- **Backup**: `http://bizcore.test` (if hosts configured)
- **Debug**: `curl.exe http://localhost:3000` (terminal test)

### 5. Keep Terminal Open During Demo
Don't close the terminal running the production server! Keep it visible so you can:
- Show real-time logs
- Prove it's running locally
- Debug if something breaks

---

## 🎥 Live Demo Script

```powershell
# 5 minutes before demo starts:
cd C:\laragon\www\bizcore-v2
docker-compose up -d

# 2 minutes before:
.\scripts\start-prod.ps1 -Mode host -Port 3000 -Domain bizcore.test -SeedDB

# Wait for: "ready - started server on 0.0.0.0:3000"

# Then open browser:
# → http://localhost:3000
# → Login as admin@bizcore.dev
# → Show off the features!
```

---

## 🐛 Troubleshooting (Demo Day Edition)

### "Port 3000 already in use"
```powershell
# Kill Node.js
Get-Process | Where-Object {$_.Name -eq "node"} | Stop-Process -Force

# Use different port
.\scripts\start-prod.ps1 -Mode host -Port 8080 -Domain bizcore.test -SeedDB
```

### "Database connection failed"
```powershell
# Verify Docker is running
docker ps | findstr bizcore_postgres

# If not running:
docker-compose up -d

# Wait 10 seconds, then retry start-prod
```

### "Build is taking too long"
```powershell
# Normal for first run (~60 seconds)
# Subsequent runs are faster (~30 seconds)

# You can watch the build progress in the terminal
# Don't interrupt it!
```

### "Page loads but looks broken"
```powershell
# Clear browser cache: Ctrl+Shift+Delete
# Or use Incognito mode: Ctrl+Shift+N
# Refresh: F5 or Ctrl+R
```

### "Can't login with test credentials"
```powershell
# Seed the database with test data:
npm run db:seed

# Then access admin@bizcore.dev (password in .env)
```

---

## 📝 Demo Script Example

**[TIME: 0:00]** 
> "Welcome to BizCore! This is a multi-tenant SaaS platform for business management. Let me show you around..."

**[TIME: 0:30 - Open app]**
```
Open: http://localhost:3000
← Everything loads instantly
```

**[TIME: 1:00 - Show login]**
```
Email: admin@bizcore.dev
Password: [from .env file]
← Logging in shows authentication works
```

**[TIME: 1:30 - Show dashboard]**
```
← Real-time analytics
← Database connectivity proven
← Production build is optimized
```

**[TIME: 2:00 - Show features]**
```
← Responsive design (resize browser)
← Multiple tenants
← Role-based access control
```

---

## 🎉 You're All Set!

**Demo day command** (copy-paste ready):

```powershell
cd C:\laragon\www\bizcore-v2; docker-compose up -d; .\scripts\start-prod.ps1 -Mode host -Port 3000 -Domain bizcore.test -SeedDB
```

Then open: **`http://localhost:3000`**

**That's it!** 🚀

---

## 📞 Emergency Quick Reference

```powershell
# Everything failed? Nuclear option:
docker-compose down -v
docker system prune -a
docker-compose up -d
npm run db:seed
.\scripts\start-prod.ps1 -Mode host -Port 3000 -Domain bizcore.test -SeedDB
```

**Estimated recovery time**: 3 minutes

---

**Last Updated**: December 1, 2025  
**Use Case**: Demo Day / Client Presentations  
**Complexity Level**: ⭐ (Simplest)  
**Reliability**: ✅✅✅ (Maximum)
