# BizCore Copilot Instructions

## Architecture Overview

BizCore is a multi-tenant SaaS platform with hybrid architecture separating concerns:

- **Main App (Next.js on port 3000)**: Next.js 15 App Router with server/client components, handles authentication, dashboards, POS, inventory, ordering, API endpoints
- **BrandStudio (Vite on port 5174)**: Separate React app with Konva canvas for visual page design, communicates via postMessage API
- **Shared Authentication**: NextAuth with JWT strategy, single session across apps via cookies with domain resolution
- **Database**: PostgreSQL with Prisma ORM (types in `prisma/schema.prisma`), all data models include `tenantId` for multi-tenant isolation
- **Deployment**: Docker containers with Nginx reverse proxy routing subdomains to tenant apps

## Essential Development Commands

```bash
# Full environment (recommended - starts PostgreSQL, Nginx, both apps)
npm run docker:up; npm run dev:all

# Separate services
npm run dev                    # Next.js only (port 3000)
npm run dev:brandstudio        # Vite only (port 5174)
npm run db:studio             # Open Prisma Studio GUI
npm run db:migrate            # Create Prisma migration interactively
npm run db:seed               # Seed database with sample data
npm run test                  # Run Jest (--runInBand for serial execution)
npm run build                 # Build Next.js for production
npm run build:brandstudio     # Build Vite BrandStudio
```

**Important**: Docker must be running before `docker:up`. Logs visible with `npm run docker:logs`. Stop with `npm run docker:down`.

## Critical Patterns & Conventions

### Authentication & Sessions (lib/auth.ts, middleware.ts)
- **Session type**: NextAuth JWT with custom cookie domain resolution via `resolveCookieDomain()`
- **Rate limiting**: 5 failed login attempts per 15 minutes (client-side countdown in localStorage, server-side enforcement bypassed in dev)
- **Session structure**: `{ id, email, role, tenantId, token, subdomain, ...}`
- **Route protection**: All server routes use `getServerSession(authOptions)` - returns null if unauthenticated
- **Tenant routing**: Users after login go to `/dashboard/{subdomain}` (tenant context) or `/admin` (if admin role)
- **Cookie security**: Domain matches `NEXTAUTH_URL` origin; secure flag enforced in production unless `ALLOW_INSECURE_PROD=true`
- **Production requirement**: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL` must use https and matching origins - startup fails otherwise

### Multi-Tenancy Data Isolation (via Prisma)
- **Every model has `tenantId`** field - must include in ALL database queries: `where: { tenantId: tenant.id, ... }`
- **Tenant lookup**: Use `resolveTenant(session, subdomain?)` from `lib/tenant.ts` to get tenant object after validating user membership
- **Subdomain routing**: Tenant accessible via `/storefront/{subdomain}` (public) or `/dashboard/{subdomain}` (authenticated)
- **User roles per tenant**: Users have roles (owner, admin, editor, viewer) via `TenantUser` model - check role in middleware or component
- **Failed lookups**: If `resolveTenant()` returns null, return 404 - indicates user lacks access or subdomain doesn't exist

### Next.js 15 App Router Specifics
- **Dynamic segments (CRITICAL)**: `params` is now a Promise - must await in ALL page/layout components: `const { subdomain } = await params`
  - Affects `[subdomain]`, `[id]`, and any other dynamic route segments
  - Forgetting to await causes `undefined` errors and is a common Next.js 15 pitfall
  - Works in both sync and async components - just add `await`
- **Client/Server split**: Use `'use client'` only for interactive components (forms, buttons, hooks). Keep server components (API calls, DB queries) unless client interaction needed
- **API routes**: All in `app/api/*/route.ts` - export `GET`, `POST`, `PUT`, `DELETE` functions, automatically validated by Next.js
- **Session in API**: Call `getServerSession(authOptions)` - if null/undefined, return 401
- **Suspense & Loading**: Wrap async content in `<Suspense fallback={<LoadingScreen />}>` - don't use React.lazy in App Router

### API Endpoint Patterns (app/api/*/route.ts)
```typescript
// Standard request pattern
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  
  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')
  
  const tenant = await resolveTenant(session, subdomain)
  if (!tenant) return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  
  // CRITICAL: Always include tenantId filter
  const data = await prisma.model.findMany({
    where: { tenantId: tenant.id, ...filters }
  })
  return NextResponse.json(data)
}

// Error handling pattern
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validation
    if (!body.field || typeof body.field !== 'string') {
      return NextResponse.json({ error: 'Field is required' }, { status: 400 })
    }

    // Business logic
    const result = await prisma.model.create({ data: { ...body } })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[API error context]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
```
- **CORS**: Automatically handled by next.config.js `headers()` config - checks `NEXT_PUBLIC_APP_URL` for origin
- **Error responses**: Return `{ error: 'description' }` (not `message`) with appropriate status (400 bad request, 401 unauth, 403 forbidden, 404 not found, 500 server error)
- **Status codes**: Use 201 for POST that creates, 200 for successful updates, 204 for deletions that return no content
- **Response format**: For lists use `data: []`, for single objects use direct object: `NextResponse.json(obj)` not `{ data: obj }`

### Component Architecture

#### Next.js Pages & Layouts
- Store theme/brand settings in Context (see `dashboard/theme-context.tsx`)
- Tenant info loaded server-side, passed to client components via props or context
- Use `useMemo` for expensive computations (random colors, derived state)
- Use `memo()` wrapper for components receiving static props to prevent unnecessary re-renders

#### BrandStudio Canvas (Konva-based)
- Store design state in Zustand: `useDesignStore` (components tree), `usePageStore` (current page), `useUIStore` (UI state)
- **Component types**: Sections (hero, feature, etc) are full-width (1440px), children (text, image, button) are freeform
- **Canvas rendering**: Wrap React components in `<Html>` element for Konva integration
- **Zoom handling**: Apply `transform: scale(${zoom})` at container level, not individual elements
- **Hit detection**: Use transparent `<Rect>` for selection areas on Konva stage
- **Store subscriptions**: Use Zustand's `shallow` for rendering optimization on multiple fields

### State Management (Zustand stores)
- **Location**: `brandstudio-vite/src/store/` - stores use Immer middleware for immutable updates
- **Immer pattern**: Wrap store creation with `create` → `immer` middleware: `create<State>(immer((...) => ({ ... })))`
- **State mutations**: Inside actions, mutate `state` directly (Immer converts to immutable): `state.selectedIds.push(id)` not `...selectedIds`
- **Type safety**: Use `Draft<Component>` for mutable references in action bodies
- **Design store** (858 lines): Manages component tree, selection, clipboard, undo/redo (max 50 history entries)
  - **History tracking**: Every state mutation updates `history` array with current `components` snapshot
  - **Undo/Redo**: Use `historyIndex` to navigate history, discard future if action taken after undo
  - **Large store note**: Consider splitting into `componentsStore`, `historyStore`, `selectionStore` to reduce re-renders
- **Page store**: Manages current page metadata, publishing state
- **UI store**: Modal states, panel toggles, zoom level, UI-only state that doesn't affect persistence

### API Data Patterns
- **Field names**: Match database schema (snake_case in database, mapped in API responses)
- **Pagination**: Use `skip`/`take` in Prisma, return `{ data, count, total }`
- **Includes**: Use Prisma `include` to fetch relations (avoid N+1 queries)
- **Filtering**: Pass filters via query params, build dynamic where clauses safely

### Styling & Theming
- **Framework**: Tailwind CSS for utility styles, Framer Motion for animations
- **Theme variables**: Brand colors stored in tenant `settings` JSON or `primaryColor`/`secondaryColor` fields
- **Color palette**: Slate grays, blue/indigo gradients common across dashboard
- **Responsive**: Mobile-first approach - use `sm:`, `md:`, `lg:` prefixes
- **Design tokens**: No hardcoded colors in components - pull from theme context or Tailwind config

## Integration Points

### Inter-App Communication (BrandStudio ↔ BizCore)
- **Method**: postMessage API (not iframe properties - avoids cross-origin issues)
- **BrandStudio proxy**: Vite config `vite.config.ts` routes `/api/**` to Next.js `http://localhost:3000/api` with `changeOrigin: true` and cookie rewriting
- **Flow**: BrandStudio iframe sends page data via postMessage → parent app saves to DB via API
- **State sync**: Both apps share NextAuth cookies (domain-wide) so session is consistent
- **CORS in dev**: Vite server allows all origins with `cors: true` and `allowedHosts: ['bizcore.test', 'localhost']`
- **Cookie handling**: Vite proxy rewrites cookies via `cookieDomainRewrite` to ensure session persists across requests

### Database Queries
- **ORM**: Prisma only - no raw SQL except in migration files
- **Connection**: Uses PgBouncer connection pooling in production
- **Migrations**: Prisma migrate (interactive) or db push for schema sync
- **Type safety**: Prisma generates types automatically - use them for function params/returns

### External Services
- **Email**: Nodemailer integration in `lib/email.ts` (SMTP config via env)
- **Storage**: Images stored locally in public folder or external CDN
- **Analytics**: GA4 tracking code injected via tenant `googleAnalytics` field
- **Third-party**: Facebook Pixel via `facebookPixel` field

## Common Gotchas & Solutions

### Next.js 15 Migration Issues
- **Problem**: Page not rendering - `Cannot read property 'subdomain' of undefined`
  - **Solution**: Await params at top of component: `const { subdomain } = await params`
- **Problem**: Params used in dynamic segments but not awaited
  - **Solution**: All dynamic route params (`[subdomain]`, `[id]`) require await in page/layout components

### Authentication & Tenant Access
- **Problem**: User gets 404 on `/dashboard/{subdomain}` 
  - **Solution**: Check `resolveTenant()` - verify user is TenantUser member and tenant is active
- **Problem**: Session shows user email but `session.user?.id` is undefined
  - **Solution**: Verify user exists in database after custom credentials callback - sometimes password reset tokens cause issues
- **Problem**: Rate limiting countdown shows infinity
  - **Solution**: Ensure `getRateLimitTimeRemaining()` called only on client (checks `window`), server-side uses `getServerSideTimeRemaining()`

### Database & Prisma
- **Problem**: Data from other tenants visible or "Unauthorized" errors
  - **Solution**: Add `tenantId` to where clause in EVERY query - grep for `.findMany` and check filter
- **Problem**: Prisma type mismatches with API responses
  - **Solution**: Map snake_case DB fields to camelCase in API (see `app/api/products/route.ts` line 54+)
- **Problem**: Migrations fail with "relation already exists"
  - **Solution**: Check `prisma/migrations/` for conflicting migrations - resolve manually or reset dev database with `npm run docker:clean`

### Canvas & BrandStudio
- **Problem**: Dragged components don't move or disappear
  - **Solution**: Ensure component has valid `position` and `size` - dragged state in `useDesignStore` may not persist, save to store immediately
- **Problem**: Zoom doesn't scale component preview correctly
  - **Solution**: Apply zoom only at container level `transform: scale(${zoom})` - don't multiply component size
- **Problem**: Copy/paste doesn't work in canvas
  - **Solution**: Check `selectedIds.length > 0` before paste - clipboard empty if nothing was copied
- **Problem**: Undo/Redo shows old state
  - **Solution**: `useDesignStore` keeps max 50 history entries - older actions are discarded; clearing history clears all undo/redo

### Common Build & Runtime Issues
- **Docker containers won't start**: Check `npm run docker:logs` - usually missing env vars or port conflicts
- **CORS errors in development**: Verify `NEXT_PUBLIC_APP_URL` matches origin in requests (http://localhost:3000)
- **"Cannot GET /api/..."**: Ensure POST/GET functions exported from route.ts, not named export
- **Images 404 in storefront**: Check domain whitelist in `next.config.js` `images.domains` - add custom domains

## File Structure & Key Locations

```
app/                           # Next.js routes & pages
├── api/                      # API endpoints - tenant queries verified here
├── auth/                     # NextAuth signin/signup/password-reset pages
├── dashboard/[subdomain]/   # Tenant dashboard (MUST await params)
├── storefront/[subdomain]/  # Public storefront (customer-facing)
├── admin/                   # Super-admin only routes
└── studio/                  # BrandStudio iframe embed

lib/
├── auth.ts                  # NextAuth config, security headers, session type
├── tenant.ts                # resolveTenant() - validates user→tenant membership
├── rateLimit.ts             # isRateLimited(), recordFailedAttempt()
├── prisma.ts                # Prisma singleton instance
├── email.ts                 # Email service integration
└── activityLogger.ts        # logTenantActivity() for audit trails

prisma/
├── schema.prisma            # Data models - User, Tenant, Product, Order, etc.
└── migrations/              # Sequenced schema changes

brandstudio-vite/
├── src/store/               # Zustand stores (design, page, ui)
├── src/types/               # TypeScript interfaces (Component, Page, etc)
├── src/components/          # React components (Canvas, Editor, Palettes)
└── src/services/            # API client methods
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