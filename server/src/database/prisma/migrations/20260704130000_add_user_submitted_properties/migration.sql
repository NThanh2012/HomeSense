ALTER TYPE "PropertyStatus" ADD VALUE 'PENDING_REVIEW';

ALTER TABLE "Property" ADD COLUMN "createdByUserId" TEXT;

CREATE INDEX "Property_createdByUserId_idx" ON "Property"("createdByUserId");

ALTER TABLE "Property"
    ADD CONSTRAINT "Property_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
