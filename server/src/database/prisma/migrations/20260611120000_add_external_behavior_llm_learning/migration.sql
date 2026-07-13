CREATE TYPE "UserDemandOrigin" AS ENUM ('EXPLICIT', 'EXTERNAL_BEHAVIOR');
CREATE TYPE "UserBehaviorSource" AS ENUM ('INTERNAL', 'EXTERNAL');
CREATE TYPE "ExternalBehaviorAnalysisStatus" AS ENUM ('ANALYZED', 'REVIEW_REQUIRED', 'FAILED');

ALTER TYPE "SourceImportTargetType" ADD VALUE 'EXTERNAL_BEHAVIOR';

ALTER TABLE "UserDemand"
ADD COLUMN "origin" "UserDemandOrigin" NOT NULL DEFAULT 'EXPLICIT',
ADD COLUMN "behaviorDerivedKey" TEXT;

ALTER TABLE "UserBehaviorEvent"
ADD COLUMN "source" "UserBehaviorSource" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN "occurredAt" TIMESTAMP(3),
ADD COLUMN "externalBehaviorAnalysisId" TEXT;

ALTER TABLE "UserPreferenceProfile"
ADD COLUMN "lastEventAt" TIMESTAMP(3),
ADD COLUMN "isStale" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ExternalUserLink" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "externalUserRef" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "linkedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExternalUserLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalBehaviorAnalysis" (
    "id" TEXT NOT NULL,
    "rawExternalBehaviorId" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "externalUserRef" TEXT NOT NULL,
    "status" "ExternalBehaviorAnalysisStatus" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "eventType" "UserBehaviorEventType",
    "demandType" "DemandType" NOT NULL DEFAULT 'UNKNOWN',
    "propertyTypes" "PropertyType"[] DEFAULT ARRAY[]::"PropertyType"[],
    "minPrice" DECIMAL(18,2),
    "maxPrice" DECIMAL(18,2),
    "minArea" DOUBLE PRECISION,
    "maxArea" DOUBLE PRECISION,
    "province" TEXT,
    "district" TEXT,
    "rawLocation" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMP(3),
    "result" JSONB NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExternalBehaviorAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserDemand_behaviorDerivedKey_key" ON "UserDemand"("behaviorDerivedKey");
CREATE UNIQUE INDEX "UserBehaviorEvent_externalBehaviorAnalysisId_key" ON "UserBehaviorEvent"("externalBehaviorAnalysisId");
CREATE INDEX "UserBehaviorEvent_source_idx" ON "UserBehaviorEvent"("source");
CREATE INDEX "UserBehaviorEvent_occurredAt_idx" ON "UserBehaviorEvent"("occurredAt");
CREATE UNIQUE INDEX "ExternalUserLink_dataSourceId_externalUserRef_key" ON "ExternalUserLink"("dataSourceId", "externalUserRef");
CREATE INDEX "ExternalUserLink_userId_isActive_idx" ON "ExternalUserLink"("userId", "isActive");
CREATE INDEX "ExternalUserLink_linkedByUserId_idx" ON "ExternalUserLink"("linkedByUserId");
CREATE UNIQUE INDEX "ExternalBehaviorAnalysis_rawExternalBehaviorId_key" ON "ExternalBehaviorAnalysis"("rawExternalBehaviorId");
CREATE INDEX "ExternalBehaviorAnalysis_dataSourceId_externalUserRef_idx" ON "ExternalBehaviorAnalysis"("dataSourceId", "externalUserRef");
CREATE INDEX "ExternalBehaviorAnalysis_status_idx" ON "ExternalBehaviorAnalysis"("status");
CREATE INDEX "ExternalBehaviorAnalysis_createdAt_idx" ON "ExternalBehaviorAnalysis"("createdAt");

ALTER TABLE "ExternalUserLink" ADD CONSTRAINT "ExternalUserLink_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalUserLink" ADD CONSTRAINT "ExternalUserLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalUserLink" ADD CONSTRAINT "ExternalUserLink_linkedByUserId_fkey" FOREIGN KEY ("linkedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalBehaviorAnalysis" ADD CONSTRAINT "ExternalBehaviorAnalysis_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserBehaviorEvent" ADD CONSTRAINT "UserBehaviorEvent_externalBehaviorAnalysisId_fkey" FOREIGN KEY ("externalBehaviorAnalysisId") REFERENCES "ExternalBehaviorAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
