/*
  Warnings:

  - You are about to drop the `rls_audit_log` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UpgradeStatus" AS ENUM ('pending', 'payment_submitted', 'approved', 'applied', 'cancelled', 'expired');

-- DropTable
DROP TABLE "rls_audit_log";

-- CreateTable
CREATE TABLE "plan_upgrade_requests" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "currentPlan" TEXT NOT NULL,
    "newPlan" TEXT NOT NULL,
    "status" "UpgradeStatus" NOT NULL DEFAULT 'pending',
    "amountDue" INTEGER NOT NULL,
    "prorationDetails" JSONB NOT NULL,
    "paymentId" INTEGER,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentSubmittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "approvedBy" INTEGER,
    "approvalNotes" TEXT,

    CONSTRAINT "plan_upgrade_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_upgrade_requests_tenantId_key" ON "plan_upgrade_requests"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_upgrade_requests_paymentId_key" ON "plan_upgrade_requests"("paymentId");

-- CreateIndex
CREATE INDEX "plan_upgrade_requests_tenantId_idx" ON "plan_upgrade_requests"("tenantId");

-- CreateIndex
CREATE INDEX "plan_upgrade_requests_status_idx" ON "plan_upgrade_requests"("status");

-- CreateIndex
CREATE INDEX "plan_upgrade_requests_expiresAt_idx" ON "plan_upgrade_requests"("expiresAt");

-- AddForeignKey
ALTER TABLE "plan_upgrade_requests" ADD CONSTRAINT "plan_upgrade_requests_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_upgrade_requests" ADD CONSTRAINT "plan_upgrade_requests_tenantId_subscription_fkey" FOREIGN KEY ("tenantId") REFERENCES "subscriptions"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_upgrade_requests" ADD CONSTRAINT "plan_upgrade_requests_tenantId_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
