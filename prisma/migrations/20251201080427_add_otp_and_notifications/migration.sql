-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailVerificationOtp" TEXT,
ADD COLUMN     "emailVerificationOtpExpires" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "tenant_registrations" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "industry" TEXT,
    "description" TEXT,
    "verificationToken" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'new_registration',
    "tenantId" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_registrations_verificationToken_key" ON "tenant_registrations"("verificationToken");

-- CreateIndex
CREATE INDEX "tenant_registrations_userId_idx" ON "tenant_registrations"("userId");

-- CreateIndex
CREATE INDEX "tenant_registrations_email_idx" ON "tenant_registrations"("email");

-- CreateIndex
CREATE INDEX "tenant_registrations_verificationToken_idx" ON "tenant_registrations"("verificationToken");

-- CreateIndex
CREATE INDEX "admin_notifications_tenantId_idx" ON "admin_notifications"("tenantId");

-- CreateIndex
CREATE INDEX "admin_notifications_type_idx" ON "admin_notifications"("type");

-- CreateIndex
CREATE INDEX "admin_notifications_isRead_idx" ON "admin_notifications"("isRead");

-- AddForeignKey
ALTER TABLE "tenant_registrations" ADD CONSTRAINT "tenant_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
