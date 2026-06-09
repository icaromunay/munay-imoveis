CREATE TABLE IF NOT EXISTS "HomeAnalyticsDaily" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "homeVisits" INTEGER NOT NULL DEFAULT 0,
  "homeVideoPlays" INTEGER NOT NULL DEFAULT 0,
  "watched25" INTEGER NOT NULL DEFAULT 0,
  "watched50" INTEGER NOT NULL DEFAULT 0,
  "watched75" INTEGER NOT NULL DEFAULT 0,
  "watched100" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomeAnalyticsDaily_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HomeAnalyticsVisitorDay" (
  "id" TEXT NOT NULL,
  "visitorKey" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "visited" BOOLEAN NOT NULL DEFAULT false,
  "videoPlayTracked" BOOLEAN NOT NULL DEFAULT false,
  "watched25Tracked" BOOLEAN NOT NULL DEFAULT false,
  "watched50Tracked" BOOLEAN NOT NULL DEFAULT false,
  "watched75Tracked" BOOLEAN NOT NULL DEFAULT false,
  "watched100Tracked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomeAnalyticsVisitorDay_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PropertyAnalyticsDaily" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "propertyViews" INTEGER NOT NULL DEFAULT 0,
  "whatsappClicks" INTEGER NOT NULL DEFAULT 0,
  "scheduleVisitClicks" INTEGER NOT NULL DEFAULT 0,
  "lastViewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyAnalyticsDaily_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PropertyAnalyticsVisitorDay" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "visitorKey" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyAnalyticsVisitorDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HomeAnalyticsDaily_date_key" ON "HomeAnalyticsDaily"("date");
CREATE INDEX IF NOT EXISTS "HomeAnalyticsDaily_date_idx" ON "HomeAnalyticsDaily"("date");

CREATE UNIQUE INDEX IF NOT EXISTS "HomeAnalyticsVisitorDay_visitorKey_date_key" ON "HomeAnalyticsVisitorDay"("visitorKey", "date");
CREATE INDEX IF NOT EXISTS "HomeAnalyticsVisitorDay_date_idx" ON "HomeAnalyticsVisitorDay"("date");

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyAnalyticsDaily_propertyId_date_key" ON "PropertyAnalyticsDaily"("propertyId", "date");
CREATE INDEX IF NOT EXISTS "PropertyAnalyticsDaily_date_idx" ON "PropertyAnalyticsDaily"("date");
CREATE INDEX IF NOT EXISTS "PropertyAnalyticsDaily_propertyId_date_idx" ON "PropertyAnalyticsDaily"("propertyId", "date");

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyAnalyticsVisitorDay_propertyId_visitorKey_date_key" ON "PropertyAnalyticsVisitorDay"("propertyId", "visitorKey", "date");
CREATE INDEX IF NOT EXISTS "PropertyAnalyticsVisitorDay_date_idx" ON "PropertyAnalyticsVisitorDay"("date");
CREATE INDEX IF NOT EXISTS "PropertyAnalyticsVisitorDay_propertyId_date_idx" ON "PropertyAnalyticsVisitorDay"("propertyId", "date");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'PropertyAnalyticsDaily_propertyId_fkey'
      AND table_name = 'PropertyAnalyticsDaily'
  ) THEN
    ALTER TABLE "PropertyAnalyticsDaily"
      ADD CONSTRAINT "PropertyAnalyticsDaily_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'PropertyAnalyticsVisitorDay_propertyId_fkey'
      AND table_name = 'PropertyAnalyticsVisitorDay'
  ) THEN
    ALTER TABLE "PropertyAnalyticsVisitorDay"
      ADD CONSTRAINT "PropertyAnalyticsVisitorDay_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
