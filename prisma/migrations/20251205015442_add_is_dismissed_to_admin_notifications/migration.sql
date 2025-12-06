-- AlterTable
ALTER TABLE "admin_notifications" ADD COLUMN     "isDismissed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "admin_notifications_isDismissed_idx" ON "admin_notifications"("isDismissed");
