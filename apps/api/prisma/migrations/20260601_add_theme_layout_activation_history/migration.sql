CREATE TABLE IF NOT EXISTS "ThemeLayoutActivationHistory" (
  "id" TEXT NOT NULL,
  "themeLayoutId" TEXT NOT NULL,
  "layoutNameSnapshot" TEXT NOT NULL,
  "action" TEXT NOT NULL DEFAULT 'ACTIVATE',
  "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ThemeLayoutActivationHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ThemeLayoutActivationHistory_themeLayoutId_activatedAt_idx"
  ON "ThemeLayoutActivationHistory"("themeLayoutId", "activatedAt");

CREATE INDEX IF NOT EXISTS "ThemeLayoutActivationHistory_activatedAt_idx"
  ON "ThemeLayoutActivationHistory"("activatedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'ThemeLayoutActivationHistory_themeLayoutId_fkey'
      AND table_name = 'ThemeLayoutActivationHistory'
  ) THEN
    ALTER TABLE "ThemeLayoutActivationHistory"
      ADD CONSTRAINT "ThemeLayoutActivationHistory_themeLayoutId_fkey"
      FOREIGN KEY ("themeLayoutId") REFERENCES "ThemeLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
