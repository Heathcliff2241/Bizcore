-- Enable Row-Level Security (RLS) on all tenant-scoped tables
-- This provides database-level tenant isolation

-- Create the function to get current tenant ID from session
CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS INTEGER AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS on all tenant-scoped tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for each table

-- Products
CREATE POLICY products_tenant_isolation ON products
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Orders
CREATE POLICY orders_tenant_isolation ON "orders"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Order Items (via order's tenantId)
CREATE POLICY order_items_tenant_isolation ON "order_items"
  USING (
    EXISTS (
      SELECT 1 FROM "orders"
      WHERE "orders"."id" = "order_items"."orderId"
      AND "orders"."tenantId" = get_current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "orders"
      WHERE "orders"."id" = "order_items"."orderId"
      AND "orders"."tenantId" = get_current_tenant_id()
    )
  );

-- Customers
CREATE POLICY customers_tenant_isolation ON "customers"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Categories
CREATE POLICY categories_tenant_isolation ON "categories"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Employees
CREATE POLICY employees_tenant_isolation ON "employees"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Ingredients
CREATE POLICY ingredients_tenant_isolation ON "ingredients"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Inventory Transactions
CREATE POLICY inventory_transactions_tenant_isolation ON "inventory_transactions"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Media
CREATE POLICY media_tenant_isolation ON "media"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Page Designs
CREATE POLICY page_designs_tenant_isolation ON "page_designs"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Page Components (via page_design's tenantId)
CREATE POLICY page_components_tenant_isolation ON "page_components"
  USING (
    EXISTS (
      SELECT 1 FROM "page_designs"
      WHERE "page_designs"."id" = "page_components"."pageDesignId"
      AND "page_designs"."tenantId" = get_current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "page_designs"
      WHERE "page_designs"."id" = "page_components"."pageDesignId"
      AND "page_designs"."tenantId" = get_current_tenant_id()
    )
  );

-- Storefront Settings
CREATE POLICY storefront_settings_tenant_isolation ON "storefront_settings"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- POS Sessions
CREATE POLICY pos_sessions_tenant_isolation ON "pos_sessions"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Product Variants (via product's tenantId)
CREATE POLICY product_variants_tenant_isolation ON "product_variants"
  USING (
    EXISTS (
      SELECT 1 FROM "products"
      WHERE "products"."id" = "product_variants"."productId"
      AND "products"."tenantId" = get_current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "products"
      WHERE "products"."id" = "product_variants"."productId"
      AND "products"."tenantId" = get_current_tenant_id()
    )
  );

-- Activity Log (optional tenantId - allows filtering)
CREATE POLICY activity_log_tenant_isolation ON "activity_log"
  USING ("tenantId" IS NULL OR "tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" IS NULL OR "tenantId" = get_current_tenant_id());

-- Pages (optional tenantId - allows filtering)
CREATE POLICY pages_tenant_isolation ON "pages"
  USING ("tenantId" IS NULL OR "tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" IS NULL OR "tenantId" = get_current_tenant_id());

-- Admin Notifications (optional tenantId - allows filtering)
CREATE POLICY admin_notifications_tenant_isolation ON "admin_notifications"
  USING ("tenantId" IS NULL OR "tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" IS NULL OR "tenantId" = get_current_tenant_id());

-- Create an audit log table for tracking RLS access
CREATE TABLE IF NOT EXISTS rls_audit_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  tenant_id INTEGER,
  action TEXT NOT NULL,
  session_user_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on tenant_id for audit queries
CREATE INDEX IF NOT EXISTS idx_rls_audit_log_tenant_id ON rls_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rls_audit_log_created_at ON rls_audit_log(created_at);
