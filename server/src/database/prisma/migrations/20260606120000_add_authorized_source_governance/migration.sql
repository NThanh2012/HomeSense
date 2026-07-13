CREATE TYPE "DataSourceType" AS ENUM (
    'FACEBOOK',
    'WEBSITE',
    'PARTNER_API',
    'MANUAL_IMPORT',
    'USER_SUBMITTED',
    'PUBLIC_DATASET',
    'DEV_SYNTHETIC',
    'OTHER'
);

CREATE TYPE "DataPermissionType" AS ENUM (
    'AUTHORIZED_API',
    'PARTNER_AGREEMENT',
    'USER_SUBMITTED',
    'PUBLIC_ALLOWED',
    'DEV_SYNTHETIC',
    'UNKNOWN'
);

CREATE TYPE "SourceImportType" AS ENUM ('JSON');
CREATE TYPE "SourceImportTargetType" AS ENUM ('PROPERTY_POST', 'USER_SIGNAL');
CREATE TYPE "SourceImportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED');
CREATE TYPE "SourceImportRecordStatus" AS ENUM ('CREATED', 'SKIPPED', 'FAILED');

CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" "DataSourceType" NOT NULL,
    "platform" TEXT,
    "baseUrl" TEXT,
    "description" TEXT,
    "permissionType" "DataPermissionType" NOT NULL,
    "permissionNote" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SourceImportBatch" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "importType" "SourceImportType" NOT NULL DEFAULT 'JSON',
    "targetType" "SourceImportTargetType" NOT NULL,
    "status" "SourceImportStatus" NOT NULL DEFAULT 'PROCESSING',
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SourceImportRecord" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "recordIndex" INTEGER NOT NULL,
    "rawRecordId" TEXT,
    "externalId" TEXT,
    "status" "SourceImportRecordStatus" NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceImportRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DataSource_sourceType_idx" ON "DataSource"("sourceType");
CREATE INDEX "DataSource_permissionType_idx" ON "DataSource"("permissionType");
CREATE INDEX "DataSource_isActive_idx" ON "DataSource"("isActive");
CREATE INDEX "DataSource_createdByUserId_idx" ON "DataSource"("createdByUserId");

CREATE INDEX "SourceImportBatch_dataSourceId_idx" ON "SourceImportBatch"("dataSourceId");
CREATE INDEX "SourceImportBatch_targetType_idx" ON "SourceImportBatch"("targetType");
CREATE INDEX "SourceImportBatch_status_idx" ON "SourceImportBatch"("status");
CREATE INDEX "SourceImportBatch_createdByUserId_idx" ON "SourceImportBatch"("createdByUserId");
CREATE INDEX "SourceImportBatch_createdAt_idx" ON "SourceImportBatch"("createdAt");

CREATE UNIQUE INDEX "SourceImportRecord_batchId_recordIndex_key" ON "SourceImportRecord"("batchId", "recordIndex");
CREATE INDEX "SourceImportRecord_batchId_idx" ON "SourceImportRecord"("batchId");
CREATE INDEX "SourceImportRecord_status_idx" ON "SourceImportRecord"("status");
CREATE INDEX "SourceImportRecord_rawRecordId_idx" ON "SourceImportRecord"("rawRecordId");

ALTER TABLE "DataSource"
    ADD CONSTRAINT "DataSource_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SourceImportBatch"
    ADD CONSTRAINT "SourceImportBatch_dataSourceId_fkey"
    FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SourceImportBatch"
    ADD CONSTRAINT "SourceImportBatch_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SourceImportRecord"
    ADD CONSTRAINT "SourceImportRecord_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "SourceImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
