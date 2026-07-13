-- CreateEnum
CREATE TYPE "PreferenceSignalType" AS ENUM ('TRANSACTION_TYPE', 'PROPERTY_TYPE', 'LOCATION', 'PRICE_RANGE', 'AREA_RANGE', 'KEYWORD', 'BEDROOMS', 'BATHROOMS', 'FURNISHING', 'LEGAL_STATUS', 'DIRECTION', 'AMENITY', 'NEARBY_PLACE', 'LOCATION_ANCHOR');

-- CreateEnum
CREATE TYPE "PreferenceSignalSource" AS ENUM ('WEBSITE_BEHAVIOR', 'EXTERNAL_BEHAVIOR', 'USER_PROFILE');

-- CreateEnum
CREATE TYPE "RealEstateIntentStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LocationAnchorType" AS ENUM ('RESIDENCE', 'HOMETOWN', 'WORKPLACE', 'SCHOOL', 'FREQUENT', 'OTHER');

-- CreateEnum
CREATE TYPE "LearningJobType" AS ENUM ('EXTERNAL_LEARNING', 'RECOMMENDATION_RECOMPUTE', 'RAW_CLEANUP');

-- CreateEnum
CREATE TYPE "LearningJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "LearningJobPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'IMMEDIATE');

-- CreateEnum
CREATE TYPE "LearningJobItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'SKIPPED', 'FAILED');

-- AlterTable
ALTER TABLE "ExternalBehaviorAnalysis" ADD COLUMN     "cacheKey" TEXT,
ADD COLUMN     "estimatedInputTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimatedOutputTokens" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "direction" TEXT,
ADD COLUMN     "furnishingStatus" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "legalStatus" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PropertyAnalysis" ADD COLUMN     "extractedAmenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "extractedBathrooms" INTEGER,
ADD COLUMN     "extractedBedrooms" INTEGER,
ADD COLUMN     "extractedDirection" TEXT,
ADD COLUMN     "extractedFurnishingStatus" TEXT,
ADD COLUMN     "extractedLegalStatus" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "parserVersion" TEXT NOT NULL DEFAULT 'rule-v1',
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'RULE_BASED';

-- CreateTable
CREATE TABLE "PropertyNearbyPlace" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyNearbyPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferenceSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalType" "PreferenceSignalType" NOT NULL,
    "source" "PreferenceSignalSource" NOT NULL,
    "value" JSONB NOT NULL,
    "baseWeight" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "provenanceKey" TEXT,
    "behaviorEventId" TEXT,
    "externalBehaviorAnalysisId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPreferenceSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRealEstateIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "demandId" TEXT,
    "intentKey" TEXT NOT NULL,
    "demandType" "DemandType" NOT NULL DEFAULT 'UNKNOWN',
    "propertyTypes" "PropertyType"[] DEFAULT ARRAY[]::"PropertyType"[],
    "province" TEXT,
    "district" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSignalAt" TIMESTAMP(3),
    "status" "RealEstateIntentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRealEstateIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentPreferenceSignal" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntentPreferenceSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLocationAnchor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "anchorType" "LocationAnchorType" NOT NULL,
    "label" TEXT,
    "province" TEXT,
    "district" TEXT,
    "rawLocation" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "baseWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "source" "PreferenceSignalSource" NOT NULL DEFAULT 'USER_PROFILE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLocationAnchor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningJob" (
    "id" TEXT NOT NULL,
    "type" "LearningJobType" NOT NULL,
    "status" "LearningJobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "LearningJobPriority" NOT NULL DEFAULT 'NORMAL',
    "activeKey" TEXT,
    "userId" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseExpiresAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningJobItem" (
    "id" TEXT NOT NULL,
    "learningJobId" TEXT NOT NULL,
    "rawRecordId" TEXT,
    "status" "LearningJobItemStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningJobItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationRecomputeJob" (
    "id" TEXT NOT NULL,
    "learningJobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationRecomputeJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmExtractionCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "estimatedInputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LlmExtractionCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyNearbyPlace_propertyId_idx" ON "PropertyNearbyPlace"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyNearbyPlace_category_idx" ON "PropertyNearbyPlace"("category");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferenceSignal_provenanceKey_key" ON "UserPreferenceSignal"("provenanceKey");

-- CreateIndex
CREATE INDEX "UserPreferenceSignal_userId_signalType_idx" ON "UserPreferenceSignal"("userId", "signalType");

-- CreateIndex
CREATE INDEX "UserPreferenceSignal_userId_occurredAt_idx" ON "UserPreferenceSignal"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "UserPreferenceSignal_behaviorEventId_idx" ON "UserPreferenceSignal"("behaviorEventId");

-- CreateIndex
CREATE INDEX "UserPreferenceSignal_externalBehaviorAnalysisId_idx" ON "UserPreferenceSignal"("externalBehaviorAnalysisId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRealEstateIntent_demandId_key" ON "UserRealEstateIntent"("demandId");

-- CreateIndex
CREATE INDEX "UserRealEstateIntent_userId_status_idx" ON "UserRealEstateIntent"("userId", "status");

-- CreateIndex
CREATE INDEX "UserRealEstateIntent_lastSignalAt_idx" ON "UserRealEstateIntent"("lastSignalAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRealEstateIntent_userId_intentKey_key" ON "UserRealEstateIntent"("userId", "intentKey");

-- CreateIndex
CREATE INDEX "IntentPreferenceSignal_signalId_idx" ON "IntentPreferenceSignal"("signalId");

-- CreateIndex
CREATE UNIQUE INDEX "IntentPreferenceSignal_intentId_signalId_key" ON "IntentPreferenceSignal"("intentId", "signalId");

-- CreateIndex
CREATE INDEX "UserLocationAnchor_userId_isActive_idx" ON "UserLocationAnchor"("userId", "isActive");

-- CreateIndex
CREATE INDEX "UserLocationAnchor_anchorType_idx" ON "UserLocationAnchor"("anchorType");

-- CreateIndex
CREATE UNIQUE INDEX "LearningJob_activeKey_key" ON "LearningJob"("activeKey");

-- CreateIndex
CREATE INDEX "LearningJob_status_availableAt_idx" ON "LearningJob"("status", "availableAt");

-- CreateIndex
CREATE INDEX "LearningJob_userId_type_idx" ON "LearningJob"("userId", "type");

-- CreateIndex
CREATE INDEX "LearningJob_leaseExpiresAt_idx" ON "LearningJob"("leaseExpiresAt");

-- CreateIndex
CREATE INDEX "LearningJobItem_learningJobId_status_idx" ON "LearningJobItem"("learningJobId", "status");

-- CreateIndex
CREATE INDEX "LearningJobItem_rawRecordId_idx" ON "LearningJobItem"("rawRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationRecomputeJob_learningJobId_key" ON "RecommendationRecomputeJob"("learningJobId");

-- CreateIndex
CREATE INDEX "RecommendationRecomputeJob_userId_idx" ON "RecommendationRecomputeJob"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LlmExtractionCache_cacheKey_key" ON "LlmExtractionCache"("cacheKey");

-- CreateIndex
CREATE INDEX "LlmExtractionCache_provider_model_promptVersion_idx" ON "LlmExtractionCache"("provider", "model", "promptVersion");

-- AddForeignKey
ALTER TABLE "PropertyNearbyPlace" ADD CONSTRAINT "PropertyNearbyPlace_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferenceSignal" ADD CONSTRAINT "UserPreferenceSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferenceSignal" ADD CONSTRAINT "UserPreferenceSignal_behaviorEventId_fkey" FOREIGN KEY ("behaviorEventId") REFERENCES "UserBehaviorEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferenceSignal" ADD CONSTRAINT "UserPreferenceSignal_externalBehaviorAnalysisId_fkey" FOREIGN KEY ("externalBehaviorAnalysisId") REFERENCES "ExternalBehaviorAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRealEstateIntent" ADD CONSTRAINT "UserRealEstateIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRealEstateIntent" ADD CONSTRAINT "UserRealEstateIntent_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "UserDemand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentPreferenceSignal" ADD CONSTRAINT "IntentPreferenceSignal_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "UserRealEstateIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentPreferenceSignal" ADD CONSTRAINT "IntentPreferenceSignal_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "UserPreferenceSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLocationAnchor" ADD CONSTRAINT "UserLocationAnchor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningJob" ADD CONSTRAINT "LearningJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningJobItem" ADD CONSTRAINT "LearningJobItem_learningJobId_fkey" FOREIGN KEY ("learningJobId") REFERENCES "LearningJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationRecomputeJob" ADD CONSTRAINT "RecommendationRecomputeJob_learningJobId_fkey" FOREIGN KEY ("learningJobId") REFERENCES "LearningJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationRecomputeJob" ADD CONSTRAINT "RecommendationRecomputeJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
