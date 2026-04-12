# BizCore - Simple Workflow

Your app is ready to use. Just follow these simple steps every time.

## 🚀 Development Mode (Most Common)

**Terminal 1 - Start Services:**
```powershell
cd C:\laragon\www\bizcore-v2
docker-compose up -d
```

**Terminal 2 - Start Dev Server:**
```powershell
cd C:\laragon\www\bizcore-v2
npm run dev
```

**Open Browser:**
```
http://localhost:3000
```

That's it. Edit your code, it reloads automatically.

---

## 📦 Production Build Mode (Testing)

**Terminal 1 - Start Services:**
```powershell
cd C:\laragon\www\bizcore-v2
docker-compose up -d
```

**Terminal 2 - Build & Run:**
```powershell
cd C:\laragon\www\bizcore-v2
npm run build
npm run start
```

**Open Browser:**
```
http://localhost:3000
```

---

## 🛑 Stop Everything

```powershell
# In Terminal 2: Press Ctrl+C
# In Terminal 1:
docker-compose down
```

---

## 🗄️ Database Tasks

```powershell
npm run db:seed           # Add test data
npm run db:migrate        # Run migrations
npm run db:studio         # Open Prisma Studio GUI
npm run db:push          # Push schema changes to DB
```

---

## ✅ Current Status

- ✅ Docker services running
- ✅ PostgreSQL healthy
- ✅ Next.js dev server starting on http://localhost:3000
- ✅ Ready to code

Access the app at **http://localhost:3000**
