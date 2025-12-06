# BizCore: Complete Architecture Overview
## BrandStudio + Storefront Modules

---

## 1. HIGH-LEVEL ARCHITECTURE

### 1.1 BrandStudio Module Structure

**Location:** `brandstudio-vite/src/`

```
brandstudio-vite/
├── src/
│   ├── App.tsx                          # Main app entry, auth listener
│   ├── main.tsx                         # Vite bootstrap
│   ├── App.css, index.css              # Global styles
│   │
│   ├── components/
│   │   ├── Editor/                      # Main editor UI + canvas
│   │   ├── ComponentPalette/            # Drag-drop component library
│   │   └── TextEditor/                  # Rich text editing
│   │
│   ├── store/ (Zustand state management)
│   │   ├── useDesignStore.ts            # Canvas components, CRUD, history (undo/redo), ~815 lines
│   │   ├── usePageStore.ts              # Page metadata (title, slug, published state)
│   │   └── useUIStore.ts                # Editor UI state (zoom, panels, selection)
│   │
│   ├── services/
│   │   ├── api.ts                       # Axios client (baseURL=/api, uses NextAuth cookies)
│   │   ├── pageService.ts               # POST/PUT /pages, publish/unpublish endpoints
│   │   └── productService.ts            # Product data fetching
│   │
│   ├── utils/
│   │   ├── componentLibrary.ts          # COMPONENT_LIBRARY catalog (525 lines)
│   │   │                                 # Defines all section + freeform component types
│   │   ├── sectionToComponents.ts       # Converts published JSON → Component tree
│   │   ├── textPresets.ts               # Font size/style presets
│   │   ├── fontHelpers.ts               # Google Fonts integration
│   │   └── number.ts                    # Number formatting utilities
│   │
│   ├── types/
│   │   ├── component.ts                 # Component interface (id, type, props, children, position, size, zIndex)
│   │   ├── design.ts                    # DesignState, UIState, Tool enums
│   │   ├── page.ts                      # PageDesign, ColorScheme, Typography, BrandAssets
│   │   └── product.ts                   # Product type definitions
│   │
│   ├── data/
│   │   └── sectionTemplates.ts          # Pre-built section layout templates
│   │
│   ├── assets/                          # Images, icons for component library
│   └── hooks/                           # Custom React hooks
│
├── package.json                         # Vite + Vue/React deps
├── vite.config.ts                       # Dev server on :5174, proxy /api to :3000
└── tsconfig.json
```

**Key Features:**
- Visual page builder with drag-drop interface
- Zustand-based state management (large useDesignStore needs refactoring)
- Component library catalog with 50+ templates
- Auto-save via NextAuth session cookies
- Supports headers, heroes, product grids, CTAs, testimonials, footers, forms, shapes, text blocks
- History/undo-redo with max 50 snapshots
- Google Fonts integration for typography
- SEO settings per page

---

### 1.2 Storefront (Customer-Facing) Module Structure

**Location:** `components/storefront/` + `app/storefront/[subdomain]/`

```
components/storefront/
├── index.ts                             # componentMap exports (all render-ready components)
├── types.ts                             # StorefrontContext interface
│
├── --- LAYOUT & STRUCTURE ---
├── PageRenderer.tsx                     # Main renderer: dynamically renders Component[] → React
├── HeaderSection.tsx                    # Navigation + logo + cart
├── FooterSection.tsx                    # Footer links, social
├── HeroSection.tsx                      # Full-width hero with image/overlay
│
├── --- PRODUCTS & CART ---
├── ProductGrid.tsx                      # Shows products in grid (3-6 cols, price, image)
├── CartItems.tsx                        # Cart items list with qty adjustment
├── CheckoutSummary.tsx                  # Subtotal, tax, total display
│
├── --- CONTENT BLOCKS ---
├── TextBlock.tsx                        # Styled text sections
├── ImageBlock.tsx                       # Responsive images
├── ButtonBlock.tsx, FreeformButton.tsx  # CTA buttons
├── SpacerBlock.tsx, DividerBlock.tsx   # Layout spacers/dividers
├── CTASection.tsx                       # Call-to-action section
├── NewsletterSection.tsx                # Newsletter signup
├── TestimonialsSection.tsx              # Customer testimonials grid
│
├── --- SHAPES (FREEFORM) ---
├── RectangleShape.tsx                   # Rectangle with customizable styles
├── CircleShape.tsx                      # Circle shape
├── LineShape.tsx                        # Line divider
├── FreeformText.tsx                     # Text with absolute positioning
├── FreeformImage.tsx                    # Image with absolute positioning
│
├── --- ACCOUNT & AUTH ---
├── AccountContent.tsx                   # Account overview, order history, addresses
├── AccountNavigation.tsx                # Sidebar tabs (Profile, Orders, Addresses)
├── LoginForm.tsx                        # Email + password form
├── SignUpForm.tsx                       # Registration form
├── AuthContainer.tsx                    # Auth form wrapper
│
├── hooks/
│   └── useCart.ts                       # Cart state: localStorage-based (add, remove, qty, clear)
│
├── utils/
│   └── links.ts                         # resolveStorefrontHref() - handles subdomain links
│
└── components-vite/                     # Vite-specific components (auth handlers, etc.)

app/storefront/[subdomain]/
├── page.tsx                             # Dynamic route: fetches PageDesign from DB
│                                         # Renders publishedContent via PageRenderer
└── layout.tsx
```

**Key Features:**
- **Dynamic component rendering** – PageRenderer maps component types → React components
- **Responsive layout** – Sections full-width + relative; freeform elements absolute-positioned
- **Cart management** – localStorage-based with add/update/remove operations
- **Account pages** – Profile, order history, addresses (template placeholders)
- **Auth forms** – Login/signup components (integrated with NextAuth)
- **SEO-ready** – Metadata per page, OpenGraph support
- **StorefrontContext** – Passes tenant ID, subdomain, theme colors to components

---

## 2. DATA FLOW

### 2.1 BrandStudio Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BRANDSTUDIO (Vite App)                       │
└─────────────────────────────────────────────────────────────────┘

1. TENANT CONTEXT SETUP
   ┌────────────────────────────────────────┐
   │ App.tsx: Listen for postMessage events │
   │ Receives: { type: 'TENANT_DATA', tenant: { id, name, subdomain } }
   └────────────────────────────────────────┘
   └─→ setTenantData() → available in Editor context

2. LOAD PAGE DATA
   ┌──────────────────────────────────────────────────────────────┐
   │ pageService.getPages(tenantId)                               │
   │ GET /api/pages?tenantId={tenantId}                           │
   │ Returns: PageDesign[] = { id, slug, title, content[], ... }  │
   └──────────────────────────────────────────────────────────────┘

3. COMPONENT TREE INITIALIZATION
   ┌──────────────────────────────────────────────────────────────┐
   │ useDesignStore.loadComponents(pageDesign.content)            │
   │ State: {                                                      │
   │   components: [                                              │
   │     { id, type, props, children[], position, size, zIndex }  │
   │   ],                                                          │
   │   selectedIds: [],                                           │
   │   history: [past snapshots],                                 │
   │   historyIndex: current                                      │
   │ }                                                             │
   └──────────────────────────────────────────────────────────────┘

4. EDITING & STATE UPDATES
   ┌──────────────────────────────────────────────────────────────┐
   │ Editor actions trigger store updates:                         │
   │   - addComponent()      → new section/element added          │
   │   - updateComponent()   → props/position/size changed        │
   │   - deleteComponent()   → element removed                    │
   │   - undo/redo()         → navigate history                   │
   │   - selectComponent()   → update selectedIds                 │
   │                                                              │
   │ Each action:                                                 │
   │   1. Mutates state (via Immer middleware)                   │
   │   2. Saves to history                                        │
   │   3. Marks page as dirty (isDirty = true)                   │
   └──────────────────────────────────────────────────────────────┘

5. AUTO-SAVE FLOW
   ┌──────────────────────────────────────────────────────────────┐
   │ Debounced auto-save triggered on component changes           │
   │   pageService.savePage(pageId, { content: components })      │
   │   PUT /api/pages/{pageId}                                    │
   │   Request body: { isDraft: true, content: Component[] }      │
   │   Response: updated PageDesign with timestamps               │
   │                                                              │
   │ Updates:                                                      │
   │   - setDirty(false)                                          │
   │   - setLastSaved(now)                                        │
   │   - usePageStore tracks isDirty, isSaving, lastSaved         │
   └──────────────────────────────────────────────────────────────┘

6. PUBLISH FLOW
   ┌──────────────────────────────────────────────────────────────┐
   │ User clicks "Publish"                                        │
   │   pageService.publishPage({ tenantId, pageId })              │
   │   POST /api/pages/{pageId}/publish                           │
   │                                                              │
   │ Backend:                                                      │
   │   1. Sets isPublished = true                                 │
   │   2. Copies content → publishedContent (snapshot)            │
   │   3. Sets publishedAt timestamp                              │
   │   4. Triggers revalidation (ISR/Cache invalidation)          │
   │   5. Returns response with publishUrl                        │
   │                                                              │
   │ Frontend:                                                     │
   │   - Confirmation toast                                       │
   │   - Links to public storefront page                          │
   └──────────────────────────────────────────────────────────────┘

STATE MANAGEMENT LAYERS:
┌─────────────────────────────────────────────────────────────────┐
│ useDesignStore (Zustand + Immer)                                │
│   └─ components: Component[] (full tree)                        │
│   └─ selectedIds: string[]                                      │
│   └─ history: Component[][]                                     │
│   └─ clipboard: Component[]                                     │
│                                                                  │
│ usePageStore (Zustand)                                          │
│   └─ currentPage: PageDesign                                    │
│   └─ isDirty, isSaving, lastSaved                               │
│                                                                  │
│ useUIStore (Zustand)                                            │
│   └─ leftPanelOpen, rightPanelOpen                              │
│   └─ zoom, canvasPosition, showGrid                             │
│   └─ selectedTool                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Storefront Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│               STOREFRONT (Next.js Public Page)                  │
└─────────────────────────────────────────────────────────────────┘

1. TENANT RESOLUTION
   ┌──────────────────────────────────────────────────────────────┐
   │ Route: /storefront/[subdomain] or custom domain              │
   │ app/storefront/[subdomain]/page.tsx                          │
   │                                                              │
   │ Query database:                                              │
   │   SELECT * FROM page_designs                                 │
   │   WHERE tenant.subdomain = "{subdomain}"                     │
   │     AND isPublished = true                                   │
   │     AND slug IN ('home', 'index', '')                        │
   └──────────────────────────────────────────────────────────────┘

2. PAGE CONTENT LOADING
   ┌──────────────────────────────────────────────────────────────┐
   │ Database record found:                                       │
   │   PageDesign = {                                             │
   │     id, slug, title,                                         │
   │     content: Component[],          (draft/unpublished)       │
   │     publishedContent: Component[], (latest published)        │
   │     tenant: { id, subdomain, name, primaryColor, ... },      │
   │     seoSettings: { metaTitle, metaDescription, ... }         │
   │   }                                                          │
   │                                                              │
   │ Pass to PageRenderer with:                                   │
   │   - components = publishedContent || content                 │
   │   - storefront = { id, subdomain, name, primaryColor, ... }  │
   └──────────────────────────────────────────────────────────────┘

3. DYNAMIC COMPONENT RENDERING
   ┌──────────────────────────────────────────────────────────────┐
   │ PageRenderer.tsx:                                            │
   │   1. Filter hidden components                                │
   │   2. Sort by zIndex                                          │
   │   3. For each component:                                     │
   │      - Check if section (header, hero, footer) or freeform   │
   │      - Get Component class from componentMap[type]           │
   │      - Apply positioning (relative for sections,             │
   │        absolute for freeform)                                │
   │      - Render with resolved props + StorefrontContext        │
   │                                                              │
   │ componentMap = {                                             │
   │   'header-default': HeaderSection,                           │
   │   'hero-default': HeroSection,                               │
   │   'product-grid': ProductGrid,                               │
   │   'text': FreeformText,                                      │
   │   ... (60+ entries)                                          │
   │ }                                                            │
   └──────────────────────────────────────────────────────────────┘

4. STYLING & THEME APPLICATION
   ┌──────────────────────────────────────────────────────────────┐
   │ Each component receives props including:                     │
   │   - backgroundColor, textColor, borderRadius, padding        │
   │   - Stored in PageDesign.content[].props                     │
   │                                                              │
   │ Global tenant branding:                                      │
   │   - primaryColor, secondaryColor from tenant record          │
   │   - Logo URL, favicon from tenant.logo                       │
   │   - Can be applied to header, buttons, links                 │
   │                                                              │
   │ Applied via inline style + Tailwind classes                  │
   └──────────────────────────────────────────────────────────────┘

5. INTERACTIVE FEATURES (Client-side)
   ┌──────────────────────────────────────────────────────────────┐
   │ CartItems component:                                         │
   │   - useCart(subdomain) hook                                  │
   │   - Reads/writes cart from localStorage[storefront_cart_{subdomain}]
   │   - addToCart(), removeFromCart(), updateQuantity()          │
   │                                                              │
   │ ProductGrid component:                                       │
   │   - Can link to individual product pages                     │
   │   - Shows mock products if none provided                     │
   │   - Responsive grid (3-6 columns)                            │
   │                                                              │
   │ LoginForm / SignUpForm:                                      │
   │   - Submits to NextAuth endpoints                            │
   │   - /api/auth/signin (NextAuth)                              │
   │   - /api/auth/register (custom endpoint)                     │
   └──────────────────────────────────────────────────────────────┘

CUSTOMER JOURNEY PAGES (all template-driven):
┌─────────────────────────────────────────────────────────────────┐
│ 1. Homepage (slug='home')                                       │
│    └─ Hero + Product Grid + CTA + Newsletter + Footer          │
│                                                                  │
│ 2. Menu/Products (slug='menu')                                  │
│    └─ Product Grid (filterable by category)                    │
│                                                                  │
│ 3. Cart (slug='cart')                                           │
│    └─ CartItems + CheckoutSummary + Checkout CTA              │
│                                                                  │
│ 4. Account (slug='account')                                     │
│    └─ AccountNavigation + AccountContent (requires login)       │
│                                                                  │
│ 5. Login (slug='login')                                         │
│    └─ LoginForm (redirects to /account on success)              │
│                                                                  │
│ 6. Signup (slug='signup')                                       │
│    └─ SignUpForm (creates customer record, redirects to login)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. INTEGRATION POINTS

### 3.1 BrandStudio ↔ Storefront Connection

```
PUBLISH WORKFLOW:
┌────────────────────────────────────────────────────────────────┐
│ BrandStudio (Vite)           Backend              Storefront   │
│     │                           │                      │        │
│     ├─ User clicks Publish  ────→ /api/pages/{id}/publish      │
│     │                           │                      │        │
│     │                           ├─ Copy content →      │        │
│     │                           │   publishedContent    │        │
│     │                           │                      │        │
│     │                           ├─ Set isPublished=true │       │
│     │                           │                      │        │
│     │                           ├─ Revalidate ISR ────→ Refresh │
│     │                           │  (next/cache)        page     │
│     │                           │                      │        │
│     ←──── Response ────────────│←─────────────────    │        │
│     (publishUrl, preview)       │                      │        │
│                                 │                      │        │
└────────────────────────────────────────────────────────────────┘

TEMPLATE PROPAGATION:
- BrandStudio defines Component types → componentLibrary.ts (525 lines)
- componentLibrary has 50+ section/freeform types (header, hero, product-grid, etc.)
- Storefront imports these via componentMap[] (index.ts)
- pageService validates: scripts/validateComponentContract.js
  └─ Ensures BrandStudio types match Storefront components
  └─ Runs in CI/CD before deployment
```

### 3.2 Storefront ↔ BizCore Integration Points

**A. Product Data**
```
┌───────────────────────────────────────────────────────────────┐
│ Storefront → Backend API                                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ /api/products (GET)                                           │
│   Query params: ?subdomain={subdomain}                        │
│   Response: {                                                 │
│     success: true,                                            │
│     data: [{                                                  │
│       id, name, description, price, cost_price, image,       │
│       category_id, category_name, is_active,                 │
│       Ingredients: [...],                                    │
│       productVariants: [...]                                 │
│     }]                                                        │
│   }                                                           │
│                                                               │
│ Implementation: app/api/products/route.ts                     │
│   - Validates session (NextAuth)                              │
│   - Resolves tenant from subdomain                            │
│   - Queries Prisma: Product (includes category, variants)     │
│   - Formats response for storefront consumption               │
│                                                               │
│ Used by: ProductGrid component (mock data fallback)           │
└───────────────────────────────────────────────────────────────┘

/api/products/[id] (GET)
  - Fetch individual product details
  - Used for product detail pages
```

**B. Order Management**
```
┌───────────────────────────────────────────────────────────────┐
│ Storefront → Backend API                                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ POST /api/orders                                              │
│   Request body: {                                             │
│     customerId, items: [{ productId, quantity, price }],     │
│     total, tax, notes, orderType: "delivery|takeout|dine-in" │
│   }                                                           │
│   Response: { success: true, data: { orderId, orderNumber } }│
│                                                               │
│ GET /api/orders?subdomain={subdomain}                        │
│   Returns: All orders for tenant                              │
│   Fields: id, order_number, customer_name, status,           │
│           total_amount, created_at, payment_status           │
│                                                               │
│ GET /api/orders/{id}                                          │
│   Returns: Single order with all details + status history     │
│                                                               │
│ PUT /api/orders/{id}                                          │
│   Updates order status (pending → confirmed → ready, etc.)   │
│                                                               │
│ Implementation: app/api/orders/route.ts, app/api/orders/[id]/route.ts
│   - Validates session                                         │
│   - Resolves tenant                                           │
│   - CRUD operations on Prisma Order model                     │
│   - Maintains order_status history (OrderStatusHistory)       │
│                                                               │
│ Used by: AccountContent (order history), CheckoutSummary     │
└───────────────────────────────────────────────────────────────┘
```

**C. Customer Accounts**
```
┌───────────────────────────────────────────────────────────────┐
│ Storefront → Backend API                                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ GET /api/customers?subdomain={subdomain}                     │
│   Returns: All customers for tenant                           │
│                                                               │
│ GET /api/customers/{id}?subdomain={subdomain}                │
│   Returns: Single customer + order history                    │
│   Fields: id, firstName, lastName, email, phone,             │
│           address, createdAt, updatedAt, orders[]            │
│                                                               │
│ PUT /api/customers/{id}                                       │
│   Update customer details (email, phone, address)             │
│                                                               │
│ Implementation: app/api/customers/route.ts, [id]/route.ts    │
│   - Validates session                                         │
│   - CRUD on Prisma Customer model                             │
│   - Includes related orders                                   │
│                                                               │
│ Used by: AccountContent (profile, orders), order pages        │
└───────────────────────────────────────────────────────────────┘
```

**D. Authentication (NextAuth)**
```
┌───────────────────────────────────────────────────────────────┐
│ Storefront Forms → Backend                                    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ POST /api/auth/signin (NextAuth)                              │
│   Provider: CredentialsProvider                               │
│   Credentials: { email, password }                            │
│   Logic: app/auth/signin/page.tsx (form) →                   │
│          signIn('credentials', { email, password })           │
│   Backend: lib/auth.ts                                        │
│     - Query User table                                        │
│     - Compare password (bcrypt)                               │
│     - Rate limiting (5 attempts in 15 min)                    │
│     - Return JWT token + session cookie                       │
│                                                               │
│ POST /api/auth/register (Custom)                              │
│   Request: { name, email, password, businessName }           │
│   Backend: app/api/auth/register/route.ts                     │
│     - Create User record (hash password)                      │
│     - Create Tenant record (subdomain auto-generated)         │
│     - Create default pages (home, menu, account, login)       │
│     - Return: { success: true, tenant: {...} }               │
│                                                               │
│ Used by: LoginForm.tsx, SignUpForm.tsx                        │
│          /auth/signin, /auth/signup pages                     │
└───────────────────────────────────────────────────────────────┘
```

**E. Page Content (Dynamic CMS)**
```
┌───────────────────────────────────────────────────────────────┐
│ Storefront → Backend API                                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ GET /api/pages?tenantId={tenantId}                            │
│   Returns: All pages for tenant                               │
│   Used by: BrandStudio to list pages for editing              │
│                                                               │
│ GET /api/pages/{id}                                           │
│   Returns: Single page + content + seo settings               │
│   Used by: BrandStudio editor, storefront (when published)    │
│                                                               │
│ Implementation: app/api/pages/route.ts, [id]/route.ts        │
│   - Database schema: PageDesign                               │
│   - Fields: id, tenantId, slug, title, content[],            │
│             publishedContent[], template, isPublished,        │
│             seoSettings, createdAt, updatedAt, publishedAt    │
│                                                               │
│ Used by: PageRenderer (storefront public pages)               │
└───────────────────────────────────────────────────────────────┘
```

**F. Inventory Management**
```
┌───────────────────────────────────────────────────────────────┐
│ Storefront → Backend API                                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ GET /api/ingredients?subdomain={subdomain}                    │
│   Returns: All ingredients (for POS, used by products)        │
│                                                               │
│ GET /api/ingredients/{id}                                     │
│   Returns: Single ingredient + stock level                    │
│                                                               │
│ POST /api/ingredients/{id}/adjust-stock                       │
│   Adjust inventory when order is placed                       │
│   Request: { quantity, reason: "order|adjustment" }           │
│                                                               │
│ Implementation: app/api/ingredients/route.ts                  │
│   - Tracks ingredient quantities                              │
│   - Maintains inventory transaction log                       │
│   - Used by: Product cost calculation, stock warnings         │
└───────────────────────────────────────────────────────────────┘
```

---

### 3.3 Integration Diagram: Full System

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BIZCORE ECOSYSTEM                             │
└──────────────────────────────────────────────────────────────────────┘

                          Next.js Backend
                      (app/api, lib/, prisma/)
                              │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
    ┌──────────────┐   ┌────────────────┐   ┌──────────────┐
    │ BrandStudio  │   │   Storefront   │   │  Admin Panel │
    │  (Vite SPA)  │   │ (Next.js SSR)  │   │(Next.js)     │
    │ :5174        │   │ /storefront    │   │ /admin       │
    │              │   │ /auth          │   │ /dashboard   │
    └──────────────┘   └────────────────┘   └──────────────┘
           │                    │                    │
           │                    │                    │
    ┌──────────────────────────────────────────────────────────┐
    │          NextAuth Session Management                     │
    │  (JWT + HTTP-only cookies, rate limiting)                │
    └──────────────────────────────────────────────────────────┘
           │                    │                    │
           └────────────────────┼────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   ┌────────────┐        ┌─────────────┐        ┌─────────────┐
   │ Pages API  │        │ Products    │        │ Orders API  │
   │ /api/pages │        │ API         │        │ /api/orders │
   │ - CRUD     │        │ /api/products        │ - List      │
   │ - Publish  │        │ - List      │        │ - Create    │
   │ - Revisions│        │ - Details   │        │ - Update    │
   │            │        │             │        │ - History   │
   └────────────┘        └─────────────┘        └─────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Prisma ORM          │
                    │ - PageDesign          │
                    │ - Product             │
                    │ - Order               │
                    │ - Customer            │
                    │ - Tenant              │
                    │ - Category            │
                    │ - Ingredient          │
                    └───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │  PostgreSQL Database  │
                    │ (Multi-tenant)        │
                    └───────────────────────┘

API ENDPOINTS SUMMARY:
├─ Authentication
│  ├─ POST   /api/auth/register          (Create account + tenant)
│  ├─ POST   /api/auth/signin            (NextAuth credentials)
│  └─ GET    /api/auth/[...nextauth]     (NextAuth handlers)
│
├─ Pages (CMS)
│  ├─ GET    /api/pages                  (List all pages)
│  ├─ POST   /api/pages                  (Create page)
│  ├─ GET    /api/pages/{id}             (Get page)
│  ├─ PUT    /api/pages/{id}             (Save page)
│  ├─ DELETE /api/pages/{id}             (Delete page)
│  ├─ POST   /api/pages/{id}/publish     (Publish page)
│  ├─ POST   /api/pages/{id}/unpublish   (Unpublish page)
│  └─ GET    /api/pages/{id}/revisions   (Page history)
│
├─ Products
│  ├─ GET    /api/products               (List products)
│  ├─ POST   /api/products               (Create product)
│  ├─ GET    /api/products/{id}          (Get product)
│  ├─ PUT    /api/products/{id}          (Update product)
│  └─ DELETE /api/products/{id}          (Delete product)
│
├─ Orders
│  ├─ GET    /api/orders                 (List orders)
│  ├─ POST   /api/orders                 (Create order)
│  ├─ GET    /api/orders/{id}            (Get order)
│  ├─ PUT    /api/orders/{id}            (Update order status)
│  └─ GET    /api/orders/stats/dashboard (Order analytics)
│
├─ Customers
│  ├─ GET    /api/customers              (List customers)
│  ├─ POST   /api/customers              (Create customer)
│  ├─ GET    /api/customers/{id}         (Get customer)
│  └─ PUT    /api/customers/{id}         (Update customer)
│
├─ Inventory
│  ├─ GET    /api/ingredients            (List ingredients)
│  ├─ POST   /api/ingredients            (Create ingredient)
│  ├─ PUT    /api/ingredients/{id}       (Update ingredient)
│  └─ POST   /api/ingredients/{id}/adjust-stock (Adjust stock)
│
└─ Settings
   ├─ GET    /api/settings               (Get tenant settings)
   └─ PUT    /api/settings               (Update tenant settings)
```

---

## 4. STOREFRONT FUNCTIONALITY

### 4.1 Currently Implemented

| Feature | Component | API | Status |
|---------|-----------|-----|--------|
| **Homepage** | HeroSection, ProductGrid, FooterSection | /api/pages | ✅ Implemented |
| **Browse Menu** | ProductGrid | /api/products | ✅ Implemented |
| **View Product Details** | ProductGrid (links to product page) | /api/products/{id} | ✅ Partially |
| **Add to Cart** | CartItems, useCart hook | localStorage | ✅ Implemented |
| **View Cart** | CartItems, CheckoutSummary | localStorage | ✅ Implemented |
| **Update Cart Qty** | CartItems | localStorage | ✅ Implemented |
| **Checkout Flow** | CheckoutSummary | /api/orders POST | 🟡 Template Ready |
| **Login** | LoginForm | /api/auth/signin | ✅ Implemented |
| **Logout** | HeaderSection (button) | /api/auth/signout | ✅ NextAuth |
| **Signup/Register** | SignUpForm | /api/auth/register | ✅ Implemented |
| **Account Dashboard** | AccountContent + AccountNavigation | /api/customers/{id} | 🟡 Template Ready |
| **Order History** | AccountContent | /api/orders | 🟡 Template Ready |
| **Track Order Status** | (In AccountContent) | /api/orders/{id} | 🟡 Template Ready |
| **Pickup/Delivery Options** | (Form in CheckoutSummary) | /api/orders POST | 🟡 Needs Implementation |
| **Payment Integration** | (Placeholder in CheckoutSummary) | /api/stripe (or similar) | ❌ Not Implemented |
| **Email Verification** | (Auth flow) | /api/auth/verify-email | ❌ Not Implemented |

### 4.2 File Locations & Implementation Details

**Login/Authentication:**
- `/app/auth/signin/page.tsx` – Login UI form
- `/app/auth/signup/page.tsx` – Registration UI form  
- `components/storefront/LoginForm.tsx` – Reusable login component
- `components/storefront/SignUpForm.tsx` – Reusable signup component
- `/lib/auth.ts` – NextAuth configuration + credential validation
- `/app/api/auth/[...nextauth]` – NextAuth route handlers

**Shopping Flow:**
- `components/storefront/HeaderSection.tsx` – Navigation + cart button
- `components/storefront/ProductGrid.tsx` – Product list/grid display
- `components/storefront/CartItems.tsx` – Cart display + qty controls
- `components/storefront/CheckoutSummary.tsx` – Total calculator + checkout button
- `components/storefront/hooks/useCart.ts` – Cart state (localStorage)

**Account Management:**
- `components/storefront/AccountContent.tsx` – Account overview (template)
- `components/storefront/AccountNavigation.tsx` – Sidebar navigation
- `/app/dashboard/[subdomain]/customers/page.tsx` – Admin customer list
- `/app/api/customers/route.ts` – Customer API (list, create)
- `/app/api/customers/[id]/route.ts` – Customer details + orders

**Order Management:**
- `/app/api/orders/route.ts` – GET (list) + POST (create)
- `/app/api/orders/[id]/route.ts` – GET (details) + PUT (update status)
- `/app/api/orders/stats/dashboard` – Analytics

**Page Rendering:**
- `components/storefront/PageRenderer.tsx` – Main renderer (dynamic component resolution)
- `app/storefront/[subdomain]/page.tsx` – Dynamic route handler
- `app/storefront/[subdomain]/[slug]/page.tsx` – Nested page support (future)

---

## 5. DYNAMIC & CUSTOMIZABLE FEATURES

### 5.1 BrandStudio-Controlled Customizations

| Customization | Component Type | Configurable Fields | Storefront Integration |
|---------------|----------------|---------------------|------------------------|
| **Header/Navigation** | `header-default` | logo, nav links, colors, height, sticky | HeaderSection.tsx |
| **Hero Sections** | `hero-default`, `hero-split`, `hero-minimal` | heading, subheading, image, overlay, colors, height | HeroSection.tsx |
| **Product Grid** | `product-grid`, `product-carousel` | columns, price visibility, title, bg color | ProductGrid.tsx |
| **Buttons/CTAs** | `button-block`, `cta-section`, `cta-banner` | text, link, colors, size, shadow | ButtonBlock.tsx, CTASection.tsx |
| **Text Blocks** | `text`, `text-block` | content, font, size, color, alignment | TextBlock.tsx, FreeformText.tsx |
| **Images** | `image-block`, `freeform-image` | src, alt, size, position, rotation | ImageBlock.tsx, FreeformImage.tsx |
| **Shapes** | `rectangle`, `circle`, `line` | color, size, position, rotation, zIndex | RectangleShape.tsx, etc. |
| **Spacing** | `spacer-block`, `spacer` | height, background color | SpacerBlock.tsx |
| **Dividers** | `divider-block`, `divider` | color, width, style | DividerBlock.tsx |
| **Footer** | `footer-default`, `footer-detailed` | links, colors, columns, logo | FooterSection.tsx |
| **Testimonials** | `testimonials-grid`, `testimonials-carousel` | quotes, author, image, layout | TestimonialsSection.tsx |
| **Newsletter** | `newsletter-section` | title, description, button text | NewsletterSection.tsx |
| **Forms** | `login-form`, `signup-form`, `contact-form` | fields, validation, styling | LoginForm.tsx, SignUpForm.tsx |
| **Account Pages** | `account-content`, `account-navigation` | sections, menu items, labels | AccountContent.tsx, AccountNavigation.tsx |

### 5.2 Tenant-Level Branding

**Source:** `Tenant` model in database
**Applied in Storefront via `StorefrontContext`:**

```typescript
interface StorefrontContext {
  id: number              // tenant ID
  subdomain: string       // unique identifier
  name: string            // display name
  settings?: Record<string, unknown>  // custom JSON settings
  primaryColor?: string   // RGB/hex (e.g., #1e40af)
  secondaryColor?: string // RGB/hex (e.g., #059669)
}
```

**Used by Components:**
- `HeaderSection` – primaryColor for buttons, links
- `ButtonBlock` – background color overrides
- `HeroSection` – overlay colors
- `ProductGrid` – hover effects
- `FooterSection` – link colors

---

## 6. BOTTLENECKS AND INCOMPLETE AREAS

### 6.1 BrandStudio Issues

**Performance & Architecture:**
1. **Large Store File** (`useDesignStore.ts` ~815 lines)
   - TODO comment suggests splitting:
     - `componentsStore` (tree + CRUD)
     - `historyStore` (undo/redo)
     - `selectionStore` (selectedIds, hoveredId)
   - Currently causes excessive re-renders on any state change
   - **Impact:** Sluggish editing experience with many components
   - **Priority:** HIGH (before MVP)

2. **Limited Component Library**
   - ~50 templates defined, but many are simplistic
   - Missing: advanced product filters, sliders, carousels (carousel exists but basic)
   - Missing: conditional rendering, dynamic data binding
   - **Impact:** Limited design flexibility
   - **Priority:** MEDIUM (post-MVP)

3. **No Real-time Collaboration**
   - Single user editing only
   - No conflict resolution for concurrent edits
   - **Impact:** Not critical for MVP
   - **Priority:** LOW

4. **Publishing & Revalidation**
   - ISR (Incremental Static Regeneration) setup may not be optimal
   - No preview mode before publishing
   - No rollback to previous versions
   - **Impact:** Risk of broken pages going live
   - **Priority:** MEDIUM

---

### 6.2 Storefront Issues

**Critical Missing Features:**
1. **Checkout Flow**
   - `CheckoutSummary` is a display component only
   - No payment processing (Stripe, PayPal, etc.)
   - No shipping/delivery address form
   - No order confirmation email
   - **Impact:** Cannot complete sales
   - **Priority:** CRITICAL (MVP blocker)

2. **Order Status Tracking**
   - `OrderStatusHistory` table exists in DB
   - No UI to display real-time status updates
   - No customer notifications (SMS/email)
   - **Impact:** Poor customer experience
   - **Priority:** HIGH (MVP)

3. **Account Features**
   - Templates exist but not fully wired
   - Saved addresses not functional
   - Order history display needs API integration
   - Profile editing not implemented
   - **Impact:** Reduced customer retention
   - **Priority:** HIGH (post-MVP)

4. **Product Variants**
   - Database supports variants (size, color, etc.)
   - UI for selecting variants missing
   - No variant-specific pricing/inventory
   - **Impact:** Cannot sell customizable products
   - **Priority:** HIGH (MVP if applicable)

5. **Inventory Management**
   - Stock levels not displayed to customer
   - No "out of stock" handling
   - No backorder flow
   - **Impact:** Overselling risk
   - **Priority:** MEDIUM (MVP)

6. **Performance**
   - No image optimization (should use Next.js Image)
   - No lazy loading for product grids
   - No caching headers set
   - **Impact:** Slow storefront on mobile
   - **Priority:** MEDIUM

---

### 6.3 Integration Issues

**Data Consistency:**
1. **BrandStudio ↔ Storefront Component Contract**
   - `scripts/validateComponentContract.js` ensures parity
   - But no automated testing in CI
   - **Impact:** Silent feature gaps
   - **Priority:** MEDIUM (set up CI validation)

2. **Multi-Tenant Data Isolation**
   - Tenant context must be validated on every API call
   - No RBAC (Role-Based Access Control) yet
   - **Impact:** Security risk in production
   - **Priority:** HIGH

3. **SEO & Meta Tags**
   - Database supports SEO settings
   - Not fully rendered in HTML head
   - No sitemap generation
   - **Impact:** Poor search visibility
   - **Priority:** MEDIUM (post-MVP)

---

## 7. RECOMMENDED MVP STRUCTURE

### 7.1 MVP Scope (Minimal Viable Product)

**What MUST be built first:**

#### Phase 1: Core Storefront (1-2 weeks)
- [ ] **Checkout Flow** (CRITICAL)
  - Address form (zip, street, city, state)
  - Delivery method selector (pickup vs. delivery)
  - Payment method selector (cash vs. card)
  - Order confirmation page
  - File: `components/storefront/CheckoutForm.tsx` (NEW)
  
- [ ] **Order Creation API**
  - POST `/api/orders` accepts full checkout data
  - Creates Order + OrderItems + OrderStatusHistory (pending)
  - Returns orderId + orderNumber
  - File: Enhanced `/app/api/orders/route.ts`

- [ ] **Order Confirmation Email**
  - Trigger on successful order creation
  - Include order number, items, total, ETA
  - File: `lib/email.ts` (NEW) + transactional email template

- [ ] **Inventory Deduction**
  - Deduct ordered items from ingredient stock on order creation
  - File: Enhanced `/app/api/orders/route.ts`

#### Phase 2: Admin Monitoring (1 week)
- [ ] **Admin Order Dashboard**
  - Real-time order list with status
  - Quick status update buttons (pending → confirmed → ready → picked_up)
  - File: Already exists at `/app/dashboard/[subdomain]/orders`

- [ ] **Order Status Notifications**
  - Send SMS/email when status changes (optional for MVP)
  - File: `lib/notifications.ts` (NEW)

#### Phase 3: Customer Account (1 week)
- [ ] **Order History Page**
  - Wire AccountContent to real API
  - Show past orders with status
  - File: Enhanced `components/storefront/AccountContent.tsx`

- [ ] **Order Details Page**
  - Show single order: items, total, status timeline, tracking
  - File: `app/storefront/[subdomain]/orders/[id]/page.tsx` (NEW)

#### Phase 4: Storefront Foundation (1 week)
- [ ] **Ensure All 6 Default Pages Work**
  - home, menu, cart, account, login, signup
  - All linked together correctly
  - File: `/lib/defaultPages.ts` + Storefront routes

---

### 7.2 MVP Priority Matrix

**MUST HAVE (Blocker):**
1. ✅ Browsable product menu (ProductGrid)
2. ✅ Add to cart (useCart hook)
3. ✅ View cart (CartItems)
4. ❌ **Checkout form with delivery/payment** ← BUILD FIRST
5. ❌ **Order creation API** ← BUILD FIRST
6. ❌ **Inventory deduction** ← BUILD FIRST
7. ✅ Login/signup forms
8. ✅ Account page (template ready)

**SHOULD HAVE (High Value):**
1. Order history display
2. Order status tracking (real-time)
3. Admin order dashboard updates
4. Product variants (if offering customization)
5. Estimated prep time display

**NICE TO HAVE (Post-MVP):**
1. Payment processing (Stripe/PayPal)
2. Email notifications
3. SMS notifications
4. Loyalty points
5. Promotion codes
6. Product reviews
7. Advanced filters (price, rating, category)

---

### 7.3 File Creation Checklist for MVP

**New Files to Create:**
```
CRITICAL:
├── components/storefront/CheckoutForm.tsx          (Checkout UI)
├── lib/email.ts                                     (Email service)
├── lib/notifications.ts                             (SMS/push alerts)
├── app/storefront/[subdomain]/orders/[id]/page.tsx (Order detail page)

ENHANCEMENT:
├── app/api/orders/route.ts                         (Enhanced POST)
├── components/storefront/AccountContent.tsx        (Wire to API)
├── app/storefront/[subdomain]/page.tsx             (Link default pages)

TESTING/VALIDATION:
└── scripts/validateComponentContract.js             (Already exists)
```

**Estimated Lines of Code:**
- CheckoutForm.tsx: 150-200 lines
- Email service: 100-150 lines
- Enhanced POST /api/orders: 200-300 lines
- Order detail page: 100-150 lines
- **Total: ~600-800 LOC**

---

### 7.4 Database Schema Needs (Already Exists, Validate)

**Must Exist:**
- ✅ `Order` table (status, total, tax, orderType, paymentStatus, paymentMethod)
- ✅ `OrderItem` table (productId, quantity, price)
- ✅ `OrderStatusHistory` table (order tracking)
- ✅ `Customer` table (for guest checkout: create temp record)
- ✅ `Product` table (price, inventory)
- ✅ `Ingredient` table (stock tracking)
- ⚠️ `Address` table (for saved addresses) – Create if missing

**Migration Needed (if missing):**
```sql
-- Check if Address table exists; if not, create:
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  customerId INT NOT NULL REFERENCES customers(id),
  label VARCHAR(50),        -- "Home", "Work"
  street VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(100),
  isDefault BOOLEAN,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

---

### 7.5 Key Milestones

| Milestone | Target | Blocker |
|-----------|--------|---------|
| Checkout form + API | Week 1 | YES |
| Order confirmation + inventory deduction | Week 1 | YES |
| Admin order dashboard | Week 2 | NO |
| Order tracking (customer view) | Week 2 | NO |
| Account/order history | Week 2 | NO |
| End-to-end testing | Week 3 | YES |
| **MVP LAUNCH READY** | **Week 3** | ✅ |

---

## 8. ARCHITECTURE RECOMMENDATIONS FOR SCALABILITY

### 8.1 Immediate Refactorings (Before Production)

1. **Split BrandStudio Store** (Reduce re-renders)
   ```
   useDesignStore.ts (815 lines) →
     ├── useComponentStore.ts (CRUD, tree management)
     ├── useHistoryStore.ts (undo/redo)
     ├── useSelectionStore.ts (selectedIds, hoveredId)
     └── useClipboardStore.ts (copy/paste)
   ```

2. **Optimize Storefront Component Rendering**
   ```
   PageRenderer.tsx (181 lines) →
     ├── useMemoize expensive component lookups
     ├── Add React.memo to heavy components
     └── Implement virtualization for large product lists
   ```

3. **API Rate Limiting**
   - Implement in `lib/rateLimit.ts` (already started)
   - Apply to: /orders, /customers, /pages endpoints

4. **Database Indexing**
   - Add indexes on frequently queried fields:
     - `pageDesign(tenantId, slug, isPublished)`
     - `order(tenantId, customerId, status, createdAt)`
     - `product(tenantId, categoryId, isActive)`

### 8.2 Long-term Improvements (Post-MVP)

1. **Caching Strategy**
   - Redis for tenant settings, product catalog
   - Cache invalidation on publish

2. **Image Optimization**
   - CloudFront/CDN for static assets
   - Sharp/Next.js Image for on-demand resizing

3. **Real-time Features** (WebSocket)
   - Order status updates to customers
   - Admin notifications for new orders

4. **Analytics & Monitoring**
   - Track page views, conversion rates
   - Monitor API performance

---

## 9. QUICK REFERENCE: File → Feature Mapping

| User Story | BrandStudio File | Storefront File | API Route |
|-----------|-----------------|-----------------|-----------|
| Design homepage | Editor.tsx + useDesignStore | PageRenderer.tsx | /api/pages |
| Publish design | pageService.publishPage() | ← Uses published content | POST /api/pages/{id}/publish |
| Browse products | (N/A) | ProductGrid.tsx | GET /api/products |
| Add to cart | (N/A) | CartItems.tsx + useCart | localStorage |
| Checkout | (N/A) | CheckoutForm.tsx (NEW) | POST /api/orders |
| View account | (N/A) | AccountContent.tsx | GET /api/customers/{id} |
| View orders | (N/A) | AccountContent.tsx | GET /api/orders |
| Login | (N/A) | LoginForm.tsx | POST /api/auth/signin |
| Signup | (N/A) | SignUpForm.tsx | POST /api/auth/register |

---

## 10. SUMMARY TABLE: Current State of MVP

| Feature | Implemented | Notes |
|---------|-------------|-------|
| **UI Design Tool (BrandStudio)** | 90% | Store refactoring needed |
| **Page Publishing** | 80% | Preview mode missing |
| **Dynamic Page Rendering (Storefront)** | 90% | Working well |
| **Product Browsing** | 70% | Mock data fallback, no real integration |
| **Shopping Cart** | 100% | localStorage-based, functional |
| **Checkout Flow** | 0% | ❌ CRITICAL - NOT IMPLEMENTED |
| **Order Creation** | 50% | Schema exists, form missing |
| **Order Tracking** | 30% | DB schema ready, UI not wired |
| **Customer Accounts** | 20% | Templates exist, API integration missing |
| **Authentication** | 100% | NextAuth fully set up |
| **Admin Dashboard** | 60% | Order management incomplete |
| **Inventory Management** | 30% | DB schema exists, deduction logic missing |
| **Multi-tenancy** | 90% | Subdomain routing works, RBAC missing |
| ****MVP Readiness** | **~40%** | **2-3 weeks to launch** |

---

**Last Updated:** November 19, 2025
**System Status:** Active Development → MVP Phase
