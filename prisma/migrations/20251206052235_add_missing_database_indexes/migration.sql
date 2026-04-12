-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'issued';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "paymentProof" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lowStockThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN     "trackInventory" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "admin_settings" (
    "id" SERIAL NOT NULL,
    "adminGcashPhoneNumber" TEXT,
    "adminGcashAccountName" TEXT,
    "adminGcashQrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "userType" TEXT NOT NULL DEFAULT 'tenant',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otps_email_idx" ON "otps"("email");

-- CreateIndex
CREATE INDEX "otps_userType_idx" ON "otps"("userType");

-- CreateIndex
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");

-- CreateIndex
CREATE INDEX "categories_tenantId_isActive_idx" ON "categories"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "ingredients_isActive_idx" ON "ingredients"("isActive");

-- CreateIndex
CREATE INDEX "ingredients_tenantId_isActive_idx" ON "ingredients"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "invoices_subscriptionId_status_idx" ON "invoices"("subscriptionId", "status");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "orders_tenantId_createdAt_idx" ON "orders"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "pages_isPublished_idx" ON "pages"("isPublished");

-- CreateIndex
CREATE INDEX "pages_tenantId_isPublished_idx" ON "pages"("tenantId", "isPublished");

-- CreateIndex
CREATE INDEX "payments_status_nextRetryAt_idx" ON "payments"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

-- CreateIndex
CREATE INDEX "products_isFeatured_idx" ON "products"("isFeatured");

-- CreateIndex
CREATE INDEX "products_slug_idx" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_tenantId_isActive_idx" ON "products"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "tenants_isActive_idx" ON "tenants"("isActive");

-- CreateIndex
CREATE INDEX "tenants_ownerId_idx" ON "tenants"("ownerId");

-- CreateIndex
CREATE INDEX "tenants_isPremium_idx" ON "tenants"("isPremium");

-- CreateIndex
CREATE INDEX "tenants_createdAt_idx" ON "tenants"("createdAt");
