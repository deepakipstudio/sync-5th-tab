-- AlterTable: Add store settings fields to TenantBrand
ALTER TABLE "TenantBrand" ADD COLUMN IF NOT EXISTS "storeName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "TenantBrand" ADD COLUMN IF NOT EXISTS "storeDescription" TEXT;
ALTER TABLE "TenantBrand" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "TenantBrand" ADD COLUMN IF NOT EXISTS "defaultLocationId" TEXT;

-- CreateTable: StoreHours
CREATE TABLE IF NOT EXISTS "StoreHours" (
    "id" TEXT NOT NULL,
    "tenantBrandId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "openTime" TEXT,
    "closeTime" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoreHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StoreHours_tenantBrandId_dayOfWeek_key" ON "StoreHours"("tenantBrandId", "dayOfWeek");
CREATE INDEX IF NOT EXISTS "StoreHours_tenantBrandId_idx" ON "StoreHours"("tenantBrandId");

-- AddForeignKey
ALTER TABLE "StoreHours" ADD CONSTRAINT "StoreHours_tenantBrandId_fkey"
    FOREIGN KEY ("tenantBrandId") REFERENCES "TenantBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
