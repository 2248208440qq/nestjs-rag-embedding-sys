export type KnowledgeDocumentStatus = 'uploaded' | 'parsed' | 'indexed' | 'failed';

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
}

export interface DocumentIndexResponse {
  documentId: string;
  chunkCount: number;
  embeddedCount: number;
}

export interface DocumentDeleteResponse {
  documentId: string;
  deletedChunks: number;
  deletedFile: boolean;
  storagePath?: string;
}
