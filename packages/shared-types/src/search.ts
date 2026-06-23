export interface SearchRequest {
  query: string;
  topK?: number;
  sourceTypes?: string[];
  documentIds?: string[];
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  title: string;
  content: string;
  score: number;
  matchType?: 'vector' | 'keyword' | 'hybrid';
  scores?: {
    vector?: number;
    keyword?: number;
    rrf?: number;
  };
  sectionPath?: string;
  articleNo?: string;
  metadata: Record<string, unknown>;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}
