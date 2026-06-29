import type {
  AgentMessage,
  AgentMessageRole,
  AgentMessageStatus,
  AgentSession,
  AgentSessionStatus,
  AgentType,
  QaCitation,
} from '@repo/shared-types';

interface SessionRow {
  agentType: AgentType;
  createdAt: Date;
  id: string;
  knowledgeBaseIds: string[];
  metadata: unknown;
  status: AgentSessionStatus;
  title: string | null;
  updatedAt: Date;
  userId: string | null;
}

interface MessageRow {
  citations: unknown;
  content: string;
  createdAt: Date;
  id: string;
  metadata: unknown;
  role: AgentMessageRole;
  sessionId: string;
  status: AgentMessageStatus;
  toolCalls: unknown;
}

export function toAgentSession(row: SessionRow): AgentSession {
  return {
    agentType: row.agentType,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    knowledgeBaseIds: row.knowledgeBaseIds,
    metadata: toRecord(row.metadata),
    status: row.status,
    title: row.title ?? undefined,
    updatedAt: row.updatedAt.toISOString(),
    userId: row.userId ?? undefined,
  };
}

export function toAgentMessage(row: MessageRow): AgentMessage {
  return {
    citations: toArray<QaCitation>(row.citations),
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    metadata: toRecord(row.metadata),
    role: row.role,
    sessionId: row.sessionId,
    status: row.status,
    toolCalls: toArray<Record<string, unknown>>(row.toolCalls),
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
