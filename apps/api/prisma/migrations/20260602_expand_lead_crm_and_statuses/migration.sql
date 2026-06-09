-- Add mini-CRM capabilities for leads
CREATE TYPE "LeadStatus_new" AS ENUM (
  'NEW',
  'CONTACTED',
  'WAITING_RETURN',
  'VISITED_PROPERTY',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'CLOSED',
  'LOST'
);

ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "nextContactAt" TIMESTAMP(3);

ALTER TABLE "Lead"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Lead"
  ALTER COLUMN "status" TYPE "LeadStatus_new"
  USING (
    CASE "status"::text
      WHEN 'NEW' THEN 'NEW'
      WHEN 'IN_PROGRESS' THEN 'CONTACTED'
      WHEN 'CONVERTED' THEN 'CLOSED'
      WHEN 'LOST' THEN 'LOST'
      ELSE 'NEW'
    END
  )::"LeadStatus_new";

DROP TYPE "LeadStatus";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";

ALTER TABLE "Lead"
  ALTER COLUMN "status" SET DEFAULT 'NEW';

CREATE INDEX IF NOT EXISTS "Lead_status_nextContactAt_idx" ON "Lead"("status", "nextContactAt");
CREATE INDEX IF NOT EXISTS "Lead_nextContactAt_createdAt_idx" ON "Lead"("nextContactAt", "createdAt");
