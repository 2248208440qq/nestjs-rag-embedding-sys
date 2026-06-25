import type { EvaluationCase, EvaluationRun } from '@repo/shared-types';

export function toEvaluationCase(input: {
  createdAt: Date;
  difficulty: string | null;
  expectedArticleRefs: string[];
  expectedChunkIds: string[];
  expectedDocumentIds: string[];
  expectedKeywords: string[];
  id: string;
  query: string;
  tags: string[];
  updatedAt: Date;
}): EvaluationCase {
  return {
    id: input.id,
    query: input.query,
    expectedDocumentIds: input.expectedDocumentIds,
    expectedChunkIds: input.expectedChunkIds,
    expectedArticleRefs: input.expectedArticleRefs,
    expectedKeywords: input.expectedKeywords,
    difficulty: input.difficulty ?? undefined,
    tags: input.tags,
    createdAt: input.createdAt.toISOString(),
    updatedAt: input.updatedAt.toISOString(),
  };
}

export function toEvaluationRun(input: {
  caseId: string | null;
  createdAt: Date;
  id: string;
  metrics: unknown;
  query: string;
  resultSnapshot: unknown;
  searchParams: unknown;
  topK: number;
}): EvaluationRun {
  return {
    id: input.id,
    caseId: input.caseId ?? undefined,
    query: input.query,
    topK: input.topK,
    searchParams:
      input.searchParams && typeof input.searchParams === 'object'
        ? (input.searchParams as Record<string, unknown>)
        : {},
    resultSnapshot: Array.isArray(input.resultSnapshot) ? input.resultSnapshot : [],
    metrics:
      input.metrics && typeof input.metrics === 'object'
        ? (input.metrics as EvaluationRun['metrics'])
        : {
            hitAtK: false,
            matchedArticleRefs: [],
            matchedChunkIds: [],
            matchedDocumentIds: [],
            precisionAtK: 0,
            recallAtK: 0,
            reciprocalRank: 0,
          },
    createdAt: input.createdAt.toISOString(),
  };
}
