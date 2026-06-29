import type {
  CreateKnowledgeDocumentRequest,
  DocumentUploadResponse,
  CreateIndexJobResponse,
  KnowledgeDocument,
} from './types';

import { ragDelete, ragGet, ragPost, ragPostForm } from './http';
import { requestClient } from '#/api/request';

export function fetchDocuments() {
  return ragGet<KnowledgeDocument[]>('/documents');
}

export function fetchDocument(id: string) {
  return ragGet<KnowledgeDocument>(`/documents/${id}`);
}

export function downloadDocumentFile(id: string) {
  return requestClient.download<Blob>(`/documents/${id}/file`);
}

export function uploadDocument(
  file: File,
  data?: CreateKnowledgeDocumentRequest,
) {
  const formData = new FormData();
  formData.append('file', file);

  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        return;
      }
      formData.append(
        key,
        Array.isArray(value) ? value.join(',') : String(value),
      );
    });
  }

  return ragPostForm<DocumentUploadResponse>('/documents/upload', formData);
}

export function extractDocument(id: string) {
  return ragPost<CreateIndexJobResponse>(`/documents/${id}/extract`);
}

export function indexDocument(id: string) {
  return ragPost<CreateIndexJobResponse>(`/documents/${id}/index`);
}

export function deleteDocument(id: string) {
  return ragDelete<CreateIndexJobResponse>(`/documents/${id}`);
}
