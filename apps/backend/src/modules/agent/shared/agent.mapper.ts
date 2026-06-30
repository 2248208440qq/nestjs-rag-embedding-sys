import type {
  AgentMessage,
  AgentMessageRole,
  AgentMessageSource,
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
  sources?: SourceRow[];
  status: AgentMessageStatus;
  toolCalls: unknown;
  traces?: TraceRow[];
}

interface SourceRow {
  articleNo: string | null;
  chunkId: string;
  content: string;
  createdAt: Date;
  documentId: string;
  id: string;
  index: number;
  matchType: string | null;
  metadata: unknown;
  score: number;
  sectionPath: string | null;
  title: string;
}

interface TraceRow {
  id: string;
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
  const metadata = toRecord(row.metadata);

  return {
    citations: toArray<QaCitation>(row.citations),
    citationValidation: toCitationValidation(metadata.citationValidation),
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    fallbackUsed:
      typeof metadata.fallbackUsed === 'boolean'
        ? metadata.fallbackUsed
        : undefined,
    id: row.id,
    metadata,
    modelInfo: toModelInfo(metadata.modelInfo),
    role: row.role,
    sessionId: row.sessionId,
    sources: (row.sources ?? []).map(toAgentMessageSource),
    status: row.status,
    toolCalls: toArray<Record<string, unknown>>(row.toolCalls),
    traceId: row.traces?.[0]?.id,
  };
}

function toAgentMessageSource(row: SourceRow): AgentMessageSource {
  return {
    articleNo: row.articleNo ?? undefined,
    chunkId: row.chunkId,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    documentId: row.documentId,
    id: row.id,
    index: row.index,
    matchType: toMatchType(row.matchType),
    metadata: toRecord(row.metadata),
    score: row.score,
    sectionPath: row.sectionPath ?? undefined,
    title: row.title,
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

function toCitationValidation(value: unknown) {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;

  return {
    passed: Boolean(record.passed),
    warnings: toArray<string>(record.warnings),
  };
}

function toModelInfo(value: unknown) {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;

  if (typeof record.model !== 'string' || typeof record.provider !== 'string') {
    return undefined;
  }

  return {
    model: record.model,
    provider: record.provider,
  };
}

function toMatchType(value: string | null) {
  if (value === 'hybrid' || value === 'keyword' || value === 'vector') {
    return value;
  }

  return undefined;
}
