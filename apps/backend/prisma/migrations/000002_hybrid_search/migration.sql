CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "knowledge_document_chunks_content_trgm_idx"
  ON "knowledge_document_chunks"
  USING gin ("content" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "knowledge_document_chunks_article_no_trgm_idx"
  ON "knowledge_document_chunks"
  USING gin ("article_no" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "knowledge_document_chunks_section_path_trgm_idx"
  ON "knowledge_document_chunks"
  USING gin ("section_path" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "knowledge_documents_title_trgm_idx"
  ON "knowledge_documents"
  USING gin ("title" gin_trgm_ops);
