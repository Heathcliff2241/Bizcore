# BrandStudio - Figma-Level Design Tool

A modern design studio built with Next.js, React, Tailwind CSS, Hono.js, Auth.js, Prisma, and PostgreSQL.

## Features

- **Next.js App Router**: Modern React framework with TypeScript
- **Tailwind CSS**: Utility-first CSS framework
- **Hono.js**: Fast edge-compatible API framework
- **Auth.js**: Authentication with multiple providers
- **Prisma**: Type-safe database ORM with PostgreSQL
- **Docker**: Containerized development environment

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

7. Start the development server:
   ```powershell
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/` - Next.js app router pages
- `components/` - Reusable React components
- `lib/` - Utility functions and configurations
- `prisma/` - Database schema and migrations
- `api/` - Hono.js API handlers
- `styles/` - Global styles and Tailwind config

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
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