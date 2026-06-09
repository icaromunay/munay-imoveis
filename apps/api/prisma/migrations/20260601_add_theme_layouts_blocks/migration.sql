ALTER TABLE IF EXISTS "SiteSetting"
  ADD COLUMN IF NOT EXISTS "activeThemeLayoutId" TEXT,
  ADD COLUMN IF NOT EXISTS "previousThemeLayoutId" TEXT;

CREATE TABLE IF NOT EXISTS "ThemeLayout" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ThemeLayout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ThemeLayoutBlock" (
  "id" TEXT NOT NULL,
  "themeLayoutId" TEXT NOT NULL,
  "blockKey" TEXT NOT NULL,
  "blockName" TEXT NOT NULL,
  "settingsJson" JSONB NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ThemeLayoutBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ThemeLayout_slug_key" ON "ThemeLayout"("slug");
CREATE INDEX IF NOT EXISTS "ThemeLayout_isActive_createdAt_idx" ON "ThemeLayout"("isActive", "createdAt");
CREATE INDEX IF NOT EXISTS "ThemeLayout_isDefault_createdAt_idx" ON "ThemeLayout"("isDefault", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ThemeLayoutBlock_themeLayoutId_blockKey_key" ON "ThemeLayoutBlock"("themeLayoutId", "blockKey");
CREATE INDEX IF NOT EXISTS "ThemeLayoutBlock_themeLayoutId_sortOrder_idx" ON "ThemeLayoutBlock"("themeLayoutId", "sortOrder");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'ThemeLayoutBlock_themeLayoutId_fkey'
      AND table_name = 'ThemeLayoutBlock'
  ) THEN
    ALTER TABLE "ThemeLayoutBlock"
      ADD CONSTRAINT "ThemeLayoutBlock_themeLayoutId_fkey"
      FOREIGN KEY ("themeLayoutId") REFERENCES "ThemeLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
