-- AlterTable
ALTER TABLE "billing_preferences" ADD COLUMN     "gcashAccountName" TEXT,
ADD COLUMN     "gcashEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "gcashPhoneNumber" TEXT,
ADD COLUMN     "gcashQrCodeUrl" TEXT;
