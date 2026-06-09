DO $$ BEGIN
  CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'SOLD', 'RESERVED', 'LAUNCH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PropertyCategory" AS ENUM ('LOTEAMENTO', 'TERRENO', 'CASA', 'APARTAMENTO', 'COMERCIAL', 'RURAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CONVERTED', 'LOST');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "passwordHash" TEXT,
  "whatsapp" TEXT,
  "cpf" TEXT,
  "address" TEXT,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Property" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "fullDescription" TEXT NOT NULL,
  "price" DECIMAL(14,2) NOT NULL,
  "promotionalPrice" DECIMAL(14,2),
  "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
  "propertyCode" TEXT NOT NULL,
  "area" INTEGER NOT NULL,
  "bedrooms" INTEGER,
  "bathrooms" INTEGER,
  "garage" INTEGER,
  "city" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "category" "PropertyCategory" NOT NULL,
  "type" TEXT NOT NULL,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "launch" BOOLEAN NOT NULL DEFAULT false,
  "approved" BOOLEAN NOT NULL DEFAULT true,
  "submittedByOwner" BOOLEAN NOT NULL DEFAULT false,
  "ownerName" TEXT,
  "ownerPhone" TEXT,
  "ownerEmail" TEXT,
  "googleMapsLink" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "youtubeLink" TEXT,
  "coverImage" TEXT NOT NULL,
  "pdfTableUrl" TEXT,
  "pdfProjectUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PropertyImage" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Post" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "coverImage" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Testimonial" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "photoUrl" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "youtubeVideo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "message" TEXT,
  "source" TEXT,
  "pageOrigin" TEXT,
  "propertyId" TEXT,
  "propertyCode" TEXT,
  "propertyTitle" TEXT,
  "propertyCity" TEXT,
  "interest" TEXT,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "assignedTo" TEXT,
  "internalNote" TEXT,
  "consent" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SiteSetting" (
  "id" TEXT NOT NULL,
  "brandName" TEXT NOT NULL DEFAULT 'Munay Imóveis',
  "primaryColor" TEXT NOT NULL DEFAULT '#102a1f',
  "secondaryColor" TEXT NOT NULL DEFAULT '#d4af72',
  "accentColor" TEXT NOT NULL DEFAULT '#f6f2e8',
  "heroTitle" TEXT NOT NULL DEFAULT 'Invista em terrenos com alto potencial de valorização',
  "heroSubtitle" TEXT NOT NULL DEFAULT 'Empreendimentos premium, imóveis selecionados e atendimento consultivo para quem busca patrimônio com inteligência.',
  "heroVideoUrl" TEXT NOT NULL DEFAULT 'https://www.youtube.com/embed/mfNsrZJiQkg?autoplay=1&mute=1&controls=0&loop=1&playlist=mfNsrZJiQkg',
  "whatsappNumber" TEXT NOT NULL DEFAULT '5548991702077',
  "creci" TEXT NOT NULL DEFAULT 'CRECI 33928-F',
  "cnpj" TEXT NOT NULL DEFAULT '',
  "address" TEXT NOT NULL DEFAULT 'Atendimento com hora marcada',
  "phone" TEXT NOT NULL DEFAULT '(48) 99170-2077',
  "instagram" TEXT NOT NULL DEFAULT 'https://instagram.com/corretor_icaro_munay',
  "privacyUrl" TEXT NOT NULL DEFAULT '/politica-de-privacidade',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_cpf_key" ON "User"("cpf");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "Property_slug_key" ON "Property"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Property_propertyCode_key" ON "Property"("propertyCode");
CREATE INDEX IF NOT EXISTS "Property_city_district_idx" ON "Property"("city", "district");
CREATE INDEX IF NOT EXISTS "Property_category_status_featured_idx" ON "Property"("category", "status", "featured");
CREATE INDEX IF NOT EXISTS "Property_approved_launch_featured_idx" ON "Property"("approved", "launch", "featured");
CREATE INDEX IF NOT EXISTS "Property_price_idx" ON "Property"("price");
CREATE INDEX IF NOT EXISTS "Property_createdAt_idx" ON "Property"("createdAt");
CREATE INDEX IF NOT EXISTS "PropertyImage_propertyId_sortOrder_idx" ON "PropertyImage"("propertyId", "sortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "Post_slug_key" ON "Post"("slug");
CREATE INDEX IF NOT EXISTS "Post_published_createdAt_idx" ON "Post"("published", "createdAt");
CREATE INDEX IF NOT EXISTS "Post_category_idx" ON "Post"("category");
CREATE INDEX IF NOT EXISTS "Testimonial_createdAt_idx" ON "Testimonial"("createdAt");
CREATE INDEX IF NOT EXISTS "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_propertyId_createdAt_idx" ON "Lead"("propertyId", "createdAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Account_userId_fkey') THEN
    ALTER TABLE "Account"
      ADD CONSTRAINT "Account_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Session_userId_fkey') THEN
    ALTER TABLE "Session"
      ADD CONSTRAINT "Session_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PropertyImage_propertyId_fkey') THEN
    ALTER TABLE "PropertyImage"
      ADD CONSTRAINT "PropertyImage_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Lead_propertyId_fkey') THEN
    ALTER TABLE "Lead"
      ADD CONSTRAINT "Lead_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
