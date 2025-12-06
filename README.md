# BizCore - Business Platform with BrandStudio

A comprehensive business platform with integrated ordering, POS, inventory management, and design tools. Features a hybrid architecture where the main BizCore app runs on Next.js and BrandStudio (the design tool) runs on Vite for optimal performance.

## Features

- **Next.js App Router**: Modern React framework with TypeScript for the main platform
- **Vite + React**: Fast, optimized design studio for BrandStudio module
- **Tailwind CSS**: Utility-first CSS framework
- **Next.js Route Handlers**: Built-in API endpoints for BizCore business logic
- **Auth.js**: Unified authentication across all modules
- **Prisma**: Type-safe database ORM with PostgreSQL
- **Docker**: Containerized development environment
- **Hybrid Architecture**: Main app (Next.js) + Design tool (Vite) for optimal performance

## Architecture

This project uses a hybrid architecture:

- **BizCore (Next.js)**: Main business platform with dashboard, ordering, POS, and inventory
- **BrandStudio (Vite)**: Dedicated design tool embedded via iframe for faster rendering
- **Shared Authentication**: Single login system across all modules
- **Inter-app Communication**: postMessage API for seamless integration

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PowerShell (Windows)

### Installation

1. Clone the repository:

   ```powershell
   git clone <repository-url>
   cd brandstudio
   ```

2. Install dependencies:

   ```powershell
   npm install
   ```

3. Set up environment variables:

   ```powershell
   cp .env.example .env.local
   ```

   Edit `.env.local` with your values.

4. Start PostgreSQL with Docker:

   ```powershell
   npm run docker:up
   ```

5. Run database migrations:

   ```powershell
   npm run db:migrate
   ```

6. Seed the database:

   ```powershell
   npm run db:seed
   ```

7. Start the development servers:

   ```powershell
   # Option 1: Run both apps simultaneously
   npm run dev:all

   # Option 2: Run apps separately in different terminals
   npm run dev              # BizCore (Next.js) on http://localhost:3000
   npm run dev:brandstudio  # BrandStudio (Vite) on http://localhost:5174
   ```

## Docker Development Environment

This project includes a complete Docker setup with:

- **PostgreSQL**: Database server
- **pgAdmin**: Web-based database management interface
- **Nginx**: Reverse proxy for routing requests
- **Next.js**: Main BizCore application
- **BrandStudio**: Vite-based design tool

### Docker Services

| Service | URL | Description |
|---------|-----|-------------|
| BizCore (Next.js) | [http://localhost](http://localhost) | Main business platform |
| BrandStudio | [http://brandstudio.localhost](http://brandstudio.localhost) | Design tool (via Nginx) |
| pgAdmin | [http://pgadmin.localhost](http://pgadmin.localhost) | Database management |
| PostgreSQL | localhost:5432 | Database server |

### Starting Docker Environment

1. **Start all services**:

   ```powershell
   npm run docker:up
   ```

2. **View logs**:

   ```powershell
   npm run docker:logs
   ```

3. **Stop services**:

   ```powershell
   npm run docker:down
   ```

   ## Production / Hosts & TLS

   When running in production mode, you must configure the public-facing origin and TLS settings so that authentication cookies and CORS work correctly.

   - Set required environment variables in `.env.local` (or your secrets manager):
      - `NEXTAUTH_URL` — the full public origin (e.g., `https://bizcore.test`) used by NextAuth.
      - `NEXT_PUBLIC_APP_URL` — the public origin used by the app (same as `NEXTAUTH_URL` in most deployments).
      - `NEXTAUTH_COOKIE_DOMAIN` — optional (set to `.bizcore.test` to enable cross-subdomain cookies).
      - `NEXTAUTH_COOKIE_SECURE` — `true` in production (required to mark cookies as Secure when using HTTPS).

   - Make sure both `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` use `https://`.
   - If you're testing on a local network IP (e.g. `192.168.1.8`) you can either:
      - Map the public domain name to the IP in your `hosts` file and use that domain in the env variables, or
      - Use `NEXTAUTH_URL=http://192.168.1.8` with `NEXTAUTH_COOKIE_SECURE=false` and `ALLOW_INSECURE_PROD=true` (not recommended). The latter is only for temporary testing.

   Example to map a domain for local testing (Windows hosts file):

   1. Edit hosts file (as Administrator): `C:\Windows\System32\drivers\etc\hosts`
   2. Add entry:

   ```
   192.168.1.8  bizcore.test
   ```

   3. Use `https://bizcore.test` in environment variables and configure `nginx` to serve TLS.

   TLS and certificates
   - Use a trusted certificate in production (Let’s Encrypt, managed certs, or commercial CA). The nginx config `nginx/conf.d/bizcore-secure.conf` provides a secure baseline and HSTS settings.
   - If you want to automate TLS certificates using **Let's Encrypt** (`certbot`) with the included Compose override, run `scripts/start-prod-compose.ps1` which will obtain certs (staging by default) and start the production stack.

   ### Obtain certificates and start production (Windows PowerShell example):

   - Map your domain in the `hosts` file (Administrator):
      - `192.168.1.8  bizcore.test`

   - Obtain certs (staging/test):

   ```powershell
   .\scripts\start-prod-compose.ps1 -Domain 'bizcore.test' -Email 'your-email@example.com' -Staging
   ```

   The script runs `certbot` to obtain certificates (staging by default to avoid rate limits), copies them into `nginx/ssl` as `cert.pem`/`key.pem`, and starts the production compose stack with `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`.

   Important: The script uses staging by default — once verified, re-run without `-Staging` to obtain real certificates from Let's Encrypt.

   Important: Using HTTP in production is insecure. Only use HTTP for temporary local testing and set `ALLOW_INSECURE_PROD=true`. Always prefer HTTPS to protect session tokens and user data.

   Demo seeding and DB credentials
   - To prevent demo credentials from accidentally being used in production, demo data is only created when `SEED_DEMO=true` is set in your environment. This avoids default admin users being created in production. To seed demo data in development, run:

   ```powershell
   SEED_DEMO=true npm run db:seed
   ```

   - Provide DB and pgAdmin credentials via environment variables instead of using the defaults. The development defaults are helpful but should not be used in production:

      - `POSTGRES_PASSWORD` — database password
      - `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD`


4. **Rebuild and restart**:

   ```powershell
   npm run docker:build
   npm run docker:restart
   ```

5. **Clean up** (removes volumes):

   ```powershell
   npm run docker:clean
   ```

### Database Management

- **pgAdmin Access**: [http://pgadmin.localhost](http://pgadmin.localhost)
  - Email: `admin@bizcore.dev`
  - Password: `admin123`
- **Database Connection**:
  - Host: `postgres`
  - Port: `5432`
  - Database: `bizcore_dev`
  - Username: `postgres`
  - Password: `postgres123`

### Nginx Configuration

The Nginx reverse proxy routes requests based on the domain:

- `localhost` → Next.js app (port 3000)
- `brandstudio.localhost` → BrandStudio Vite app (port 5174)
- `pgadmin.localhost` → pgAdmin interface (port 80)

**Note**: Add these entries to your `hosts` file for local domain routing:

```text
127.0.0.1 localhost
127.0.0.1 brandstudio.localhost
127.0.0.1 pgadmin.localhost
```

## Project Structure

- `app/` - Next.js app router pages (BizCore main app)
- `components/` - Reusable React components for BizCore
- `lib/` - Utility functions and configurations
- `prisma/` - Database schema and migrations
- `app/api/` - Next.js route handlers for BizCore's APIs
- `styles/` - Global styles and Tailwind config
- `brandstudio-vite/` - Vite-based BrandStudio design tool
  - `src/components/` - BrandStudio-specific components
  - `src/` - Main BrandStudio app with auth handling

## Available Scripts

- `npm run dev` - Start BizCore development server only
- `npm run dev:brandstudio` - Start BrandStudio Vite development server only
- `npm run dev:all` - Start both BizCore and BrandStudio development servers
- `npm run build` - Build BizCore for production
- `npm run start` - Start BizCore production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services

## Environment Variables

See `.env.example` for required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT
