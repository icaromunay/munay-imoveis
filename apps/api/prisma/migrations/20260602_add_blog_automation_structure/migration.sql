-- Create structure for automated blog publishing
CREATE TYPE "BlogArticleQueueStatus" AS ENUM ('PENDING', 'GENERATED', 'PUBLISHED', 'FAILED');

CREATE TABLE "BlogAutomationSettings" (
  "id" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "provider" TEXT NOT NULL DEFAULT 'OPENAI',
  "apiKey" TEXT,
  "publishTime" TEXT NOT NULL DEFAULT '09:00',
  "articlesPerDay" INTEGER NOT NULL DEFAULT 1,
  "defaultAuthor" TEXT NOT NULL DEFAULT 'Equipe Munay Imóveis',
  "defaultCategory" TEXT NOT NULL DEFAULT 'Mercado imobiliário',
  "autoPublish" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogAutomationSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogArticleQueue" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "seoTitle" TEXT NOT NULL,
  "seoDescription" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "BlogArticleQueueStatus" NOT NULL DEFAULT 'PENDING',
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogArticleQueue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlogArticleQueue_slug_key" ON "BlogArticleQueue"("slug");
CREATE INDEX "BlogArticleQueue_status_createdAt_idx" ON "BlogArticleQueue"("status", "createdAt");
CREATE INDEX "BlogArticleQueue_status_scheduledAt_idx" ON "BlogArticleQueue"("status", "scheduledAt");
CREATE INDEX "BlogArticleQueue_scheduledAt_idx" ON "BlogArticleQueue"("scheduledAt");
CREATE INDEX "BlogArticleQueue_publishedAt_idx" ON "BlogArticleQueue"("publishedAt");
CREATE INDEX "BlogArticleQueue_category_createdAt_idx" ON "BlogArticleQueue"("category", "createdAt");
