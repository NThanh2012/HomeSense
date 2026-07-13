-- CreateEnum
CREATE TYPE "DemandType" AS ENUM ('BUY', 'RENT', 'SELL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "UserDemandStatus" AS ENUM ('NEW', 'ANALYZED', 'MATCHED', 'ARCHIVED', 'INVALID');

-- CreateTable
CREATE TABLE "UserDemand" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "externalUserRef" TEXT,
    "demandType" "DemandType" NOT NULL DEFAULT 'UNKNOWN',
    "propertyTypes" "PropertyType"[] DEFAULT ARRAY[]::"PropertyType"[],
    "minPrice" DECIMAL(18,2),
    "maxPrice" DECIMAL(18,2),
    "minArea" DOUBLE PRECISION,
    "maxArea" DOUBLE PRECISION,
    "province" TEXT,
    "district" TEXT,
    "ward" TEXT,
    "rawLocation" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactPhone" TEXT,
    "sourceConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "UserDemandStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDemandSignal" (
    "id" TEXT NOT NULL,
    "userDemandId" TEXT NOT NULL,
    "rawUserSignalId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDemandSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandAnalysis" (
    "id" TEXT NOT NULL,
    "rawUserSignalId" TEXT NOT NULL,
    "userDemandId" TEXT,
    "extractedDemandType" "DemandType" NOT NULL DEFAULT 'UNKNOWN',
    "extractedPropertyTypes" "PropertyType"[] DEFAULT ARRAY[]::"PropertyType"[],
    "extractedMinPrice" DECIMAL(18,2),
    "extractedMaxPrice" DECIMAL(18,2),
    "extractedMinArea" DOUBLE PRECISION,
    "extractedMaxArea" DOUBLE PRECISION,
    "extractedRawLocation" TEXT,
    "extractedProvince" TEXT,
    "extractedDistrict" TEXT,
    "extractedPhone" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDemand_userId_idx" ON "UserDemand"("userId");

-- CreateIndex
CREATE INDEX "UserDemand_externalUserRef_idx" ON "UserDemand"("externalUserRef");

-- CreateIndex
CREATE INDEX "UserDemand_demandType_idx" ON "UserDemand"("demandType");

-- CreateIndex
CREATE INDEX "UserDemand_status_idx" ON "UserDemand"("status");

-- CreateIndex
CREATE INDEX "UserDemand_province_idx" ON "UserDemand"("province");

-- CreateIndex
CREATE INDEX "UserDemand_district_idx" ON "UserDemand"("district");

-- CreateIndex
CREATE UNIQUE INDEX "UserDemandSignal_rawUserSignalId_key" ON "UserDemandSignal"("rawUserSignalId");

-- CreateIndex
CREATE INDEX "UserDemandSignal_userDemandId_idx" ON "UserDemandSignal"("userDemandId");

-- CreateIndex
CREATE INDEX "UserDemandSignal_sourceType_idx" ON "UserDemandSignal"("sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "DemandAnalysis_rawUserSignalId_key" ON "DemandAnalysis"("rawUserSignalId");

-- CreateIndex
CREATE INDEX "DemandAnalysis_userDemandId_idx" ON "DemandAnalysis"("userDemandId");

-- AddForeignKey
ALTER TABLE "UserDemand" ADD CONSTRAINT "UserDemand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDemandSignal" ADD CONSTRAINT "UserDemandSignal_userDemandId_fkey" FOREIGN KEY ("userDemandId") REFERENCES "UserDemand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandAnalysis" ADD CONSTRAINT "DemandAnalysis_userDemandId_fkey" FOREIGN KEY ("userDemandId") REFERENCES "UserDemand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
