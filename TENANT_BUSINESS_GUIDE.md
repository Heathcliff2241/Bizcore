# BizCore for Business Owners/Tenants

Complete guide to BizCore from the perspective of a shop owner, restaurant manager, or business tenant. This document describes the features, workflows, and management capabilities available to each independent business using the BizCore multi-tenant platform.

---

## What is BizCore for Business Owners?

BizCore is a complete business management system that enables shop owners and entrepreneurs to:
- **Manage their storefront** with no technical skills required
- **Run POS operations** (point-of-sale for in-store sales)
- **Manage inventory** (products, ingredients, stock levels)
- **Process orders** (online orders, customer management)
- **Track employee** work and POS sessions
- **Monitor financials** (orders, revenue, subscriptions)
- **Customize their store** look and feel with drag-and-drop design

---

## Tenant Model: Complete Business Isolation

### What is a Tenant?
A **Tenant** in BizCore is your independent business account. Each tenant:
- Has their own unique URL: `https://yourshop.bizcore.app`
- Has completely separate data (products, customers, orders)
- Cannot see other businesses' data
- Has their own billing and subscription
- Can invite staff members to manage the store
- Can customize branding and settings

### Your Business Data is Yours Alone
```
Your Business (Tenant A)          Other Business (Tenant B)
├── Products                      ├── Products
├── Customers                     ├── Customers  
├── Orders                        ├── Orders
├── Employees                     ├── Employees
├── Storefront Design             ├── Storefront Design
├── Subscription & Billing        ├── Subscription & Billing
└── Settings & Preferences        └── Settings & Preferences

🔒 Data NEVER shared between tenants
🔒 Each tenant has own database records
🔒 Multi-tenancy ensures security & privacy
```

---

## Core Features for Business Owners

### 1. Dashboard
**Your business command center**

Access at: `https://yourshop.bizcore.app/dashboard`

**What you see:**
- Quick stats (today's sales, orders, customers)
- Recent orders and activities
- Low stock alerts
- Employee activity log
- Subscription status and renewal date
- Quick action buttons

**What you can do:**
- Create new orders
- View reports
- Manage staff
- Update settings
- Design your storefront

### 2. POS (Point of Sale)
**In-store transaction processing**

Access at: `https://yourshop.bizcore.app/pos`

**Use Case:**
Staff rings up customer purchases at physical checkout counter

**Features:**
- Quick product search/barcode scanning
- Add items to cart
- Apply discounts
- Process payments
- Print receipts
- Track each POS session

**Example Flow:**
```
1. Customer brings items to counter
2. Staff opens POS on browser/tablet
3. Staff scans product barcodes or searches by name
4. Items added to cart with quantities
5. System shows subtotal and tax
6. Staff enters payment amount
7. Order saved with status "completed"
8. Receipt prints for customer
9. Inventory updates automatically
10. Order appears in dashboard with timestamp
```

### 3. Storefront Design (BrandStudio)
**Customize your online shop look and feel**

Access at: `https://yourshop.bizcore.app/studio`

**What you can design:**
- Homepage layout
- Product catalog page
- About page
- Contact page
- Custom pages
- Color schemes and branding
- Navigation menus

**How it works:**
```
1. Open BrandStudio design canvas
2. Drag and drop components (text, images, buttons)
3. Arrange layout to your preference
4. Set colors matching your brand
5. Add product galleries
6. Preview on desktop and mobile
7. Click "Publish" to go live
8. Changes appear immediately on your storefront
```

**No coding required** - fully visual design tool

### 4. Product Management
**Manage what you sell**

Access at: `https://yourshop.bizcore.app/dashboard/products`

**For Simple Products (retail):**
- Name, description, price, image
- Category assignment
- Stock quantity
- Active/inactive status

**For Complex Products (restaurants/cafes):**
- Base product with variants (size, flavor, toppings)
- Each variant has different price
- Track ingredients used in each variant
- Ingredient cost tracking

**Example - Coffee Shop:**
```
Product: "Cappuccino"
├── Variant: Small ($3.00)
│   └── Uses: Espresso (2 shots), Milk (8oz), Foam (2oz)
├── Variant: Medium ($4.00)
│   └── Uses: Espresso (3 shots), Milk (10oz), Foam (3oz)
└── Variant: Large ($5.00)
    └── Uses: Espresso (4 shots), Milk (12oz), Foam (4oz)
```

**Bulk Import:**
- Upload CSV file with products
- Update multiple items at once
- Import from suppliers

### 5. Order Management
**Track all sales and customer purchases**

Access at: `https://yourshop.bizcore.app/dashboard/orders`

**Order Information:**
- Order number
- Customer name and contact
- Order date and time
- Items ordered with quantities
- Total amount paid
- Payment status (paid, unpaid, refunded)
- Fulfillment status (pending, processing, shipped, delivered)

**Order Actions:**
- Update order status (pending → confirmed → shipped → delivered)
- Add notes to order
- Apply refunds
- Print invoice or receipt
- Assign to staff member for fulfillment
- Mark as completed

**Order Status Flow:**
```
Pending (just created)
    ↓
Confirmed (approved by staff)
    ↓
Processing (being prepared/packed)
    ↓
Shipped (sent to customer)
    ↓
Delivered (customer received)

Or at any point:
    ↓
Cancelled (if customer requested)
    ↓
Returned (if customer returned items)
```

### 6. Customer Management
**Know your customers**

Access at: `https://yourshop.bizcore.app/dashboard/customers`

**Customer Information:**
- Name, email, phone number
- Shipping address
- Order history (all past purchases)
- Total spent
- First purchase date

**Customer Features:**
- Create customer profile manually
- Auto-create from first order
- Add notes about customer preferences
- Track contact information
- View purchase history
- Send promotions

**Example:**
```
John Smith (Customer)
├── Email: john@example.com
├── Phone: 555-1234
├── Address: 123 Main St, City, State 12345
├── Order History:
│   ├── Order #1001: $45.50 (Jan 1, 2024)
│   ├── Order #1005: $32.20 (Jan 5, 2024)
│   └── Order #1012: $67.80 (Jan 10, 2024)
└── Total Spent: $145.50
```

### 7. Inventory Management
**Track your stock**

Access at: `https://yourshop.bizcore.app/dashboard/inventory`

**Inventory Tracking:**
- Current stock level for each product/ingredient
- Low stock alerts (warn when below reorder level)
- Ingredient costs
- Supplier information
- Transaction history (in/out movements)

**Record Stock Movements:**
- **Purchase**: Buy from supplier (increases stock)
- **Usage**: Consumed in orders (decreases stock)
- **Waste**: Spoiled/damaged items (decreases stock)
- **Adjustment**: Manual correction (increase or decrease)

**Example - Restaurant:**
```
Ingredient: Chicken Breast
├── Current Stock: 45 lbs
├── Unit Cost: $5.00/lb
├── Reorder Level: 20 lbs
├── Supplier: Local Farm
└── Transaction History:
    ├── Jan 10: +50 lbs (Purchase from supplier)
    ├── Jan 11: -8 lbs (Used in orders)
    ├── Jan 12: -3 lbs (Waste - spoiled)
    └── Jan 13: -4 lbs (Used in orders)
```

**Auto-Consumption:**
- When you create an order, ingredients are automatically deducted
- Example: Customer orders Cappuccino → Espresso, milk, foam automatically deducted
- Staff can manually record waste/loss

### 8. Employee Management
**Manage your team**

Access at: `https://yourshop.bizcore.app/dashboard/employees`

**Employee Information:**
- Name, email, phone
- Role (manager, cashier, kitchen_staff, delivery_staff)
- Hire date
- Active/inactive status

**Employee Roles:**
- **Manager**: Full access to orders, inventory, reports, staff management
- **Cashier**: Can process POS sales, create orders, view reports
- **Kitchen Staff**: Can see pending orders to prepare
- **Delivery Staff**: Can mark orders as shipped

**POS Session Tracking:**
- Which employee logged into which POS terminal
- Login and logout times
- Total sales during session
- Transaction count

**Example:**
```
POS Session Log:
Staff: Maria Garcia
Terminal: Counter-1
Login: 9:00 AM
Logout: 5:30 PM
Total Sales: $1,250.00
Transactions: 42 orders
```

### 9. Reporting & Analytics
**Understand your business**

Access at: `https://yourshop.bizcore.app/dashboard/reports`

**Available Reports:**

**Sales Report:**
- Daily/weekly/monthly revenue
- Number of orders
- Average order value
- Best-selling products
- Sales by category
- Trends over time

**Customer Report:**
- New customers this period
- Returning customers
- Customer retention
- Top customers by spend
- Geographic distribution

**Inventory Report:**
- Stock levels
- Low stock items
- Ingredient usage
- Cost of goods sold (COGS)
- Waste tracking

**Employee Report:**
- POS session summary
- Sales per employee
- Orders processed
- Average transaction time

**Financial Report:**
- Revenue vs. costs
- Profit margins
- Payment methods used
- Refunds issued

### 10. Settings & Preferences
**Configure your business**

Access at: `https://yourshop.bizcore.app/dashboard/settings`

**Store Settings:**
- Business name
- Logo and branding
- Contact information
- Address
- Business hours

**Payment Settings:**
- Accepted payment methods
- Currency
- Tax rates
- Shipping settings (if applicable)

**Notification Settings:**
- Email notifications for orders
- Low stock alerts
- Payment reminders
- Report frequency

**User Preferences:**
- Language preference
- Date/time format
- Dashboard customization
- Keyboard shortcuts

---

## Subscription & Billing

### How Billing Works

Your BizCore subscription covers all features you need to run your business:

**Pricing Model:**
```
Plans available:
├── Starter ($X/month)
│   └── For small shops: up to 50 products, 1 employee
├── Professional ($X/month)
│   └── For growing businesses: unlimited products, 5 employees
└── Enterprise (Custom)
    └── For large operations: dedicated support, custom features
```

**Trial Period:**
- Start with a free 30-day trial
- No credit card required
- Full access to all features
- Automatic transition to paid plan

**Billing Cycle:**
- Monthly or annual billing available
- Invoice sent via email before renewal
- Auto-renewal (can be disabled)
- Easy cancellation anytime

**Access to Billing:**
```
Dashboard → Settings → Billing
├── Current plan and price
├── Next billing date
├── Payment method on file
├── Billing history
├── Invoice download
├── Plan upgrade/downgrade
└── Cancel subscription
```

### Plan Comparison

| Feature | Starter | Professional | Enterprise |
|---|---|---|---|
| Products | 50 | Unlimited | Unlimited |
| Employees | 1 | 5 | Unlimited |
| Orders/month | 500 | Unlimited | Unlimited |
| Support | Email | Email + Chat | Dedicated |
| Advanced Reports | ✓ | ✓ | ✓ |
| Custom Domain | | ✓ | ✓ |
| API Access | | | ✓ |

### Upgrading Your Plan

```
Current Plan: Starter ($29/month)
Want More: Professional ($79/month)

Benefits of Upgrade:
✓ 5 employees instead of 1
✓ Unlimited products
✓ Advanced analytics
✓ Priority support

Action: Click "Upgrade Plan"
Cost: $79 - $29 = $50 additional this month
Next Billing: Full $79 charged next month
```

---

## User Roles & Permissions

### Owner (Business Owner)
**Full access to everything**
- Manage all aspects of business
- Add/remove staff
- Configure billing and subscriptions
- View all reports
- Make financial decisions

### Manager
**Team leadership and operations**
- Manage all orders
- Manage inventory
- Manage other staff (except owner)
- View reports
- Cannot change billing or subscription

### Cashier
**Point of sale and order entry**
- Create and process orders via POS
- Process payments
- View own POS sessions
- Cannot modify inventory or other staff
- Cannot delete orders

### Kitchen Staff
**Order fulfillment**
- View pending orders to prepare
- Update order status (confirmed → processing)
- Cannot create orders or process payments
- Cannot view financial data

### Delivery Staff
**Order delivery**
- View orders ready to ship
- Mark orders as shipped
- Cannot create/modify orders
- Limited access to customer info (delivery address only)

---

## Typical Business Workflows

### Workflow 1: Coffee Shop Opening

```
Morning Setup
1. Manager logs into Dashboard at 7:00 AM
2. Reviews yesterday's sales ($487.50)
3. Checks low stock alerts:
   - Coffee Beans: Only 5 lbs (reorder level 10 lbs)
   - Milk: 8 gallons (low but OK)
4. Manually records milk delivery arrived: +10 gallons
5. Checks employee schedule:
   - Maria (Barista) - 7:00 AM to 3:00 PM ✓
   - Juan (Cashier) - 7:00 AM to 3:00 PM ✓
6. Maria starts POS terminal for morning orders
7. Coffee shop opens to customers
```

### Workflow 2: Customer Places Online Order

```
1. Customer visits yourshop.bizcore.app
2. Browses products on storefront
3. Adds 2x Cappuccino (Medium) to cart
4. Enters shipping address
5. Completes payment
6. Email confirmation sent to customer

Back at the Shop:
7. Order appears in Dashboard with status "Pending"
8. Kitchen sees order on their screen
9. Kitchen staff prepares order, marks as "Processing"
10. Order packed and ready
11. Status changed to "Completed" when customer picks up
12. Inventory automatically updated:
    - Espresso: -6 shots
    - Milk: -20 oz
    - Foam: -6 oz
```

### Workflow 3: Weekly Inventory Check

```
Monday 9:00 AM:
1. Manager logs into Inventory section
2. Sees all current stock levels
3. Prints inventory list
4. Manager physically counts items in store
5. Records any discrepancies:
   - Milk shows 8 gallons, but actually has 7.5 gallons
   - Records adjustment: -0.5 gallons (loss)
6. Low stock items identified:
   - Coffee Beans: 3 lbs (order 20 lbs from supplier)
   - Pastries: 2 items (order 30 from bakery)
7. Generates purchase orders
8. Updates inventory as items arrive
```

### Workflow 4: End of Month Financial Review

```
End of Month (Day 31):
1. Owner logs into Reports section
2. Views Monthly Sales Report:
   - Total Revenue: $14,500
   - Orders: 420
   - Average Order Value: $34.50
   - Best Product: Cappuccino (150 sales)
3. Views Inventory Report:
   - Total Ingredient Cost: $4,200
   - Waste: $145 (unexpected losses)
   - Cost of Goods Sold: 30% (good margin)
4. Views Employee Report:
   - Maria: 186 orders, $6,300 in sales
   - Juan: 234 orders, $8,200 in sales
5. Downloads all reports as PDF
6. Analyzes trends:
   - Sales up 5% from last month ✓
   - Waste increased 2% - need to investigate
   - Cappuccinos the most profitable item
7. Makes decisions:
   - Increase cappuccino marketing
   - Train staff on waste reduction
   - Plan inventory more carefully next month
```

### Workflow 5: Seasonal Sale Campaign

```
Preparing for Holiday Sale:
1. Owner decides to create holiday promotion
2. Opens BrandStudio design tool
3. Creates new homepage banner:
   - Large holiday image
   - "30% OFF HOLIDAY SPECIALS" headline
   - Red and green color scheme
4. Adds product spotlight:
   - Holiday gift bundles
   - Limited time pricing
5. Adds countdown timer
6. Previews on desktop and mobile
7. Publishes changes (live immediately)

During Sale Period:
8. Dashboard shows spike in orders
9. Real-time sales tracking
10. Monitor low stock on sale items
11. Staff prepared with inventory near checkout
12. Payment processing smooth

After Sale:
13. Reports show which products sold best
14. Customer list updated with new customers
15. Revenue increased 45% from normal week
16. Decide to repeat sale next year
```

---

## How Tenants Access the System

### Login & Access

```
Step 1: Visit your store URL
  https://yourshop.bizcore.app
  
Step 2: See login page
  [Email] [Password] [Login Button]
  
Step 3: Enter credentials
  Email: owner@shop.com
  Password: ••••••••
  
Step 4: Click Login
  
Step 5: Dashboard loads
  Shows your business data:
  - Today's sales
  - Recent orders
  - Quick actions
  - Navigation menu
```

### Main Menu Navigation

```
Dashboard
├── Overview (quick stats)
├── Orders
│   ├── All Orders
│   ├── Create New Order
│   └── Order History
├── Products
│   ├── Manage Products
│   ├── Categories
│   └── Import Products
├── Customers
│   ├── Customer List
│   └── Customer Details
├── Inventory
│   ├── Stock Levels
│   ├── Low Stock Alerts
│   └── Transactions
├── Employees
│   ├── Staff List
│   ├── POS Sessions
│   └── Permissions
├── Reports
│   ├── Sales Report
│   ├── Inventory Report
│   ├── Employee Report
│   └── Financial Report
├── Design Studio
│   ├── Edit Storefront
│   ├── Pages
│   └── SEO Settings
├── Settings
│   ├── Business Info
│   ├── Payment Methods
│   ├── Notifications
│   └── User Preferences
└── Account
    ├── Profile
    ├── Billing
    └── Logout
```

---

## Benefits for Business Owners

### Time Savings
- Automated order processing
- Auto-inventory updates
- Quick reporting with one click
- No need for external POS system

### Cost Efficiency
- One subscription covers all features
- No separate tools needed (POS, inventory, design, payments)
- Reduce employee training time
- Lower operational overhead

### Better Decision Making
- Real-time sales data
- Customer insights
- Inventory optimization
- Employee performance tracking
- Profitability analysis

### Growth Enablement
- Scale from 1 to 100+ employees
- Handle unlimited products and orders
- Multiple locations (with Enterprise plan)
- API access for integrations (Enterprise)

### Customer Experience
- Professional storefront
- Easy ordering
- Multiple payment options
- Order tracking
- Personalized communication

---

## Support & Help

**How to Get Help:**

1. **In-App Help**
   - Click ? icon in dashboard
   - Video tutorials
   - Knowledge base articles
   - Common questions

2. **Email Support**
   - support@bizcore.app
   - Response within 24 hours
   - Professional plan and above

3. **Live Chat**
   - Monday-Friday 9 AM - 5 PM
   - Professional plan and above
   - Real-time assistance

4. **Community Forum**
   - bizcore.app/community
   - Ask other business owners
   - Share tips and best practices
   - Access to expert articles

---

## Getting Started Checklist

- [ ] Sign up for free trial at bizcore.app
- [ ] Complete business information setup
- [ ] Upload product catalog (or add products manually)
- [ ] Customize storefront with BrandStudio
- [ ] Add staff members and set permissions
- [ ] Configure payment methods
- [ ] Set up inventory tracking
- [ ] Train employees on POS
- [ ] Create first customer
- [ ] Process first order
- [ ] Monitor first week performance
- [ ] Upgrade to paid plan before trial ends

---

## Summary

BizCore empowers business owners to:

✅ **Run the store** - Dashboard for all operations
✅ **Sell products** - POS and online storefront
✅ **Manage inventory** - Real-time stock tracking
✅ **Process orders** - From creation to fulfillment
✅ **Build team** - Employee management and roles
✅ **Track finances** - Revenue, costs, profitability
✅ **Customize look** - Drag-drop storefront design
✅ **Make decisions** - Data-driven reports and analytics

All in one integrated platform. No coding required. Scale as you grow.

**Your business. Your data. Your success.**
