# BizCore - Business Platform (POS & Inventory Focus)

A comprehensive business platform with integrated ordering, POS, and inventory management. This build is optimized for a lightweight, zero-dependency setup using Next.js and Prisma with SQLite.

## Features

- **Next.js App Router**: Modern React framework with TypeScript for the main platform
- **Tailwind CSS**: Utility-first CSS framework
- **Next.js Route Handlers**: Built-in API endpoints for BizCore business logic
- **Auth.js**: Unified authentication and access control
- **Prisma**: Type-safe database ORM configured with SQLite (zero external database setup required)
- **Zero-Dependency Dev Setup**: Removed Docker containerization dependencies in favor of a local file-based database.

## Architecture

This project is structured as a standalone Next.js platform:

- **BizCore (Next.js)**: Main business platform with dashboard, ordering, POS, and inventory.
- **SQLite Database**: A file-based local development database (`dev.db`), removing any database server installation requirements.
- **BrandStudio**: (Deactivated in this build) The iframe connections and Vite workspace build scripts are disabled to prioritize core POS and Inventory workflows.

## Getting Started

### Prerequisites

- Node.js 18+

### Installation & Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd Bizcorev2
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   The default values in `.env` are configured to use a local SQLite database (`file:./dev.db`) out-of-the-box.

4. Initialize the database (push Prisma schema, generate client, and run seed data):

   ```bash
   # Push the database schema and generate the Prisma client
   npm run db:push

   # Seed the database with test/demo data
   SEED_DEMO=true npm run db:seed
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

   The application will be accessible at [http://localhost:3000](http://localhost:3000).

## Database Management

You can easily inspect and manage your local SQLite database using Prisma Studio:

```bash
npm run db:studio
```

## Project Structure

- `app/` - Next.js app router pages (BizCore main app)
- `components/` - Reusable React components for BizCore
- `lib/` - Utility functions and configurations
- `prisma/` - Database schema and migrations
- `app/api/` - Next.js route handlers for BizCore's APIs
- `styles/` - Global styles and Tailwind config

## Available Scripts

- `npm run dev` - Start BizCore development server only
- `npm run dev:all` - Start BizCore development server (aliased to dev)
- `npm run build` - Build BizCore for production
- `npm run start` - Start BizCore production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

## Environment Variables

See `.env.example` for required environment variables.

## License

MIT