-- CreateEnum
CREATE TYPE "DemandMatchStatus" AS ENUM ('ACTIVE', 'DISMISSED', 'CONTACTED');

-- CreateTable
CREATE TABLE "DemandPropertyMatch" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "matchReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scoreBreakdown" JSONB NOT NULL,
    "status" "DemandMatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandPropertyMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandPropertyMatch_demandId_idx" ON "DemandPropertyMatch"("demandId");

-- CreateIndex
CREATE INDEX "DemandPropertyMatch_propertyId_idx" ON "DemandPropertyMatch"("propertyId");

-- CreateIndex
CREATE INDEX "DemandPropertyMatch_matchScore_idx" ON "DemandPropertyMatch"("matchScore");

-- CreateIndex
CREATE INDEX "DemandPropertyMatch_status_idx" ON "DemandPropertyMatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DemandPropertyMatch_demandId_propertyId_key" ON "DemandPropertyMatch"("demandId", "propertyId");

-- AddForeignKey
ALTER TABLE "DemandPropertyMatch" ADD CONSTRAINT "DemandPropertyMatch_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "UserDemand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandPropertyMatch" ADD CONSTRAINT "DemandPropertyMatch_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
