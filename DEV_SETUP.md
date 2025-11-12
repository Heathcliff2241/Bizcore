# Development Setup Guide

## Running BizCore Locally

### Prerequisites

- Node.js 18+ installed
- Docker Desktop installed and running

### Quick Start

#### 1. Start Database Services

```bash
# Start PostgreSQL, PgBouncer, and pgAdmin in Docker
docker-compose up -d
```

This will start:

- **PostgreSQL** on `localhost:5432`
- **PgBouncer** on `localhost:6432`
- **pgAdmin** on `http://localhost:5050`

#### 2. Run Database Migrations

```bash
# From the root directory (first time only)
npx prisma migrate dev
npx prisma generate
```

#### 3. Start the Applications

You'll need **TWO terminal windows**:

**Terminal 1: Next.js Main App (Port 3000)**

```bash
# From the root directory
npm install  # first time only
npm run dev
```

**Terminal 2: BrandStudio Vite App (Port 5175)**

```bash
# From the brandstudio-vite directory
cd brandstudio-vite
npm install  # first time only
npm run dev
```

### Or Use the Quick Start Script

```bash
# Windows
start-dev.bat

# This will:
# 1. Open Terminal 1 with Next.js (localhost:3000)
# 2. Open Terminal 2 with BrandStudio (localhost:5175)
```

### Access Points

- **Main App (Next.js)**: <http://localhost:3000>
- **BrandStudio (Vite)**: <http://localhost:5175>
- **pgAdmin**: <http://localhost:5050>
  - Email: `admin@bizcore.dev`
  - Password: `admin123`

### Environment Variables

Root `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/bizcore_dev?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NODE_ENV="development"
```

`brandstudio-vite/.env`:

```env
VITE_API_URL="http://localhost:3000/api"
```

### Docker Commands

```bash
# Start database services
docker-compose up -d

# Stop database services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Remove all data (careful!)
docker-compose down -v
```

### Troubleshooting

#### CORS Errors

CORS is already configured for `localhost:5175` → `localhost:3000`

#### Database Connection Issues

- Ensure Docker is running: `docker ps`
- Check PostgreSQL is healthy: `docker-compose ps`
- Verify DATABASE_URL in `.env`

#### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5175
taskkill /PID <pid> /F
```

### Stopping Development

1. **Ctrl+C** in both terminal windows (Next.js and Vite)
2. Stop Docker services: `docker-compose down`
