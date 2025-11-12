-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "industry" TEXT,
ADD COLUMN     "primaryColor" TEXT DEFAULT '#1e40af',
ADD COLUMN     "secondaryColor" TEXT DEFAULT '#059669';
