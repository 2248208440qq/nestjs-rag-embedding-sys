CREATE TYPE "AgentType" AS ENUM (
  'legal_qa',
  'legal_research',
  'document_review'
);

CREATE TYPE "AgentSessionStatus" AS ENUM (
  'active',
  'archived'
);

CREATE TYPE "AgentMessageRole" AS ENUM (
  'system',
  'user',
  'assistant',
  'tool'
);

CREATE TYPE "AgentMessageStatus" AS ENUM (
  'pending',
  'running',
  'completed',
  'failed'
);

CREATE TYPE "AgentMemoryType" AS ENUM (
  'short_summary',
  'long_term_fact',
  'user_preference',
  'case_context'
);

CREATE TABLE "agent_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID,
  "title" TEXT,
  "agent_type" "AgentType" NOT NULL DEFAULT 'legal_qa',
  "status" "AgentSessionStatus" NOT NULL DEFAULT 'active',
  "knowledge_base_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_id" UUID NOT NULL,
  "role" "AgentMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "status" "AgentMessageStatus" NOT NULL DEFAULT 'completed',
  "citations" JSONB NOT NULL DEFAULT '[]',
  "tool_calls" JSONB NOT NULL DEFAULT '[]',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_memories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID,
  "session_id" UUID,
  "type" "AgentMemoryType" NOT NULL,
  "content" TEXT NOT NULL,
  "summary" TEXT,
  "embedding" vector(1024),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "agent_memories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_traces" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_id" UUID,
  "message_id" UUID,
  "agent_type" TEXT NOT NULL,
  "input" JSONB NOT NULL DEFAULT '{}',
  "output" JSONB NOT NULL DEFAULT '{}',
  "tool_calls" JSONB NOT NULL DEFAULT '[]',
  "prompt_snapshot" JSONB NOT NULL DEFAULT '{}',
  "model_info" JSONB NOT NULL DEFAULT '{}',
  "error" TEXT,
  "latency_ms" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "agent_traces_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_sessions_user_id_idx" ON "agent_sessions"("user_id");
CREATE INDEX "agent_sessions_agent_type_idx" ON "agent_sessions"("agent_type");
CREATE INDEX "agent_sessions_status_idx" ON "agent_sessions"("status");

CREATE INDEX "agent_messages_session_id_idx" ON "agent_messages"("session_id");
CREATE INDEX "agent_messages_role_idx" ON "agent_messages"("role");
CREATE INDEX "agent_messages_status_idx" ON "agent_messages"("status");

CREATE INDEX "agent_memories_user_id_idx" ON "agent_memories"("user_id");
CREATE INDEX "agent_memories_session_id_idx" ON "agent_memories"("session_id");
CREATE INDEX "agent_memories_type_idx" ON "agent_memories"("type");

CREATE INDEX "agent_traces_session_id_idx" ON "agent_traces"("session_id");
CREATE INDEX "agent_traces_message_id_idx" ON "agent_traces"("message_id");
CREATE INDEX "agent_traces_agent_type_idx" ON "agent_traces"("agent_type");

ALTER TABLE "agent_messages"
  ADD CONSTRAINT "agent_messages_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "agent_sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "agent_memories_embedding_idx"
ON "agent_memories"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);
