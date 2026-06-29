-- Refresh tokens are stored in Redis. The old database table is no longer used.
DROP TABLE IF EXISTS "refresh_tokens";

-- Remove legacy index-job task types from the PostgreSQL enum.
-- Existing legacy rows are preserved as rebuild_document_index jobs and annotated
-- in result.migratedFromType before the enum is recreated.
UPDATE "index_jobs"
SET
  "result" = COALESCE("result", '{}'::jsonb) || jsonb_build_object('migratedFromType', "type"::text),
  "type" = 'rebuild_document_index'
WHERE "type"::text IN ('chunk_document', 'generate_embeddings');

CREATE TYPE "IndexJobType_new" AS ENUM (
  'parse_document',
  'rebuild_document_index',
  'rebuild_all_indexes',
  'delete_document_index'
);

ALTER TABLE "index_jobs"
  ALTER COLUMN "type" TYPE "IndexJobType_new"
  USING ("type"::text::"IndexJobType_new");

DROP TYPE "IndexJobType";
ALTER TYPE "IndexJobType_new" RENAME TO "IndexJobType";
