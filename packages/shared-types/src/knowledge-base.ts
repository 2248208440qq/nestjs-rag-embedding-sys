export type KnowledgeBaseStatus = 'active' | 'archived';

export interface KnowledgeBase {
  id: string;
  name: string;
  code: string;
  description?: string;
  category?: string;
  status: KnowledgeBaseStatus;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeBaseRequest {
  category?: string;
  code: string;
  description?: string;
  name: string;
  status?: KnowledgeBaseStatus;
}

export interface UpdateKnowledgeBaseRequest {
  category?: string;
  description?: string;
  name?: string;
  status?: KnowledgeBaseStatus;
}

export interface BindKnowledgeBaseDocumentsRequest {
  documentIds: string[];
}
