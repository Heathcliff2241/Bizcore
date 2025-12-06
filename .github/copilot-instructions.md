# BizCore Copilot Instructions

## Architecture Overview

BizCore is a multi-tenant SaaS platform with a hybrid architecture:
- **Main App (Next.js)**: Business platform with dashboard, POS, inventory, storefront
- **BrandStudio (Vite)**: Dedicated design tool for creating storefront pages
- **Shared Auth**: Single NextAuth session across both apps
- **Database**: PostgreSQL with Prisma ORM, tenant-isolated data
- **Deployment**: Docker containers with Nginx reverse proxy

## Development Workflow

### Starting Development
```bash
# Full development environment (recommended)
npm run docker:up          # PostgreSQL, pgAdmin, Nginx
npm run dev:all           # Both Next.js (port 3000) and Vite (port 5174)

# Individual services
npm run dev               # BizCore only
npm run dev:brandstudio   # BrandStudio only
```

### Database Operations
```bash
npm run db:migrate        # Run Prisma migrations
npm run db:seed          # Seed database with test data
npm run db:studio        # Open Prisma Studio
```

### Building & Testing
```bash
npm run build            # Build BizCore for production
npm run test             # Run Jest tests
npm run lint             # ESLint check
```

## Key Patterns & Conventions

### Authentication & Sessions
- Use NextAuth with JWT strategy and custom cookie domain resolution
- Rate limiting: 5 attempts per 15 minutes, bypassed in development
- Role-based routing: admin → `/admin`, tenant users → `/dashboard/{subdomain}`
- Session includes: `id`, `email`, `role`, `tenantId`, `token`, `subdomain`

### Multi-Tenancy
- All data models include `tenantId` for isolation
- Tenants have `subdomain` for URL routing (e.g., `/storefront/{subdomain}`)
- Users can own tenants or be members with roles: owner, admin, editor, viewer

### Component Architecture

#### Next.js App Router
- Use `'use client'` directive for interactive components
- Handle `params` as `Promise` in Next.js 15 (e.g., `const { subdomain } = await params`)
- Wrap pages in `PageWrapper` for consistent loading states
- Use `Suspense` boundaries with custom `LoadingScreen` components

#### BrandStudio Canvas System
- **Konva** for canvas interaction (selection, dragging, zooming)
- **React components** embedded via `Html` wrapper for WYSIWYG previews
- Pattern for section previews:
  ```tsx
  <Rect width={size.width} height={size.height} fill="transparent" />
  <Html divProps={{ style: { position: 'absolute' } }}>
    <div style={{ transform: `scale(${zoom})` }}>
      <SectionPreview component={component} />
    </div>
  </Html>
  ```

### State Management
- **Zustand** stores for complex state (useDesignStore, usePageStore, useUIStore)
- **React hooks** for component state
- **Prisma** for database queries with type safety

### Styling & Animation
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for animations (page transitions, loading states)
- Consistent design tokens: slate color palette, blue/indigo gradients
- Responsive design with mobile-first approach

### API Patterns
- Next.js route handlers in `app/api/` directory
- RESTful endpoints with proper error handling
- CORS headers configured for cross-origin requests
- Authentication via session tokens

### Error Handling
- Client-side: Display user-friendly messages with red styling
- Rate limiting: Show countdown timers for auth failures
- Network errors: Check server status and connection

### Performance Optimizations
- `memo()` for expensive components (BackgroundStatements)
- `useMemo()` for computed values (random positions, icon data)
- Lazy loading and code splitting
- Image optimization with Next.js Image component

## Integration Points

### Inter-App Communication
- **postMessage API** for BrandStudio ↔ BizCore communication
- Shared authentication state via cookies
- Vite proxy configuration routes `/api` to Next.js backend

### External Services
- **PostgreSQL** via Prisma with connection pooling (PgBouncer)
- **NextAuth** providers (credentials-based, extensible to OAuth)
- **Docker Compose** for local development environment

## Common Gotchas

### Next.js 15 Migration
- `params` and `searchParams` are now Promises - await them
- Update all page components: `app/storefront/[subdomain]/page.tsx`, etc.

### Authentication Flow
- Clear logout flags after 5 seconds to prevent redirect loops
- Handle tenant lookup failures gracefully
- Sync rate limit state between server and client

### Canvas Rendering
- Always wrap React components in `Html` for Konva integration
- Apply zoom scaling at the container level
- Use transparent Rect for hit detection

### Database Queries
- Always include `tenantId` in where clauses for data isolation
- Use Prisma's type-safe queries over raw SQL
- Handle optional relations with null checks

## File Structure Reference

```
BizCore Main/
├── app/                    # Next.js app router
│   ├── api/               # Route handlers
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Tenant dashboards
│   ├── storefront/        # Public storefronts
│   └── admin/             # Super admin interface
├── components/            # Shared React components
├── lib/                   # Utilities (auth, prisma, rateLimit)
├── prisma/               # Database schema & migrations
└── brandstudio-vite/     # Design tool (separate Vite app)
    ├── src/components/   # BrandStudio components
    ├── src/store/        # Zustand stores
    └── src/types/        # TypeScript definitions
```

## Testing Strategy

- **Jest** for unit tests with React Testing Library
- Component tests in `__tests__/` directory
- Mock external dependencies (auth, database)
- Test multi-tenant data isolation

## Deployment Considerations

- Docker containers for consistent environments
- Nginx reverse proxy routes domains to services
- Environment-specific configurations
- Database migrations run before deployment