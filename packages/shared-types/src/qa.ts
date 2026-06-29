import type { SearchResult } from './search';

export interface QaCitation {
  articleNo?: string;
  chunkId: string;
  documentId: string;
  sectionPath?: string;
  title: string;
}

export interface QaRequest {
  knowledgeBaseIds?: string[];
  question: string;
  topK?: number;
}

export interface QaResponse {
  answer: string;
  citations: QaCitation[];
  citationValidation?: {
    passed: boolean;
    warnings: string[];
  };
  fallbackUsed?: boolean;
  modelInfo?: {
    model: 'deepseek-v4-flash';
    provider: 'deepseek';
  };
  retrievalTraceId?: string;
  sourceChunks: SearchResult[];
}
