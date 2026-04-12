# BizCore System Architecture

Simplified multi-tier architecture for BizCore, designed for deployment in institutional networks (LAN) or cloud environments.

---

## Architecture Overview

BizCore is built on a three-tier web application architecture with complete separation between client presentation, application logic, and persistent data storage. The system supports multiple tenant organizations through complete data isolation while maintaining a single codebase.

**Architecture Principles:**
- **Three-Tier Design**: Client layer, Application layer, Data layer
- **Multi-Tenancy**: Complete data isolation via `tenantId` on all business entities  
- **Web-Based Access**: Browser-based clients (no special software required)
- **Deployment-Flexible**: Can be deployed on-premise, cloud, or hybrid environments
- **Containerized**: Docker-based deployment for consistency across environments

---

## Network Model

```
╔════════════════════════════════════════════════════════════════════════════════════╗
║                           BIZCORE SYSTEM ARCHITECTURE                              ║
║                      Three User Types - Three Access Paths                         ║
╚════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER (Presentation)                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────────┐    │
│  │  TENANT/OWNER    │    │   EMPLOYEE       │    │   CUSTOMER               │    │
│  │  Browser         │    │   Browser        │    │   Browser/Mobile         │    │
│  ├──────────────────┤    ├──────────────────┤    ├──────────────────────────┤    │
│  │ Access:          │    │ Access:          │    │ Access:                  │    │
│  │ • Dashboard      │    │ • POS System     │    │ • Storefront             │    │
│  │ • BrandStudio    │    │ • Inventory      │    │ • Shopping Cart          │    │
│  │ • Reports        │    │ • Order Queue    │    │ • Order Tracking         │    │
│  │ • Settings       │    │ • POS Terminal   │    │ • Customer Account       │    │
│  │                  │    │                  │    │                          │    │
│  │ Roles:           │    │ Roles:           │    │ Role:                    │    │
│  │ • Owner          │    │ • Cashier        │    │ • Shopper                │    │
│  │ • Manager        │    │ • Kitchen Staff  │    │ • Reviewer               │    │
│  │                  │    │ • Delivery       │    │                          │    │
│  │                  │    │ • Manager        │    │                          │    │
│  └────────┬─────────┘    └────────┬─────────┘    └──────────┬───────────────┘    │
│           │                       │                          │                    │
│           │ HTTPS Requests        │ HTTPS Requests           │ HTTPS Requests    │
│           │ Port 443              │ Port 443                 │ Port 443          │
│           │                       │                          │                    │
└───────────┼───────────────────────┼──────────────────────────┼────────────────────┘
            │                       │                          │
            └───────────────────────┼──────────────────────────┘
                                    │
                        ┌──────────────────────────────────────┐
                        │      NETWORK LAYER                   │
                        │ • On-Premise/LAN                     │
                        │ • Cloud (AWS/Azure/GCP)              │
                        │ • Hybrid Deployment                  │
                        │ • Secure Tunneling (VPN)             │
                        └──────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼──────────────────────────────────────────────────┐
│                      APPLICATION SERVER LAYER (Logic)                               │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                    Web Server (Nginx)                                         │  │
│  │  ─────────────────────────────────────────────────────────────────────────  │  │
│  │  • Request Routing & Load Balancing                                         │  │
│  │  • SSL/TLS Termination                                                      │  │
│  │  • Role-Based Access Control                                                │  │
│  │  • CORS & Security Headers                                                  │  │
│  └──────────────────────┬───────────────────────────────────────────────────────┘  │
│                         │                                                          │
│  ┌──────────────────────▼──────────────────────────────────────────────────────┐  │
│  │              Application Layer (Next.js + Node.js)                           │  │
│  │  ─────────────────────────────────────────────────────────────────────────  │  │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │  │
│  │  │   DASHBOARD  │    │     POS      │    │      STOREFRONT              │  │  │
│  │  ├──────────────┤    ├──────────────┤    ├──────────────────────────────┤  │  │
│  │  │ • Orders     │    │ • Checkout   │    │ • Product Catalog            │  │  │
│  │  │ • Products   │    │ • Inventory  │    │ • Shopping Cart              │  │  │
│  │  │ • Customers  │    │ • Payments   │    │ • Checkout Flow              │  │  │
│  │  │ • Inventory  │    │ • Receipt    │    │ • Order Status               │  │  │
│  │  │ • Reports    │    │ • Terminal   │    │ • Customer Profile           │  │  │
│  │  │ • Analytics  │    │ • Queue View │    │ • Reviews                    │  │  │
│  │  │ • Employees  │    │             │    │ • Notifications              │  │  │
│  │  │ • Settings   │    │             │    │                              │  │  │
│  │  └──────────────┘    └──────────────┘    └──────────────────────────────┘  │  │
│  │                                                                              │  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │  │
│  │  │             BrandStudio (Design Canvas - Owner Only)                 │  │  │
│  │  │  • Drag-and-drop page builder                                       │  │  │
│  │  │  • Template components                                              │  │  │
│  │  │  • Branding & customization                                         │  │  │
│  │  │  • Real-time preview                                                │  │  │
│  │  │  • Publish to storefront                                            │  │  │
│  │  └──────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                              │  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │  │
│  │  │         REST API Endpoints (/api/*) & Authentication                │  │  │
│  │  │  • NextAuth.js (JWT + Session Management)                           │  │  │
│  │  │  • Request Validation & Sanitization                                │  │  │
│  │  │  • Role-Based Authorization                                         │  │  │
│  │  │  • Data Filtering & Transformation                                  │  │  │
│  │  │  • Business Logic Execution                                         │  │  │
│  │  └──────────────┬──────────────────────────────────────────────────────┘  │  │
│  └─────────────────┼────────────────────────────────────────────────────────────┘  │
│                    │                                                              │
│  ┌─────────────────▼──────────────────────────────────────────────────────────┐  │
│  │              Data Access Layer (Prisma ORM)                               │  │
│  │  ────────────────────────────────────────────────────────────────────────  │  │
│  │  • Type-Safe Database Queries                                            │  │
│  │  • Connection Pooling (PgBouncer)                                        │  │
│  │  • Multi-Tenant Data Isolation (tenantId filtering)                      │  │
│  │  • Row-Level Security (Role-based filtering)                             │  │
│  │  • Transaction Management & ACID Compliance                              │  │
│  └─────────────────┬──────────────────────────────────────────────────────────┘  │
│                    │                                                              │
└────────────────────┼──────────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼──────────────────────────────────────────────────────────────┐
│                      DATA STORAGE LAYER (Persistence)                             │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│                    PostgreSQL Database                                            │
│  ──────────────────────────────────────────────────────────────────────────────  │
│                                                                                    │
│  Subsystem 1: Authentication & Multi-Tenancy (8 tables)                           │
│  ├─ users, tenants, tenant_users, employees, customers                           │
│  ├─ activity_log, notifications, otp                                             │
│  └─ Complete multi-user & multi-tenant data isolation via tenantId               │
│                                                                                    │
│  Subsystem 2: Products & Catalog (7 tables)                                       │
│  ├─ categories, products, product_variants, ingredients                          │
│  └─ product_ingredients, variant_ingredients                                     │
│                                                                                    │
│  Subsystem 3: Orders & Sales (8 tables)                                           │
│  ├─ orders, order_items, order_status_history, media                             │
│  └─ payment_status tracking                                                      │
│                                                                                    │
│  Subsystem 4: Inventory (1 table)                                                 │
│  ├─ inventory_transactions (stock movements & tracking)                           │
│  └─                                                                               │
│                                                                                    │
│  Subsystem 5: Employees & POS (2 tables)                                          │
│  ├─ employees (role-based access, performance tracking)                           │
│  └─ pos_sessions (transaction history & accountability)                           │
│                                                                                    │
│  Subsystem 6: Storefront & Design (11 tables)                                     │
│  ├─ pages, page_revisions, page_designs, page_components                         │
│  ├─ seo_settings, storefront_settings, projects, canvas                          │
│  └─ design_revisions, page_design_revisions                                      │
│                                                                                    │
│  Subsystem 7: Billing & Subscriptions (8 tables)                                  │
│  ├─ plans, subscriptions, invoices, payments                                     │
│  ├─ usage_records, billing_preferences, plan_upgrade_requests                    │
│  └─ admin_settings (system configuration)                                        │
│                                                                                    │
│  Features:                                                                        │
│  ✓ ACID Compliance (Atomicity, Consistency, Isolation, Durability)               │
│  ✓ Referential Integrity & Constraints                                           │
│  ✓ Automated Daily Backups                                                       │
│  ✓ Point-in-Time Recovery Available                                              │
│  ✓ User Access Audit Trail (ActivityLog)                                         │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Points: Three User Types

╔════════════════════════════════════════════════════════════════════════════════╗
║ 1. TENANT (Business Owner/Manager)                                             ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ Owns and operates the business                                                 ║
║ ├─ Accesses: Dashboard for management, design, and reporting                   ║
║ ├─ Control: Full control of business operations (products, prices, staff)      ║
║ ├─ Billing: Manages subscriptions and billing                                  ║
║ ├─ Customization: Uses BrandStudio to design storefront                        ║
║ └─ Visibility: Sees all their business data across all departments             ║
╚════════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════════╗
║ 2. EMPLOYEE (Staff Member)                                                     ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ Works for the tenant's business with role-based responsibilities               ║
║ ├─ Accesses: POS System for order processing and inventory updates             ║
║ ├─ Roles:                                                                       ║
║ │  ├─ Cashier: Process checkout, payments, receipts                            ║
║ │  ├─ Kitchen Staff: View orders, prepare items, update status                 ║
║ │  ├─ Delivery Staff: View orders to ship, mark delivered                      ║
║ │  └─ Manager: Oversee operations, view POS sessions                           ║
║ ├─ Restrictions: Cannot modify prices or manage other employees                ║
║ └─ Accountability: All actions logged in ActivityLog                           ║
╚════════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════════╗
║ 3. CUSTOMER (Shopper/End User)                                                 ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ End user who purchases products and services                                    ║
║ ├─ Accesses: Storefront to browse and buy                                      ║
║ ├─ Actions: View products, add to cart, checkout, track orders                 ║
║ ├─ Profile: Customer account with order history and addresses                  ║
║ ├─ Visibility: Sees only publicly available products and their own orders      ║
║ └─ Restrictions: No access to POS, Dashboard, or backend systems               ║
╚════════════════════════════════════════════════════════════════════════════════╝

**Multi-User Data Isolation Strategy:**
- Same database, complete separation via roles and `tenantId`
- Tenant (Owner): Sees all their business data
- Employee (Staff): Sees only role-relevant data with role-based filters
- Customer (Shopper): Sees only their own orders and public product information
- All access and modifications logged in ActivityLog for complete audit trail

---

## System Components

╔════════════════════════════════════════════════════════════════════════════════╗
║ LAYER 1: CLIENT LAYER (Presentation)                                          ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ What: Web browsers on staff and customer computers                             ║
║ Technologies:                                                                  ║
║   • HTML5 + CSS3 (Tailwind CSS for responsive design)                          ║
║   • React 18 (interactive UI components)                                       ║
║   • Next.js 15 (page routing and server-side rendering)                        ║
║   • Konva Canvas (visual design tool graphics)                                 ║
║                                                                                ║
║ Components by User Type:                                                       ║
║   • Dashboard: Owner/Manager interface for business management                 ║
║   • POS Interface: Employee checkout and order management                      ║
║   • Storefront: Customer-facing shopping experience                            ║
║   • BrandStudio: Drag-and-drop page design tool (Owner only)                   ║
║                                                                                ║
║ Access Methods:                                                                ║
║   • URL: http://server-ip or http://bizcore.local                              ║
║   • No installation required                                                   ║
║   • Works on any modern browser                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════════╗
║ LAYER 2: APPLICATION SERVER (Logic)                                           ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ What: Central server running all business logic                                ║
║ Technologies:                                                                  ║
║   • Node.js 18+ (JavaScript runtime)                                           ║
║   • Next.js 15 (web framework with App Router)                                 ║
║   • Express.js (API routes and middleware)                                     ║
║   • NextAuth.js (authentication and session management)                        ║
║                                                                                ║
║ Responsibilities:                                                              ║
║   • Process user requests from all three user types                            ║
║   • Execute business logic (orders, inventory, billing)                        ║
║   • Validate and sanitize all input data                                       ║
║   • Manage user sessions and authentication                                    ║
║   • Route requests to appropriate database                                     ║
║   • Format and return responses                                                ║
║                                                                                ║
║ Services Running:                                                              ║
║   • Web Server (Nginx): Request routing, SSL/TLS, load balancing              ║
║   • Main App (Port 3000): Dashboard, POS, Storefront pages                    ║
║   • BrandStudio (Port 5174): Design canvas application                         ║
║   • API Routes (/api/*): RESTful endpoints for data operations                 ║
╚════════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════════╗
║ LAYER 3: DATA STORAGE (Persistence)                                           ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ What: PostgreSQL database storing all system data                              ║
║ Technologies:                                                                  ║
║   • PostgreSQL 12+ (relational database)                                       ║
║   • Prisma ORM (type-safe database access)                                     ║
║   • PgBouncer (connection pooling)                                             ║
║                                                                                ║
║ Data Organization (38 Tables across 7 Subsystems):                             ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │ Subsystem 1: Auth & Multi-Tenancy (8 tables)                        │    ║
║   │ • users, tenants, tenant_users, employees, customers               │    ║
║   │ • activity_log, notifications, otp                                 │    ║
║   ├─────────────────────────────────────────────────────────────────────┤    ║
║   │ Subsystem 2: Products & Catalog (7 tables)                          │    ║
║   │ • categories, products, product_variants, ingredients              │    ║
║   │ • product_ingredients, variant_ingredients                         │    ║
║   ├─────────────────────────────────────────────────────────────────────┤    ║
║   │ Subsystem 3: Orders & Transactions (8 tables)                       │    ║
║   │ • orders, order_items, order_status_history, media                 │    ║
║   ├─────────────────────────────────────────────────────────────────────┤    ║
║   │ Subsystem 4: Inventory (1 table)                                    │    ║
║   │ • inventory_transactions                                            │    ║
║   ├─────────────────────────────────────────────────────────────────────┤    ║
║   │ Subsystem 5: Employees & POS (2 tables)                             │    ║
║   │ • employees, pos_sessions                                          │    ║
║   ├─────────────────────────────────────────────────────────────────────┤    ║
║   │ Subsystem 6: Storefront & Design (11 tables)                        │    ║
║   │ • pages, page_revisions, page_designs, page_components             │    ║
║   │ • seo_settings, storefront_settings, projects, canvas              │    ║
║   ├─────────────────────────────────────────────────────────────────────┤    ║
║   │ Subsystem 7: Billing & Subscriptions (8 tables)                     │    ║
║   │ • plans, subscriptions, invoices, payments                         │    ║
║   │ • usage_records, billing_preferences, plan_upgrade_requests        │    ║
║   └─────────────────────────────────────────────────────────────────────┘    ║
║                                                                                ║
║ Key Features:                                                                  ║
║   • Multi-tenant isolation via tenantId on all business tables                 ║
║   • ACID compliance (Atomicity, Consistency, Isolation, Durability)            ║
║   • Automatic daily backups to external storage                                ║
║   • Point-in-time recovery capability (30-day retention)                       ║
║   • User access audit trail via ActivityLog                                    ║
║   • Referential integrity and constraint enforcement                           ║
╚════════════════════════════════════════════════════════════════════════════════╝

---

## Cloud Deployment Model

BizCore is a cloud-native SaaS platform designed to be deployed and operated on cloud infrastructure (AWS, Azure, Google Cloud Platform). The system is hosted on distributed cloud servers and accessed globally via the internet, enabling organizations with multiple locations or distributed teams to access the Dashboard, POS System, and Storefront from anywhere in the world. All client devices—including owner/manager browsers, employee POS terminals, and customer devices—connect to the centralized cloud servers via HTTPS (Port 443), ensuring secure encrypted communication across the internet. This cloud architecture eliminates the need for organizations to manage their own infrastructure, as automatic scaling, backup, disaster recovery, and security patching are all handled by the cloud provider. By deploying BizCore on cloud infrastructure, the system guarantees enterprise-grade reliability, automatic performance optimization, real-time data synchronization across all users, and complete multi-tenant data isolation (via `tenantId`) while maintaining the flexibility to grow from single-location operations to multi-tenant SaaS platforms serving hundreds of organizations. All transactions, updates, and user activities are logged in real-time through the ActivityLog, providing complete audit trails and accountability while supporting 100+ concurrent users, 10,000+ orders per day, and multiple independent tenant organizations with complete data privacy and security.

### Key Cloud Benefits
- **Global Accessibility**: Access from anywhere with internet connection
- **Auto-Scaling**: Automatic resource scaling based on demand
- **Managed Backups**: Daily automated backups with disaster recovery
- **No Infrastructure Management**: Cloud provider handles all maintenance
- **HTTPS/TLS Encryption**: All data in transit encrypted (Port 443)
- **Multi-Tenant Isolation**: Complete data separation via `tenantId`
- **Real-Time Updates**: Instant synchronization across all users and locations
- **High Availability**: Redundant servers and data centers

---

## Request Flow Example: Create an Order

```
1. Staff opens POS on browser → http://server-ip:3000/pos
2. Staff logs in with credentials
3. NextAuth validates user (checks users table)
4. Session created, cookie stored in browser
5. Staff enters order details and clicks "Save"
6. Browser sends POST request to /api/orders
7. Request includes session cookie
8. Nginx routes to Next.js application
9. Next.js API handler validates authentication
10. Handler checks user's tenant permissions
11. Handler validates order data (line items, customer, etc.)
12. Prisma ORM builds INSERT query with tenantId
13. PostgreSQL executes INSERT and returns new order ID
14. ActivityLog records the order creation action
15. Response sent back to browser: { id, orderNumber, total, status }
16. Browser updates POS screen with new order details
```

---

## User Authentication & Multi-Tenancy

### Authentication Flow
```
User Login
    ↓
Browser POST to /auth/signin with email + password
    ↓
NextAuth validates credentials against users table
    ↓
Password verified with bcrypt
    ↓
Check if user is member of requesting tenant (tenant_users table)
    ↓
JWT token generated
    ↓
HttpOnly session cookie created
    ↓
User redirected to /dashboard/{tenantId}
    ↓
All subsequent requests include session cookie
    ↓
Session verified before each API call
```

### Multi-Tenant Data Isolation
```
User makes API request
    ↓
Session verified → userId determined
    ↓
resolveTenant() looks up user's tenant membership
    ↓
tenantId extracted from session
    ↓
All database queries automatically filtered:
   WHERE tenantId = {userTenantId}
    ↓
User sees ONLY their tenant's data
    ↓
Cross-tenant access returns 404 (as if data doesn't exist)
```

---

## Technology Stack Summary

| Component | Technology | Purpose |
|---|---|---|
| **Client OS** | Windows/Mac/Linux | Staff/Customer computers |
| **Browser** | Chrome/Firefox/Safari/Edge | Web application access |
| **Web Server** | Nginx | Request routing, SSL/TLS |
| **Runtime** | Node.js 18+ | JavaScript execution |
| **Framework** | Next.js 15 | Web application framework |
| **Frontend** | React 18 | User interface components |
| **Styling** | Tailwind CSS | Responsive design |
| **Canvas** | Konva | Design tool graphics |
| **Auth** | NextAuth.js + JWT | User authentication |
| **ORM** | Prisma | Database access layer |
| **Database** | PostgreSQL 12+ | Data persistence |
| **Pooling** | PgBouncer | Connection management |

---

## Deployment Architecture

### Single Server (Small Organizations)
```
One Physical/Virtual Server running:
├── Nginx Web Server
├── Next.js Application (Port 3000)
├── BrandStudio Application (Port 5174)
└── PostgreSQL Database

Client PCs connect via LAN to: http://server-ip
```

### Multi-Server (Medium Organizations)
```
Load Balancer
    ├── Application Server 1 (Nginx + Next.js)
    ├── Application Server 2 (Nginx + Next.js)
    └── Application Server 3 (Nginx + Next.js)
            ↓
        PostgreSQL Database Server
            ↓
        Backup Database (Optional)
```

### High Availability (Large Organizations)
```
Load Balancer
    ├── App Server Cluster (3+ servers with auto-failover)
    ├── Primary Database
    ├── Standby Database (Real-time replication)
    └── Automated Backups
```

---

## Data Backup & Recovery

**Backup Strategy:**
- Daily automated PostgreSQL dumps
- Backups stored on external storage
- Retention: 30 days minimum
- Point-in-time recovery available

**Recovery Time:**
- Single record restore: 5-10 minutes
- Full database restore: 30-60 minutes
- System outage recovery: 1-2 hours

---

## Security

### Network Security
- LAN isolation (traffic doesn't leave institution)
- Optional: Firewall rules to restrict access
- HTTPS/TLS for all communications

### Application Security  
- User authentication required for all actions
- Role-based access control (owner, admin, editor, viewer)
- Input validation on all forms
- SQL injection protection (Prisma ORM)
- CSRF token protection
- Rate limiting on login attempts

### Data Security
- All passwords hashed with bcrypt
- Sensitive data (payments) logged securely
- Audit trail of all user actions (ActivityLog)
- Regular security updates applied

---

## Performance Characteristics

| Operation | Typical Time |
|---|---|
| Page load | < 2 seconds |
| Create order | < 1 second |
| Search products | < 500ms |
| Generate report | 2-5 seconds |
| Database backup | 10-30 minutes |

---

## Scalability

**Can handle:**
- 100+ concurrent users
- 10,000+ orders per day
- 1,000+ products
- 5+ tenant organizations

**Scaling options:**
- Add more application servers (behind load balancer)
- Upgrade database server (more CPU/RAM)
- Add read-only database replicas
- Archive old data to reduce database size

---

## Business Owner/Tenant Perspective

### What is a Tenant?
A **Tenant** is an independent business (shop owner, restaurant, café) that uses BizCore to run their operations. Each tenant:
- Has their own unique URL: `https://yourshop.bizcore.app`
- Has completely isolated data (products, customers, orders, employees)
- Cannot see other businesses' data
- Manages their own subscription and billing
- Can invite staff members with different roles
- Customizes their storefront with drag-and-drop design

### Tenant's Main Features

**Dashboard** - Business command center
- Daily/weekly sales overview
- Recent orders and activities
- Low stock alerts
- Quick action buttons
- Employee activity log

**POS (Point of Sale)** - In-store checkout
- Quick product search
- Shopping cart management
- Payment processing
- Receipt printing
- Automatic inventory updates

**Storefront** - Online shop
- Browse products by category
- Shopping cart
- Checkout and payment
- Order tracking
- Customer reviews

**BrandStudio** - Design tool
- Drag-and-drop page builder
- No coding required
- Customize colors and branding
- Add products and images
- Preview on desktop/mobile
- Publish changes instantly

**Order Management** - Track all sales
- View all orders
- Update status (pending → confirmed → shipped → delivered)
- Customer information
- Order history and refunds

**Inventory Management** - Stock tracking
- Current stock levels
- Low stock alerts
- Ingredient cost tracking
- Stock movements (purchases, usage, waste)
- Reorder management

**Employee Management** - Team control
- Add/remove staff
- Set roles (manager, cashier, kitchen staff, delivery)
- View POS sessions
- Track sales per employee
- Permission control

**Reports & Analytics** - Business insights
- Sales reports (daily/weekly/monthly)
- Customer analytics
- Inventory reports
- Employee performance
- Financial summaries
- Profit margins and costs

**Settings** - Business configuration
- Store name and branding
- Contact information
- Payment methods
- Tax rates
- Notifications
- User preferences

### Typical Tenant Workflow

```
Business Owner's Day:

9:00 AM - Open Dashboard
  ├── Check yesterday's sales ($1,250)
  ├── See 3 new orders overnight
  └── Low stock alert: Coffee beans need reordering

10:00 AM - Employee Arrives
  ├── Employee logs into POS
  ├── First customer arrives
  └── Employee scans products, processes payment

12:00 PM - Lunch Rush
  ├── Multiple orders processing
  ├── Orders auto-reduce inventory
  └── Staff can see queue of pending orders

3:00 PM - Mid-Day Check
  ├── Review current sales: $480
  ├── Check employee performance
  └── Verify stock levels holding up

5:00 PM - End of Day
  ├── Close POS terminal
  ├── Review sales: $1,850 total
  ├── 42 orders processed
  └── 2 low stock items need ordering tomorrow

6:00 PM - Financial Review
  ├── Generate daily report
  ├── Compare to last week
  ├── Identify best-selling products
  └── Plan next day's inventory
```

### Tenant's Data Isolation

```
Tenant A (Coffee Shop)           Tenant B (Bakery)
├── Products:                    ├── Products:
│   ├── Cappuccino              │   ├── Croissant
│   ├── Latte                   │   └── Sourdough Bread
│   └── Espresso                │
├── Customers:                  ├── Customers:
│   ├── John (regular)          │   ├── Maria (regular)
│   └── Sarah                   │   └── David
├── Orders:                     ├── Orders:
│   └── 150 orders this month   │   └── 280 orders this month
└── Employees:                  └── Employees:
    ├── Barista - Maria              ├── Baker - Anna
    └── Cashier - Juan               └── Cashier - Carlos

🔒 Data NEVER shared between tenants
🔒 Each tenant sees ONLY their own data
🔒 Complete privacy and security
```

### Tenant Subscription & Billing

**Pricing Plans:**
```
Starter Plan ($29/month)
├── Up to 50 products
├── 1 employee
├── Basic reports
└── Email support

Professional Plan ($79/month)
├── Unlimited products
├── 5 employees
├── Advanced reports
├── Priority support
└── Custom domain option

Enterprise Plan (Custom pricing)
├── Unlimited everything
├── Dedicated support
├── API access
├── Custom integrations
└── Multiple locations
```

**Billing Management:**
- Dashboard → Settings → Billing
- View current plan and price
- See next billing date
- Download invoices
- Upgrade/downgrade plans
- Cancel anytime

### Tenant User Roles

**Owner** - Full control
- Manage everything
- Add/remove staff
- Change billing

**Manager** - Day-to-day operations
- Manage orders
- Manage inventory
- Manage staff
- View reports
- Cannot change billing

**Cashier** - POS operations
- Process orders
- Process payments
- View own POS sessions
- Cannot delete orders

**Kitchen Staff** - Order fulfillment
- View pending orders
- Update order status
- Cannot process payments

**Delivery Staff** - Order delivery
- View orders to ship
- Mark as delivered
- Cannot modify orders

---

## Request Flow for Tenant Operations

### Example: Tenant Creates an Order

```
1. Tenant opens POS: http://yourshop.bizcore.app/pos
2. Tenant logs in
3. NextAuth validates credentials
4. Session cookie created with tenantId
5. Tenant searches for product: "Cappuccino"
6. Product found (belongs to their tenant)
7. Tenant adds 3x medium cappuccino to cart
8. Tenant selects customer: "John Smith"
9. Tenant clicks "Complete Order"
10. Browser POST to /api/orders with data:
    {
      "tenantId": "123",
      "customerId": "456",
      "items": [
        { "productId": "789", "quantity": 3, "price": 4.50 }
      ],
      "total": 13.50
    }
11. API validates:
    - User authenticated ✓
    - User belongs to tenantId 123 ✓
    - Customer belongs to tenantId 123 ✓
    - Product belongs to tenantId 123 ✓
12. Prisma creates order with WHERE tenantId = 123
13. Order saved to database
14. InventoryTransaction records ingredient usage:
    - Espresso: -3 shots
    - Milk: -15 oz
    - Foam: -3 oz
15. ActivityLog records: "User created order #1001"
16. Response sent back: { id, orderNumber, status, total }
17. POS updates with new order
18. Tenant sees order in dashboard
```

### Example: Tenant Designs Storefront

```
1. Tenant opens BrandStudio: http://yourshop.bizcore.app/studio
2. Loads design canvas
3. Tenant drags "Hero Section" component to page
4. Tenant uploads business logo image
5. Tenant changes header color to brand color
6. Tenant adds product gallery section
7. Tenant selects which products to display (auto-filtered to their products)
8. Tenant previews on mobile device
9. Tenant clicks "Publish"
10. Changes sent to API: /api/pages/{pageId}/design/publish
11. Database updates PageDesign record
12. Storefront immediately reflects changes
13. Tenant's customers see new design when they visit
```

---

## Software Specification & Development Stack

BizCore is built on modern, scalable web technologies designed to deliver a robust multi-tenant SaaS platform accessible globally via the cloud. The backend is powered by **Node.js 18+** with **Next.js 15** and the App Router, providing a secure, efficient environment for handling multi-tenant data isolation, complex business logic, and real-time API processing. The system is containerized using **Docker** and deployed on cloud infrastructure (AWS, Azure, or Google Cloud Platform) with **Nginx** serving as the reverse proxy for request routing, SSL/TLS termination, and load balancing. 

For the frontend, BizCore leverages **React 18** for dynamic, interactive user interfaces, **Tailwind CSS** for responsive design across all devices, and **Konva Canvas** for the drag-and-drop visual page design tool (BrandStudio). **Next.js 15** provides server-side rendering, automatic API route generation, and optimized page performance for both the main application and storefront experiences.

Authentication and session management are handled by **NextAuth.js** with JWT (JSON Web Tokens), enabling secure user sessions with role-based access control (Tenant, Employee, Customer) across the entire platform. The system uses **PostgreSQL 12+** as the relational database management system, securely storing all multi-tenant data with complete row-level isolation via `tenantId` filtering. **Prisma ORM** provides type-safe database queries, automatic schema generation, and connection pooling through **PgBouncer** to optimize performance under high concurrent load.

For enhanced communication and notifications, BizCore integrates **Nodemailer** to deliver transactional emails such as order confirmations, password resets, and account notifications. Real-time features and API communication are powered by REST endpoints built into Next.js, with support for WebSocket upgrades for live updates across multiple users and locations.

For development and collaboration, BizCore uses **Git** and **GitHub** for version control, enabling distributed team development, code review workflows, and continuous integration. The development environment supports hot-reload during local development, automated testing with Jest and React Testing Library, and seamless Docker-based deployment pipelines that ensure consistency between development, staging, and production environments.

The system is designed as a cloud-native SaaS platform, making it accessible from anywhere via modern web browsers—including Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari—without requiring any on-premise infrastructure or software installation on client devices.

---

## Hardware Specification

The hardware requirements of BizCore are designed to support reliable performance in a cloud-based SaaS environment. On the server side, the system requires cloud infrastructure with at least 2-4 CPU cores, 4 GB of RAM, and 50+ GB of SSD storage per container to ensure efficient handling of multi-tenant operations, order processing, and data storage. For optimal performance, especially in handling concurrent users, higher specifications such as 8 GB RAM or more are recommended, along with additional application servers behind a load balancer and a dedicated database server with 16+ GB RAM. The client side, which includes the devices used by business owners, employees, and customers, only requires a laptop or desktop computer with at least a dual-core processor, 2 GB of RAM, and a modern web browser for accessing the system. A stable internet connection is also necessary to allow smooth communication between client devices and the cloud servers. These hardware specifications ensure that the system remains efficient, reliable, and practical for use in the daily operations of BizCore across multiple business locations and time zones.

---

## Programming Environment

**Front End**

The frontend of BizCore was developed using a combination of modern web technologies. **React 18** serves as the core framework for building dynamic, interactive user interfaces with reusable components. **Tailwind CSS** was used to design a responsive and clean user interface that adapts seamlessly across desktop, tablet, and mobile devices. **Next.js 15** with the App Router provides server-side rendering, static generation, and optimized page performance, enabling fast load times and improved SEO. **Konva Canvas** is integrated into BrandStudio to provide a powerful drag-and-drop visual page design tool, allowing business owners to create custom storefronts without coding. The combination of these technologies enables rapid frontend development while maintaining clean, maintainable, and performant code across the Dashboard, POS System, Storefront, and BrandStudio applications.

**Back End**

For the backend, the system was built using **Node.js 18+** with **Next.js 15** and the App Router framework. Next.js was chosen because of its powerful features for authentication via NextAuth.js, automatic API route generation, built-in middleware support, and seamless integration with React on the frontend. It provided a structured foundation that allowed developers to implement complex multi-tenant logic, order processing, inventory management, and billing features efficiently while maintaining clean and maintainable code. **Prisma ORM** is used for all database operations, providing type-safe queries and automatic schema generation, which enhances developer productivity and reduces bugs.

**Database**

The system uses **PostgreSQL 12+** as its relational database management system. PostgreSQL was selected for its reliability, scalability, ACID compliance, and robust support for complex queries essential in multi-tenant systems. It securely stores tenant data, product information, order details, customer accounts, inventory records, employee information, and billing data. **Prisma ORM** serves as the data access layer, providing type-safe database queries, connection pooling through **PgBouncer**, and automatic schema migrations. PostgreSQL's advanced features support efficient querying and complex filtering operations, which is essential for generating reports, detecting inventory issues, and maintaining complete data isolation between tenants via `tenantId` filtering.

**Server**

BizCore runs on containerized infrastructure using **Docker** and **Nginx** as the reverse proxy. The system is deployed on cloud infrastructure (AWS, Azure, Google Cloud Platform), allowing automatic scaling, global accessibility, and managed backups. **Nginx** handles request routing, SSL/TLS termination, and load balancing across multiple application instances. The containerized Docker-based approach ensures consistency between development, staging, and production environments while enabling rapid deployment and horizontal scaling. Each container runs the Node.js application with Next.js, handling API requests, rendering pages, and managing user sessions in parallel, allowing the system to support 100+ concurrent users and 10,000+ orders per day.

**IDE and Tools**

The development process was carried out using **Visual Studio Code** as the primary integrated development environment (IDE), which provides intelligent code completion, built-in Git integration, debugging capabilities, and excellent extensions for React, Next.js, and TypeScript development. Version control was managed with **Git and GitHub**, which allowed the team to track changes, collaborate efficiently, maintain a clean development workflow, and implement continuous integration practices. **Docker** is used for local development and deployment, ensuring all developers work in identical environments. **Jest** and **React Testing Library** are used for automated unit and integration testing, ensuring code quality and preventing regressions. **npm** (Node Package Manager) manages project dependencies and build scripts, providing a streamlined development workflow from local coding to production deployment.

---

## Deployment

The deployment architecture of BizCore illustrates how the system is deployed as a cloud-native SaaS platform. It consists of the following key components:

### Deployment Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│           BIZCORE CLOUD DEPLOYMENT - Cloud-Native SaaS Platform                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

CLIENT LAYER
├─ 🏢 Business Owner/Tenant (Dashboard + BrandStudio)
├─ 👨‍💼 Employees (POS System)
├─ 🛒 Customers (Storefront)
└─ ⚙️  System Admin (Admin Dashboard)
            │
            │ HTTPS Port 443 (Encrypted)
            ▼

INTERNET (Public Connection)
    Secure HTTPS / TLS 1.3
            │
            ▼

CLOUD INFRASTRUCTURE (AWS/Azure/GCP)

    ┌─────────────────────────────────┐
    │ ☁️  LOAD BALANCER (Nginx)       │
    ├─────────────────────────────────┤
    │ • HTTPS/TLS Termination         │
    │ • Request Routing & Distribution │
    │ • Security Headers & Rate Limit  │
    └──────────────┬──────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │Container│ │Container│ │Container│
    │   1     │ │   2     │ │   3     │
    ├────────┤ ├────────┤ ├────────┤
    │Next.js  │ │Next.js  │ │Next.js  │
    │Node.js  │ │Node.js  │ │Node.js  │
    │Port 3000│ │Port 3000│ │Port 3000│
    └────────┘ └────────┘ └────────┘
        │          │          │
        └──────────┼──────────┘
                   │
        Multi-Tenant Isolation (tenantId filtering)
                   │
        ┌──────────┴──────────┐
        ▼                     │
    ┌──────────────┐          │
    │ 🗄️  DATABASE │          │
    ├──────────────┤          │
    │PostgreSQL 15 │  (Optional: Standby DB with
    │PgBouncer     │   Real-time Replication &
    │Pooling       │   Auto-Failover for HA)
    │Connection:   │          │
    │Port 5432     │◄─────────┘
    │Multi-Tenant  │
    │Isolation     │
    └──────┬───────┘
           │
           │ Daily Backups
           │
           ▼
    ┌──────────────────────┐
    │ ☁️  CLOUD STORAGE    │
    ├──────────────────────┤
    │ • Backup Storage     │
    │ • Media Storage      │
    │ • CDN & Static Files │
    │ • Geo-Redundancy     │
    └──────────────────────┘

DATA FLOW:
1. User opens browser → https://yourbusiness.bizcore.app
2. HTTPS request → Load Balancer (Port 443)
3. Load Balancer → Routes to available Docker Container
4. Container → Authenticates via NextAuth.js (JWT)
5. Container → Resolves user's tenant (resolveTenant)
6. Container → Queries DB: WHERE tenantId = {userTenantId}
7. PostgreSQL → Returns filtered data (via PgBouncer pool)
8. Container → Renders response (Dashboard/POS/Storefront)
9. Load Balancer → Sends response to client browser
10. Browser → Displays interface in real-time

CURRENT IMPLEMENTATION:
✓ Load Balancer (Nginx) distributes traffic across containers
✓ Single PostgreSQL 15 database with connection pooling (PgBouncer)
✓ Daily automated backups (30-day retention)
✓ Point-in-time recovery available
✓ Multi-tenant data isolation via tenantId filtering

OPTIONAL PRODUCTION ENHANCEMENTS:
✓ Primary/Standby DB replication (real-time data sync)
✓ Auto-failover (< 1 minute downtime if primary fails)
✓ Additional application containers for horizontal scaling
✓ Read replicas for reporting queries

AUTO-SCALING:
✓ Peak hours → Additional containers spin up
✓ Low traffic → Containers scale down (cost optimization)
✓ Load Balancer → Distributes requests evenly
✓ Connection pooling → Manages database connections efficiently
```



**1. Client Devices (Web Browsers)**

These are end-user devices such as laptops, desktop computers, or mobile devices used by business owners, employees, customers, and platform administrators.

- **Business Owner/Tenant Client**: Allows business owners to access the Dashboard for managing products, customers, employees, and viewing reports. Also provides access to BrandStudio for designing and customizing the storefront.
- **Employee Client**: Allows staff members to access the POS System for processing orders, managing inventory, and updating order status based on their assigned roles (Cashier, Kitchen Staff, Delivery Staff, Manager).
- **Customer Client**: Allows customers to access the Storefront to browse products, add items to cart, and complete purchases with order tracking and account management.
- **System Admin Client**: Allows BizCore platform administrators to access the Admin Dashboard for managing tenants, monitoring system health, managing billing and subscriptions, viewing platform analytics, and handling system-wide configurations. System admins have the highest level of access but cannot access individual tenant data without explicit permission.

All clients communicate with the Cloud Application Server via HTTPS (Port 443) over the internet, with secure encrypted connections regardless of geographic location.

**2. Cloud Load Balancer & Reverse Proxy (Nginx)**

This component sits at the edge of the cloud infrastructure and serves as the entry point for all client requests.

- Handles HTTPS/TLS termination, encrypting all data in transit.
- Distributes incoming requests across multiple application server instances using load balancing algorithms.
- Routes requests to appropriate backend services based on URL paths (Dashboard, POS, Storefront, API endpoints).
- Enforces security headers, CORS policies, and rate limiting to protect against attacks.

**3. Application Server Cluster (Next.js + Node.js in Docker Containers)**

This is the core server infrastructure running the BizCore application.

- Deployed as containerized Docker instances across multiple cloud availability zones for high availability.
- Each container runs the complete Next.js 15 application with Node.js 18+ runtime.
- Handles presentation logic, business logic, API endpoint processing, and user session management via NextAuth.js.
- Automatically scales horizontally: additional instances spin up during traffic spikes and scale down during low traffic.
- Containers are orchestrated by cloud infrastructure (Kubernetes or similar), managing deployment, scaling, and self-healing.

**4. Database Server (PostgreSQL)**

This component stores all persistent data for BizCore.

- Primary PostgreSQL database server with 4+ CPU cores, 8+ GB RAM, and 100+ GB SSD storage for production environments.
- Stores all tenant data including products, customers, orders, employees, inventory, billing information, and system settings.
- Connected directly to the Application Server Cluster via secure database connections.
- Implements complete multi-tenant data isolation via `tenantId` filtering on all business tables.
- Includes automated daily backups with 30-day retention and point-in-time recovery capability.

**5. Standby Database & Replication (Optional for High Availability)**

For production deployments handling 100+ concurrent users:

- Standby PostgreSQL instance running in a different availability zone for disaster recovery.
- Real-time replication of all data changes from primary to standby database.
- Automatic failover mechanism: if primary database fails, the standby automatically promotes to primary.
- Ensures zero data loss and minimal downtime (typically < 1 minute failover).

**6. Cloud Storage & CDN**

- **Backup Storage**: Automated daily PostgreSQL dumps stored on cloud object storage (S3, Azure Blob, etc.) with 30-day minimum retention.
- **Media Storage**: Product images, customer files, and design assets stored on cloud storage for scalability.
- **CDN**: Static assets (CSS, JavaScript, images) distributed through Content Delivery Network for faster global delivery and reduced server load.

**7. Communication Flow**

The deployment operates as follows:

1. **Client Request**: Business owner, employee, or customer opens a browser and navigates to BizCore (e.g., https://yourbusiness.bizcore.app)
2. **HTTPS over Internet**: Browser sends secure HTTPS request (Port 443) through the public internet to the cloud load balancer.
3. **Load Balancer**: Nginx reverse proxy receives the request and terminates TLS encryption, then routes the request to an available application server.
4. **Application Processing**: Next.js server processes the request:
   - Verifies user authentication via NextAuth.js session cookies
   - Identifies user's tenant via `resolveTenant()` function
   - Executes business logic (Dashboard queries, POS operations, Storefront rendering, API endpoints)
5. **Database Query**: Application queries PostgreSQL via Prisma ORM with automatic `tenantId` filtering to retrieve only user's tenant data.
6. **Response**: PostgreSQL returns filtered data, application formats response (HTML page or JSON API response), and sends back to client.
7. **Client Rendering**: Browser receives response and renders Dashboard/POS/Storefront interface in real-time.

**8. Scalability & Auto-Scaling**

BizCore's cloud deployment automatically handles traffic variations:

- **Horizontal Scaling**: During peak business hours (lunch rush, holiday shopping), additional application server instances automatically spin up.
- **Load Distribution**: Nginx distributes load evenly across all available instances.
- **Resource Optimization**: During low traffic, extra instances scale down, reducing cloud costs.
- **Database Scaling**: Read replicas can be added for reporting queries, further improving performance.

**9. Deployment Benefits**

This cloud-native deployment architecture ensures that BizCore:

- **Global Accessibility**: Accessible from anywhere with internet connection (no LAN required).
- **Automatic Scaling**: Handles variable load from 1 to 100+ concurrent users seamlessly.
- **High Availability**: Multi-zone deployment ensures system continues operating even if one zone fails.
- **Security**: HTTPS encryption for all data in transit, automatic security patches, and firewall rules.
- **Managed Infrastructure**: Cloud provider handles servers, networking, backups, and disaster recovery.
- **Cost Efficiency**: Pay only for resources used; unused capacity automatically scaled down.
- **Multi-Tenant Isolation**: Complete data separation between tenants with zero cross-tenant data leakage.
- **Real-Time Updates**: Instant synchronization across all users when orders are placed, inventory changes, or designs are published.

This deployment ensures that BizCore runs efficiently with reliable performance, automatic failover, and seamless scaling to support business owners, employees, and customers globally across different time zones and geographical locations.

✅ **Complete Data Privacy** - Only see your own data
✅ **Easy to Use** - No technical skills needed
✅ **Affordable** - One subscription covers all features
✅ **Scalable** - Grow from 1 to 100+ employees
✅ **Professional** - Customize look and feel
✅ **Integrated** - Dashboard, POS, design, reports all in one place
✅ **Secure** - Multi-tenant isolation, backups, audit trails
✅ **Supported** - Help when you need it

**The system makes it easy for business owners to focus on their business, not on managing multiple tools.**

---

## Testing

The testing phase of BizCore will involve executing various test cases to evaluate the platform's dependability, performance, and functionality. This includes conducting functional testing to ensure all features and modules are operating as intended. Performance testing will be performed to assess the system's response time, scalability, and resource usage under different conditions. Usability testing will focus on the user interface and experience to verify that business owners, employees, and customers find the platform intuitive and simple to use. The testing phase will be crucial in identifying and addressing any bugs, glitches, or usability difficulties before the platform is deployed to production. Furthermore, security testing will be carried out to verify that the platform is secure from unwanted access, data breaches, and maintains complete multi-tenant data isolation with no cross-tenant data leakage.

## Unit Testing

Unit testing will be carried out to examine each individual component or module of the BizCore platform in isolation. This involves testing every unit of code to ensure it performs correctly and satisfies the specified requirements. Unit tests will be designed and executed for different functions, classes, and React components to verify their behavior and validate the accuracy of their outputs. Through unit testing, any defects or errors in the individual units can be identified and corrected early in the development process, which helps improve the overall quality and reliability of the BizCore system. Testing is performed using Jest as the testing framework and React Testing Library for component testing, ensuring that React components behave correctly when users interact with them. Unit tests focus on validating multi-tenant data isolation logic, ensuring that `tenantId` filtering is correctly applied in all database queries, authentication logic, permission checks, and business calculations such as pricing, tax, and inventory deductions.

## Integration Testing

Integration testing will be performed to evaluate the interaction and collaboration between different components of the BizCore platform. This includes testing the integration of front-end and back-end components, as well as the interaction with external systems such as Nodemailer for email notifications and payment processors. The goal is to ensure that all components work together seamlessly and produce the expected results. Integration testing will verify data flow, consistency, and uniformity between different modules of the system, including Dashboard workflows, POS operations, Storefront transactions, and BrandStudio design publishing. Testing will validate complete request cycles from user action through API processing, database operations with Prisma ORM, and response rendering. Critical integration tests will verify multi-tenant data isolation at every level—ensuring that API endpoints return 404 for cross-tenant access attempts, that database queries include proper `tenantId` filtering, and that no data leakage occurs between independent tenant organizations. Any issues or inconsistencies identified during integration testing will be addressed promptly to ensure the overall quality and reliability of the BizCore platform before it proceeds to the next phase of testing.

## System / Alpha Testing

System or alpha testing will be conducted to evaluate the overall functionality, performance, and usability of the entire BizCore platform. This testing phase involves simulating real-world scenarios and user interactions to ensure that the system performs as expected in a production-like environment with realistic data and concurrent users. It will validate that all features and functionalities of BizCore work together correctly and meet the needs of its intended users—business owners, employees, customers, and system administrators. System testing will cover end-to-end processes such as complete order creation workflows (customer browsing → checkout → payment → order confirmation), business owner customization of storefronts using BrandStudio (design → publish → live storefront update), employee POS operations (login → order creation → payment → receipt), and multi-tenant operations verifying that multiple independent businesses operate safely with complete data isolation. System testing will verify that the platform delivers accurate outputs across Dashboard analytics, POS transactions, Storefront product availability, and Inventory tracking. Testing will also evaluate performance characteristics under peak load conditions (100+ concurrent users, 10,000+ orders per day) to ensure system response times remain acceptable. Usability testing will focus on ensuring the Dashboard, POS System, Storefront, and BrandStudio interfaces are intuitive and accessible to their respective user types. Any issues or bugs identified during this phase will be addressed before the platform proceeds to production deployment, ensuring a stable and reliable release that meets all functional and non-functional requirements.


