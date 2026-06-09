DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PropertyReviewStatus') THEN
    CREATE TYPE "PropertyReviewStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');
  END IF;
END $$;

ALTER TABLE IF EXISTS "Property"
  ADD COLUMN IF NOT EXISTS "reviewStatus" "PropertyReviewStatus";

UPDATE "Property"
SET "reviewStatus" = CASE
  WHEN "reviewStatus" IS NOT NULL THEN "reviewStatus"
  WHEN COALESCE("approved", true) = true THEN 'APPROVED'::"PropertyReviewStatus"
  ELSE 'PENDING'::"PropertyReviewStatus"
END;

ALTER TABLE IF EXISTS "Property"
  ALTER COLUMN "reviewStatus" SET DEFAULT 'APPROVED'::"PropertyReviewStatus";

ALTER TABLE IF EXISTS "Property"
  ALTER COLUMN "reviewStatus" SET NOT NULL;
