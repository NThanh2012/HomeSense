CREATE TYPE "UserBehaviorEventType" AS ENUM (
    'PROPERTY_VIEW',
    'PROPERTY_SAVE',
    'PROPERTY_UNSAVE',
    'INQUIRY_CREATED',
    'SEARCH',
    'FILTER_APPLIED',
    'RECOMMENDATION_VIEW',
    'RECOMMENDATION_CLICK',
    'RECOMMENDATION_SAVE',
    'RECOMMENDATION_DISMISS',
    'RECOMMENDATION_CONTACT'
);

CREATE TABLE "UserBehaviorEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "demandId" TEXT,
    "matchId" TEXT,
    "eventType" "UserBehaviorEventType" NOT NULL,
    "keyword" TEXT,
    "filters" JSONB,
    "metadata" JSONB,
    "eventKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBehaviorEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserPreferenceProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredTransactionTypes" JSONB NOT NULL DEFAULT '{}',
    "preferredPropertyTypes" JSONB NOT NULL DEFAULT '{}',
    "preferredLocations" JSONB NOT NULL DEFAULT '{}',
    "keywords" JSONB NOT NULL DEFAULT '{}',
    "preferredMinPrice" DECIMAL(18,2),
    "preferredMaxPrice" DECIMAL(18,2),
    "preferredMinArea" DOUBLE PRECISION,
    "preferredMaxArea" DOUBLE PRECISION,
    "lastComputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferenceProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserBehaviorEvent_eventKey_key" ON "UserBehaviorEvent"("eventKey");
CREATE INDEX "UserBehaviorEvent_userId_idx" ON "UserBehaviorEvent"("userId");
CREATE INDEX "UserBehaviorEvent_eventType_idx" ON "UserBehaviorEvent"("eventType");
CREATE INDEX "UserBehaviorEvent_propertyId_idx" ON "UserBehaviorEvent"("propertyId");
CREATE INDEX "UserBehaviorEvent_demandId_idx" ON "UserBehaviorEvent"("demandId");
CREATE INDEX "UserBehaviorEvent_matchId_idx" ON "UserBehaviorEvent"("matchId");
CREATE INDEX "UserBehaviorEvent_createdAt_idx" ON "UserBehaviorEvent"("createdAt");
CREATE UNIQUE INDEX "UserPreferenceProfile_userId_key" ON "UserPreferenceProfile"("userId");

ALTER TABLE "UserBehaviorEvent" ADD CONSTRAINT "UserBehaviorEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBehaviorEvent" ADD CONSTRAINT "UserBehaviorEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserBehaviorEvent" ADD CONSTRAINT "UserBehaviorEvent_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "UserDemand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserBehaviorEvent" ADD CONSTRAINT "UserBehaviorEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "DemandPropertyMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserPreferenceProfile" ADD CONSTRAINT "UserPreferenceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
