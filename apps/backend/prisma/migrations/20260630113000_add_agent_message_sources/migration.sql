CREATE TABLE "agent_message_sources" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "message_id" UUID NOT NULL,
  "index" INTEGER NOT NULL,
  "chunk_id" UUID NOT NULL,
  "document_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "match_type" TEXT,
  "article_no" TEXT,
  "section_path" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "agent_message_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_message_sources_message_id_index_key"
  ON "agent_message_sources"("message_id", "index");

CREATE INDEX "agent_message_sources_message_id_idx"
  ON "agent_message_sources"("message_id");

CREATE INDEX "agent_message_sources_chunk_id_idx"
  ON "agent_message_sources"("chunk_id");

CREATE INDEX "agent_message_sources_document_id_idx"
  ON "agent_message_sources"("document_id");

ALTER TABLE "agent_message_sources"
  ADD CONSTRAINT "agent_message_sources_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "agent_messages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_traces"
  ADD CONSTRAINT "agent_traces_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "agent_messages"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
