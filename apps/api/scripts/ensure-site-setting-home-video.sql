ALTER TABLE IF EXISTS "SiteSetting"
  ADD COLUMN IF NOT EXISTS "homeVideoStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
  ADD COLUMN IF NOT EXISTS "homeVideoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "homeVideoTitle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "homeVideoDescription" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "homeVideoThumbnailUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "homeVideoOrder" INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = 'SiteSetting'
  ) THEN
    UPDATE "SiteSetting"
    SET
      "homeVideoStatus" = COALESCE("homeVideoStatus", 'INACTIVE'),
      "homeVideoTitle" = COALESCE("homeVideoTitle", ''),
      "homeVideoDescription" = COALESCE("homeVideoDescription", ''),
      "homeVideoOrder" = COALESCE("homeVideoOrder", 1);

    ALTER TABLE "SiteSetting"
      ALTER COLUMN "homeVideoStatus" SET DEFAULT 'INACTIVE',
      ALTER COLUMN "homeVideoTitle" SET DEFAULT '',
      ALTER COLUMN "homeVideoDescription" SET DEFAULT '',
      ALTER COLUMN "homeVideoOrder" SET DEFAULT 1;

    ALTER TABLE "SiteSetting"
      ALTER COLUMN "homeVideoStatus" SET NOT NULL,
      ALTER COLUMN "homeVideoTitle" SET NOT NULL,
      ALTER COLUMN "homeVideoDescription" SET NOT NULL,
      ALTER COLUMN "homeVideoOrder" SET NOT NULL;
  END IF;
END $$;
