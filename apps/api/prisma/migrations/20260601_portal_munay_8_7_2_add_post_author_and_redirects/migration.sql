ALTER TABLE IF EXISTS "Post"
  ADD COLUMN IF NOT EXISTS "author" TEXT NOT NULL DEFAULT 'Equipe Munay Imóveis';

CREATE TABLE IF NOT EXISTS "Redirect" (
  "id" TEXT NOT NULL,
  "sourcePath" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "type" INTEGER NOT NULL DEFAULT 301,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Redirect_sourcePath_key" ON "Redirect"("sourcePath");
CREATE INDEX IF NOT EXISTS "Redirect_active_sourcePath_idx" ON "Redirect"("active", "sourcePath");
