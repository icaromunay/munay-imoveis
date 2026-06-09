ALTER TABLE IF EXISTS "SiteSetting"
  ADD COLUMN IF NOT EXISTS "googleTagManagerId" TEXT,
  ADD COLUMN IF NOT EXISTS "ga4MeasurementId" TEXT,
  ADD COLUMN IF NOT EXISTS "googleSiteVerification" TEXT,
  ADD COLUMN IF NOT EXISTS "metaPixelId" TEXT,
  ADD COLUMN IF NOT EXISTS "metaDomainVerification" TEXT,
  ADD COLUMN IF NOT EXISTS "microsoftClarityId" TEXT,
  ADD COLUMN IF NOT EXISTS "bingSiteVerification" TEXT,
  ADD COLUMN IF NOT EXISTS "tiktokPixelId" TEXT,
  ADD COLUMN IF NOT EXISTS "linkedInPartnerId" TEXT,
  ADD COLUMN IF NOT EXISTS "pinterestTagId" TEXT,
  ADD COLUMN IF NOT EXISTS "customHeadCode" TEXT,
  ADD COLUMN IF NOT EXISTS "customBodyCode" TEXT,
  ADD COLUMN IF NOT EXISTS "customFooterCode" TEXT,
  ADD COLUMN IF NOT EXISTS "indexNowKey" TEXT DEFAULT 'munay-indexnow-key';

UPDATE "SiteSetting"
SET "indexNowKey" = COALESCE("indexNowKey", 'munay-indexnow-key');

ALTER TABLE IF EXISTS "SiteSetting"
  ALTER COLUMN "indexNowKey" SET DEFAULT 'munay-indexnow-key';
