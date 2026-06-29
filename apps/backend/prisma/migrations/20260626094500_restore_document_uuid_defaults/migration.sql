-- The RBAC migration changed column types and unintentionally removed these
-- database-level UUID defaults. Raw chunk inserts rely on the database default.
ALTER TABLE "knowledge_document_chunks"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "knowledge_documents"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
