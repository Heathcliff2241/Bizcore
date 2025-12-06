-- CreateTable Plan
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE INDEX "plans_isActive_idx" ON "plans"("isActive");

-- CreateIndex
CREATE INDEX "plans_displayOrder_idx" ON "plans"("displayOrder");

-- Seed default plans
INSERT INTO "plans" ("id", "name", "description", "price", "billingCycle", "features", "isActive", "displayOrder", "updatedAt") VALUES
('trial', 'Free Trial', '14 days full access', 0, 'trial', ARRAY['Full access to all features', '14 days free trial', 'No credit card required', 'Cancel anytime'], true, 0, NOW()),
('basic', 'Standard Monthly', 'Perfect for small businesses', 1999, 'monthly', ARRAY['Full POS system', 'Inventory management', 'Order management', 'Store builder', 'Email support', 'Cancel anytime'], true, 1, NOW()),
('premium', 'Standard Yearly', 'Save ₱3,989 per year', 19999, 'annual', ARRAY['Everything in Monthly', 'Save 2 months per year', 'Price lock guarantee', 'Priority support', 'Advanced analytics', 'API access'], true, 2, NOW()),
('enterprise', 'Enterprise', 'Custom pricing for large businesses', 0, 'monthly', ARRAY['All features included', 'Unlimited team members', 'Dedicated account manager', 'Custom integrations', '24/7 priority support', 'SLA guarantee'], true, 3, NOW());
