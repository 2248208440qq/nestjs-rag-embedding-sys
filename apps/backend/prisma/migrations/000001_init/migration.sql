CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "KnowledgeDocumentStatus" AS ENUM (
  'uploaded',
  'parsed',
  'indexed',
  'failed'
);

CREATE TYPE "KnowledgeDocumentSourceType" AS ENUM (
  'law',
  'judicial_interpretation',
  'case',
  'contract',
  'internal',
  'other'
);

CREATE TABLE "knowledge_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "sourceType" "KnowledgeDocumentSourceType" NOT NULL DEFAULT 'other',
  "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'uploaded',
  "original_file_name" text,
  "mime_type" text,
  "size" integer,
  "storage_path" text,
  "authority" text,
  "jurisdiction" text,
  "publish_date" timestamptz,
  "effective_date" timestamptz,
  "version" text,
  "tags" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "knowledge_document_chunks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id" uuid NOT NULL REFERENCES "knowledge_documents"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "section_path" text,
  "article_no" text,
  "chunk_index" integer NOT NULL,
  "embedding" vector(1024),
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "knowledge_document_chunks_document_id_idx"
  ON "knowledge_document_chunks"("document_id");

CREATE INDEX "knowledge_document_chunks_article_no_idx"
  ON "knowledge_document_chunks"("article_no");

CREATE INDEX "knowledge_document_chunks_embedding_hnsw_idx"
  ON "knowledge_document_chunks"
  USING hnsw ("embedding" vector_cosine_ops);
