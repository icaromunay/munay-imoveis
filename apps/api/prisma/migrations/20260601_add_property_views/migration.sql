-- AlterTable
ALTER TABLE "Property"
ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PropertyView" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "visitorKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PropertyView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyView_propertyId_visitorKey_key" ON "PropertyView"("propertyId", "visitorKey");
CREATE INDEX "PropertyView_propertyId_createdAt_idx" ON "PropertyView"("propertyId", "createdAt");

-- AddForeignKey
ALTER TABLE "PropertyView"
ADD CONSTRAINT "PropertyView_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
