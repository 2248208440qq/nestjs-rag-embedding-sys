export type KnowledgeDocumentStatus =
  | 'failed'
  | 'indexed'
  | 'parsed'
  | 'uploaded';

export type KnowledgeDocumentSourceType =
  | 'case'
  | 'contract'
  | 'internal'
  | 'judicial_interpretation'
  | 'law'
  | 'other';

export interface KnowledgeDocument {
  authority?: string;
  createdAt: string;
  effectiveDate?: string;
  id: string;
  jurisdiction?: string;
  mimeType?: string;
  originalFileName?: string;
  publishDate?: string;
  size?: number;
  sourceType: KnowledgeDocumentSourceType;
  status: KnowledgeDocumentStatus;
  tags: string[];
  title: string;
  updatedAt: string;
  version?: string;
}

export interface CreateKnowledgeDocumentRequest {
  authority?: string;
  effectiveDate?: string;
  jurisdiction?: string;
  publishDate?: string;
  sourceType?: KnowledgeDocumentSourceType;
  tags?: string[];
  title?: string;
  version?: string;
}

export interface DocumentUploadResponse {
  document: KnowledgeDocument;
}

export interface DocumentExtractionResponse {
  documentId: string;
  extractedTextLength: number;
}

export interface DocumentIndexResponse {
  chunkCount: number;
  documentId: string;
  embeddedCount: number;
}

export interface DocumentDeleteResponse {
  deletedChunks: number;
  deletedFile: boolean;
  documentId: string;
  storagePath?: string;
}

export interface SearchRequest {
  documentIds?: string[];
  query: string;
  sourceTypes?: string[];
  topK?: number;
}

export interface SearchResult {
  articleNo?: string;
  chunkId: string;
  content: string;
  documentId: string;
  matchType?: 'hybrid' | 'keyword' | 'vector';
  metadata: Record<string, unknown>;
  score: number;
  scores?: {
    keyword?: number;
    rrf?: number;
    vector?: number;
  };
  sectionPath?: string;
  title: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}
