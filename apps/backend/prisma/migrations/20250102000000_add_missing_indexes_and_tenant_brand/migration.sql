-- Remove old brand color columns from Tenant (if they exist)
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "primaryBrandColor";
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "secondaryBrandColor";

-- Create TenantBrand table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "TenantBrand" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandName" TEXT,
    "primaryColor" TEXT,
    "primaryForegroundColor" TEXT,
    "secondaryColor" TEXT,
    "secondaryForegroundColor" TEXT,
    "logoLightUrl" TEXT,
    "logoDarkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantBrand_pkey" PRIMARY KEY ("id")
);

-- Create indexes (only if they don't exist)
CREATE UNIQUE INDEX IF NOT EXISTS "TenantBrand_tenantId_key" ON "TenantBrand"("tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");

CREATE INDEX IF NOT EXISTS "Product_tenantId_idx" ON "Product"("tenantId");
CREATE INDEX IF NOT EXISTS "Product_mtProductId_idx" ON "Product"("mtProductId");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_tenantId_mtProductId_key" ON "Product"("tenantId", "mtProductId");

CREATE INDEX IF NOT EXISTS "Session_tenantId_idx" ON "Session"("tenantId");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

CREATE INDEX IF NOT EXISTS "Banner_tenantId_idx" ON "Banner"("tenantId");
CREATE INDEX IF NOT EXISTS "Banner_visible_idx" ON "Banner"("visible");

CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX IF NOT EXISTS "ProductVariant_mtVariantId_idx" ON "ProductVariant"("mtVariantId");
CREATE INDEX IF NOT EXISTS "ProductVariant_sku_idx" ON "ProductVariant"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_productId_mtVariantId_key" ON "ProductVariant"("productId", "mtVariantId");

CREATE INDEX IF NOT EXISTS "ProductImage_productId_idx" ON "ProductImage"("productId");
CREATE INDEX IF NOT EXISTS "ProductImage_variantId_idx" ON "ProductImage"("variantId");
CREATE INDEX IF NOT EXISTS "ProductImage_isFeatured_idx" ON "ProductImage"("isFeatured");

CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Add foreign keys (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Product_tenantId_fkey'
    ) THEN
        ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Session_tenantId_fkey'
    ) THEN
        ALTER TABLE "Session" ADD CONSTRAINT "Session_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Banner_tenantId_fkey'
    ) THEN
        ALTER TABLE "Banner" ADD CONSTRAINT "Banner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductVariant_productId_fkey'
    ) THEN
        ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductImage_productId_fkey'
    ) THEN
        ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductImage_variantId_fkey'
    ) THEN
        ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'User_tenantId_fkey'
    ) THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'TenantBrand_tenantId_fkey'
    ) THEN
        ALTER TABLE "TenantBrand" ADD CONSTRAINT "TenantBrand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

