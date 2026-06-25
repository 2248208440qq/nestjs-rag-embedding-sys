ALTER TYPE "KnowledgeDocumentStatus" ADD VALUE IF NOT EXISTS 'parsing';
ALTER TYPE "KnowledgeDocumentStatus" ADD VALUE IF NOT EXISTS 'indexing';

CREATE TYPE "IndexJobType" AS ENUM (
  'parse_document',
  'chunk_document',
  'generate_embeddings',
  'rebuild_document_index',
  'rebuild_all_indexes',
  'delete_document_index'
);

CREATE TYPE "IndexJobStatus" AS ENUM (
  'pending',
  'running',
  'succeeded',
  'failed',
  'canceled'
);

CREATE TYPE "KnowledgeBaseStatus" AS ENUM ('active', 'archived');

CREATE TABLE "index_jobs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "document_id" UUID,
  "type" "IndexJobType" NOT NULL,
  "status" "IndexJobStatus" NOT NULL DEFAULT 'pending',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "current_step" TEXT,
  "error_message" TEXT,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "result" JSONB NOT NULL DEFAULT '{}',
  "started_at" TIMESTAMP(3),
  "finished_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "index_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "index_jobs_document_id_idx" ON "index_jobs"("document_id");
CREATE INDEX "index_jobs_status_idx" ON "index_jobs"("status");
CREATE INDEX "index_jobs_type_idx" ON "index_jobs"("type");

ALTER TABLE "index_jobs"
  ADD CONSTRAINT "index_jobs_document_id_fkey"
  FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "evaluation_cases" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "query" TEXT NOT NULL,
  "expected_document_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "expected_chunk_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "expected_article_refs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "expected_keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "difficulty" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "evaluation_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evaluation_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "case_id" UUID,
  "query" TEXT NOT NULL,
  "top_k" INTEGER NOT NULL DEFAULT 20,
  "search_params" JSONB NOT NULL DEFAULT '{}',
  "result_snapshot" JSONB NOT NULL DEFAULT '[]',
  "metrics" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evaluation_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "evaluation_runs_case_id_idx" ON "evaluation_runs"("case_id");

ALTER TABLE "evaluation_runs"
  ADD CONSTRAINT "evaluation_runs_case_id_fkey"
  FOREIGN KEY ("case_id") REFERENCES "evaluation_cases"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "knowledge_bases" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "status" "KnowledgeBaseStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "knowledge_bases_code_key" ON "knowledge_bases"("code");

CREATE TABLE "knowledge_base_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "knowledge_base_id" UUID NOT NULL,
  "document_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_base_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "knowledge_base_documents_knowledge_base_id_document_id_key"
  ON "knowledge_base_documents"("knowledge_base_id", "document_id");
CREATE INDEX "knowledge_base_documents_document_id_idx"
  ON "knowledge_base_documents"("document_id");

ALTER TABLE "knowledge_base_documents"
  ADD CONSTRAINT "knowledge_base_documents_knowledge_base_id_fkey"
  FOREIGN KEY ("knowledge_base_id") REFERENCES "knowledge_bases"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_base_documents"
  ADD CONSTRAINT "knowledge_base_documents_document_id_fkey"
  FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "qa_traces" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "search_params" JSONB NOT NULL DEFAULT '{}',
  "source_snapshot" JSONB NOT NULL DEFAULT '[]',
  "citations" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "qa_traces_pkey" PRIMARY KEY ("id")
);
