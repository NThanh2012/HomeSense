-- Keep legacy properties unchanged while making every future direct insert review-first.
ALTER TABLE "Property" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
