-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SELL', 'RENT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'LAND', 'VILLA', 'ROOM', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "province" TEXT,
    "district" TEXT,
    "ward" TEXT,
    "street" TEXT,
    "rawAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "rawPostId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "transactionType" "TransactionType" NOT NULL DEFAULT 'UNKNOWN',
    "propertyType" "PropertyType" NOT NULL DEFAULT 'UNKNOWN',
    "price" DECIMAL(18,2),
    "area" DOUBLE PRECISION,
    "contactPhone" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "status" "PropertyStatus" NOT NULL DEFAULT 'PUBLISHED',
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyMedia" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyAnalysis" (
    "id" TEXT NOT NULL,
    "rawPostId" TEXT NOT NULL,
    "propertyId" TEXT,
    "extractedTitle" TEXT,
    "extractedAddress" TEXT,
    "extractedPrice" DECIMAL(18,2),
    "extractedArea" DOUBLE PRECISION,
    "extractedPhone" TEXT,
    "extractedTransactionType" "TransactionType" NOT NULL DEFAULT 'UNKNOWN',
    "extractedPropertyType" "PropertyType" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_rawPostId_key" ON "Property"("rawPostId");

-- CreateIndex
CREATE INDEX "Property_transactionType_idx" ON "Property"("transactionType");

-- CreateIndex
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "PropertyMedia_propertyId_idx" ON "PropertyMedia"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyAnalysis_rawPostId_idx" ON "PropertyAnalysis"("rawPostId");

-- CreateIndex
CREATE INDEX "PropertyAnalysis_propertyId_idx" ON "PropertyAnalysis"("propertyId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAnalysis" ADD CONSTRAINT "PropertyAnalysis_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
