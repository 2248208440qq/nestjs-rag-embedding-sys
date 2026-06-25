export type KnowledgeDocumentStatus =
  | 'failed'
  | 'indexed'
  | 'indexing'
  | 'parsed'
  | 'parsing'
  | 'uploaded';

export type KnowledgeDocumentSourceType =
  | 'law'
  | 'judicial_interpretation'
  | 'case'
  | 'contract'
  | 'internal'
  | 'other';

export interface KnowledgeDocument {
  id: string;
  title: string;
  sourceType: KnowledgeDocumentSourceType;
  status: KnowledgeDocumentStatus;
  originalFileName?: string;
  mimeType?: string;
  size?: number;
  authority?: string;
  jurisdiction?: string;
  publishDate?: string;
  effectiveDate?: string;
  version?: string;
  tags: string[];
  knowledgeBaseIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeDocumentRequest {
  title?: string;
  sourceType?: KnowledgeDocumentSourceType;
  authority?: string;
  jurisdiction?: string;
  publishDate?: string;
  effectiveDate?: string;
  version?: string;
  tags?: string[];
}

export interface KnowledgeDocumentChunk {
  id: string;
  documentId: string;
  content: string;
  sectionPath?: string;
  articleNo?: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DocumentUploadResponse {
  document: KnowledgeDocument;
}

export interface DocumentExtractionResponse {
  documentId: string;
  extractedTextLength: number;
  jobId?: string;
}

export interface DocumentIndexResponse {
  documentId: string;
  chunkCount: number;
  embeddedCount: number;
  jobId?: string;
}

export interface DocumentDeleteResponse {
  documentId: string;
  deletedChunks: number;
  deletedFile: boolean;
  jobId?: string;
  storagePath?: string;
}
