import type { SearchResult } from './search';

export interface EvaluationCase {
  id: string;
  query: string;
  expectedDocumentIds: string[];
  expectedChunkIds: string[];
  expectedArticleRefs: string[];
  expectedKeywords: string[];
  tags: string[];
  difficulty?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationRun {
  id: string;
  caseId?: string;
  query: string;
  topK: number;
  searchParams: Record<string, unknown>;
  resultSnapshot: SearchResult[];
  metrics: EvaluationMetrics;
  createdAt: string;
}

export interface EvaluationMetrics {
  hitAtK: boolean;
  matchedArticleRefs: string[];
  matchedChunkIds: string[];
  matchedDocumentIds: string[];
  precisionAtK: number;
  recallAtK: number;
  reciprocalRank: number;
}

export interface CreateEvaluationCaseRequest {
  difficulty?: string;
  expectedArticleRefs?: string[];
  expectedChunkIds?: string[];
  expectedDocumentIds?: string[];
  expectedKeywords?: string[];
  query: string;
  tags?: string[];
}

export interface RunEvaluationRequest {
  caseId?: string;
  query?: string;
  topK?: number;
}
