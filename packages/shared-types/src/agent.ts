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

export interface AgentMessageSource {
  articleNo?: string;
  chunkId: string;
  content: string;
  createdAt: string;
  documentId: string;
  id: string;
  index: number;
  matchType?: SearchResult['matchType'];
  metadata: Record<string, unknown>;
  score: number;
  sectionPath?: string;
  title: string;
}

export interface AgentMessage {
  citations: QaCitation[];
  citationValidation?: {
    passed: boolean;
    warnings: string[];
  };
  content: string;
  createdAt: string;
  fallbackUsed?: boolean;
  id: string;
  metadata: Record<string, unknown>;
  modelInfo?: {
    model: string;
    provider: string;
  };
  role: AgentMessageRole;
  sessionId: string;
  sources: AgentMessageSource[];
  status: AgentMessageStatus;
  toolCalls: Record<string, unknown>[];
  traceId?: string;
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
  message: AgentMessage;
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
