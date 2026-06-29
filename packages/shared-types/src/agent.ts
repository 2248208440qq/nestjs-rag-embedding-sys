import type { QaCitation } from './qa';
import type { SearchResult } from './search';

export type AgentType = 'document_review' | 'legal_qa' | 'legal_research';

export type AgentSessionStatus = 'active' | 'archived';

export type AgentMessageRole = 'assistant' | 'system' | 'tool' | 'user';

export type AgentMessageStatus = 'completed' | 'failed' | 'pending' | 'running';

export type AgentMemoryType =
  | 'case_context'
  | 'long_term_fact'
  | 'short_summary'
  | 'user_preference';

export interface AgentSession {
  agentType: AgentType;
  createdAt: string;
  id: string;
  knowledgeBaseIds: string[];
  metadata: Record<string, unknown>;
  status: AgentSessionStatus;
  title?: string;
  updatedAt: string;
  userId?: string;
}

export interface AgentMessage {
  citations: QaCitation[];
  content: string;
  createdAt: string;
  id: string;
  metadata: Record<string, unknown>;
  role: AgentMessageRole;
  sessionId: string;
  status: AgentMessageStatus;
  toolCalls: Record<string, unknown>[];
}

export interface AgentChatRequest {
  agentType?: AgentType;
  knowledgeBaseIds?: string[];
  message: string;
  sessionId?: string;
  stream?: boolean;
  topK?: number;
}

export interface AgentChatResponse {
  answer: string;
  citations: QaCitation[];
  citationValidation?: {
    passed: boolean;
    warnings: string[];
  };
  fallbackUsed?: boolean;
  messageId: string;
  modelInfo?: {
    model: string;
    provider: string;
  };
  sessionId: string;
  sourceChunks: SearchResult[];
  traceId?: string;
}

export interface CreateAgentSessionRequest {
  agentType?: AgentType;
  knowledgeBaseIds?: string[];
  metadata?: Record<string, unknown>;
  title?: string;
}

export interface UpdateAgentSessionRequest {
  knowledgeBaseIds?: string[];
  metadata?: Record<string, unknown>;
  status?: AgentSessionStatus;
  title?: string;
}
