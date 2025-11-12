# BizCore Development Guide

## Overview

This guide covers daily development workflows for the BizCore application stack, including local development and Docker-based builds. The stack consists of Next.js (frontend), BrandStudio (Vite-based editor), PostgreSQL (database), PgBouncer (connection pooling), and pgAdmin (DB GUI).

## Daily Development Workflow

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ and npm
- Git

### Starting the Development Environment

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repo-url>
   cd bizcore-v2
   ```

2. **Install dependencies**:

   ```bash
   npm install
   cd brandstudio-vite && npm install && cd ..
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Update values as needed (DATABASE_URL, NEXTAUTH secrets, etc.)

4. **Start Docker services** (database, connection pooler, DB GUI, BrandStudio dev server):

   ```bash
   docker-compose up -d
   ```

   - PostgreSQL: <http://localhost:5432>
   - PgBouncer: <http://localhost:6432>
   - pgAdmin: <http://localhost:5050> (<admin@bizcore.dev> / admin123)
   - BrandStudio: <http://localhost:5173>

5. **Run Next.js locally** (for hot reloading and compilation visibility):

   ```bash
   npm run dev
   ```

   - Access at <http://localhost:3000>

6. **Database setup**:
   - Push schema: `npx prisma db push`
   - Generate client: `npx prisma generate`
   - Optional: Seed data with `npx prisma db seed`

### Development Tips

- Use `npm run dev` for Next.js to see compilation logs in real-time.
- For BrandStudio changes, restart the container if needed: `docker-compose restart brandstudio`
- Use pgAdmin for database inspection.
- Run tests: `npm test`
- Lint: `npm run lint`

### Stopping the Environment

```bash
docker-compose down
# Or to remove volumes: docker-compose down -v
```

## Building Everything on Docker

For production-like builds or full containerization:

1. **Switch to production compose** (if needed, modify docker-compose.yml):
   - Change `NODE_ENV: development` to `NODE_ENV: production`
   - Uncomment/add Next.js and NGINX services
   - Change BrandStudio to build mode instead of dev

2. **Build the images**:

   ```bash
   docker-compose build
   ```

   - This builds Next.js, BrandStudio, and other services.

3. **Start the full stack**:

   ```bash
   docker-compose up -d
   ```

   - Next.js: <http://localhost:3000>
   - BrandStudio: Served via NGINX on <http://localhost>
   - Database: localhost:5432/6432

4. **View logs**:

   ```bash
   docker-compose logs -f [service-name]
   ```

## Why Building Takes Too Long

Docker builds can be slow due to several factors:

### 1. **Layer Caching Issues**

- Docker layers are cached, but changes to early layers (e.g., package.json) invalidate subsequent caches.
- Solution: Order Dockerfile instructions to minimize invalidations (e.g., copy package.json first, then install deps, then copy source).

### 2. **Dependency Installation**

- Installing npm/yarn packages from scratch takes time, especially with large node_modules.
- Solution: Use multi-stage builds or volume mounts for dev to avoid reinstalling.

### 3. **Base Image Size**

- Alpine images are smaller but may lack pre-installed tools, leading to longer builds.
- Solution: Use optimized base images or pre-built images.

### 4. **Network and Disk I/O**

- Downloading dependencies over slow networks.
- Solution: Use local mirrors or cache layers.

### 5. **Build Context**

- Sending large build contexts (e.g., node_modules) to Docker daemon.
- Solution: Use .dockerignore to exclude unnecessary files.

### 6. **Complex Builds**

- Next.js/BrandStudio builds involve compilation, minification, etc.
- Solution: For dev, use volume mounts to avoid rebuilding on code changes.

### Optimization Tips

- Use Docker BuildKit: `DOCKER_BUILDKIT=1 docker-compose build`
- Leverage layer caching by not changing Dockerfiles unnecessarily.
- For dev, prefer local `npm run dev` over containerized builds to speed up iteration.

## Troubleshooting

- **Port conflicts**: Ensure ports 3000, 5173, 5432, etc., are free.
- **DB connection issues**: Check Docker logs: `docker-compose logs postgres`
- **Prisma errors**: Regenerate client after schema changes.
- **Slow builds**: Enable BuildKit and optimize Dockerfiles.

For more help, check the repository's issues or contact the team.
